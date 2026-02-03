import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSafetyRatings, getRecalls, getComplaints, decodeVin, normalizeModelForNhtsa } from './nhtsa';

// Mock fetch globally
const originalFetch = global.fetch;

describe('NHTSA API - Make/Model/Year Uniqueness', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    describe('getSafetyRatings', () => {
        it('makes API request with correct make/model/year parameters', async () => {
            // Setup mock responses for the two-step API call
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        Results: [{ VehicleId: 12345 }],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        Results: [{
                            OverallRating: '5',
                            FrontalCrashRating: '5',
                            SideCrashRating: '5',
                            RolloverRating: '4',
                        }],
                    }),
                });

            await getSafetyRatings('Toyota', 'Camry', 2020);

            // Verify the first API call includes the correct parameters
            expect(fetchMock).toHaveBeenCalledTimes(2);
            const firstCallUrl = fetchMock.mock.calls[0][0];
            expect(firstCallUrl).toContain('modelyear/2020');
            expect(firstCallUrl).toContain('make/Toyota');
            expect(firstCallUrl).toContain('model/Camry');
        });

        it('different years produce different API requests', async () => {
            const years = [2018, 2019, 2020, 2021];

            for (const year of years) {
                fetchMock
                    .mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            Results: [{ VehicleId: year * 100 }],
                        }),
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            Results: [{
                                OverallRating: String(Math.min(5, year - 2015)),
                                FrontalCrashRating: '4',
                                SideCrashRating: '4',
                                RolloverRating: '3',
                            }],
                        }),
                    });
            }

            // Make requests for different years
            for (const year of years) {
                await getSafetyRatings('Honda', 'Civic', year);
            }

            // Verify each year made a unique API call
            const callUrls = fetchMock.mock.calls
                .filter((_, index) => index % 2 === 0) // Get first call of each pair
                .map(call => call[0]);

            expect(callUrls[0]).toContain('modelyear/2018');
            expect(callUrls[1]).toContain('modelyear/2019');
            expect(callUrls[2]).toContain('modelyear/2020');
            expect(callUrls[3]).toContain('modelyear/2021');
        });

        it('different models produce different API requests', async () => {
            const models = ['Camry', 'Corolla', 'RAV4', 'Highlander'];

            for (const model of models) {
                fetchMock
                    .mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            Results: [{ VehicleId: 10000 }],
                        }),
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            Results: [{ OverallRating: '5' }],
                        }),
                    });
            }

            for (const model of models) {
                await getSafetyRatings('Toyota', model, 2020);
            }

            const callUrls = fetchMock.mock.calls
                .filter((_, index) => index % 2 === 0)
                .map(call => call[0]);

            expect(callUrls[0]).toContain('model/Camry');
            expect(callUrls[1]).toContain('model/Corolla');
            expect(callUrls[2]).toContain('model/RAV4');
            expect(callUrls[3]).toContain('model/Highlander');
        });

        it('different makes produce different API requests', async () => {
            const makes = ['Toyota', 'Honda', 'Ford', 'Nissan'];

            for (const make of makes) {
                fetchMock
                    .mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            Results: [{ VehicleId: 10000 }],
                        }),
                    })
                    .mockResolvedValueOnce({
                        ok: true,
                        json: () => Promise.resolve({
                            Results: [{ OverallRating: '4' }],
                        }),
                    });
            }

            for (const make of makes) {
                await getSafetyRatings(make, 'Sedan', 2020);
            }

            const callUrls = fetchMock.mock.calls
                .filter((_, index) => index % 2 === 0)
                .map(call => call[0]);

            expect(callUrls[0]).toContain('make/Toyota');
            expect(callUrls[1]).toContain('make/Honda');
            expect(callUrls[2]).toContain('make/Ford');
            expect(callUrls[3]).toContain('make/Nissan');
        });

        it('returns null when vehicle has no safety ratings', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ Results: [] }),
            });

            const result = await getSafetyRatings('Unknown', 'Model', 2020);
            expect(result).toBeNull();
        });

        it('handles API errors gracefully', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const result = await getSafetyRatings('Toyota', 'Camry', 2020);
            expect(result).toBeNull();
        });

        it('URL encodes special characters in make/model', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        Results: [{ VehicleId: 10000 }],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        Results: [{ OverallRating: '4' }],
                    }),
                });

            await getSafetyRatings('Mercedes-Benz', 'C-Class', 2020);

            const firstCallUrl = fetchMock.mock.calls[0][0];
            expect(firstCallUrl).toContain('Mercedes-Benz');
            expect(firstCallUrl).toContain('C-Class');
        });
    });

    describe('getRecalls', () => {
        it('makes API request with correct make/model/year parameters', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: [] }),
            });

            await getRecalls('Toyota', 'Camry', 2020);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('make=Toyota');
            expect(callUrl).toContain('model=Camry');
            expect(callUrl).toContain('modelYear=2020');
        });

        it('different years request different recalls', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        results: [{ Component: '2018 recall', Summary: 'Recall for 2018' }],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        results: [
                            { Component: '2020 recall 1', Summary: 'Recall 1 for 2020' },
                            { Component: '2020 recall 2', Summary: 'Recall 2 for 2020' },
                        ],
                    }),
                });

            const recalls2018 = await getRecalls('Honda', 'Civic', 2018);
            const recalls2020 = await getRecalls('Honda', 'Civic', 2020);

            // Each year should have made its own request
            expect(fetchMock.mock.calls[0][0]).toContain('modelYear=2018');
            expect(fetchMock.mock.calls[1][0]).toContain('modelYear=2020');

            // And different results
            expect(recalls2018.length).toBe(1);
            expect(recalls2020.length).toBe(2);
        });

        it('returns empty array on API error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const result = await getRecalls('Unknown', 'Model', 2020);
            expect(result).toEqual([]);
        });
    });

    describe('getComplaints', () => {
        it('makes API request with correct make/model/year parameters', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: [] }),
            });

            await getComplaints('Toyota', 'Camry', 2020);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const callUrl = fetchMock.mock.calls[0][0];
            expect(callUrl).toContain('make=Toyota');
            expect(callUrl).toContain('model=Camry');
            expect(callUrl).toContain('modelYear=2020');
        });

        it('different years request different complaints', async () => {
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        results: Array(10).fill({ Component: 'ENGINE', Summary: 'Issue' }),
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        results: Array(50).fill({ Component: 'TRANSMISSION', Summary: 'Problem' }),
                    }),
                });

            const complaints2015 = await getComplaints('Nissan', 'Altima', 2015);
            const complaints2020 = await getComplaints('Nissan', 'Altima', 2020);

            expect(fetchMock.mock.calls[0][0]).toContain('modelYear=2015');
            expect(fetchMock.mock.calls[1][0]).toContain('modelYear=2020');

            expect(complaints2015.length).toBe(10);
            expect(complaints2020.length).toBe(50);
        });

        it('returns empty array on API error', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const result = await getComplaints('Unknown', 'Model', 2020);
            expect(result).toEqual([]);
        });
    });

    describe('decodeVin', () => {
        it('extracts make, model, year from VIN decode response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    Results: [
                        { Variable: 'Make', Value: 'Toyota' },
                        { Variable: 'Model', Value: 'Camry' },
                        { Variable: 'Model Year', Value: '2020' },
                        { Variable: 'Trim', Value: 'LE' },
                        { Variable: 'Body Class', Value: 'Sedan' },
                        { Variable: 'Drive Type', Value: 'FWD' },
                        { Variable: 'Fuel Type - Primary', Value: 'Gasoline' },
                        { Variable: 'Transmission Style', Value: 'Automatic' },
                    ],
                }),
            });

            const result = await decodeVin('1HGBH41JXMN109186');

            expect(result).not.toBeNull();
            expect(result?.make).toBe('Toyota');
            expect(result?.model).toBe('Camry');
            expect(result?.year).toBe(2020);
        });

        it('returns null for invalid VIN response', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    Results: [
                        { Variable: 'Error Code', Value: '6' },
                        { Variable: 'Error Text', Value: 'Invalid VIN' },
                    ],
                }),
            });

            const result = await decodeVin('INVALIDVIN');
            expect(result).toBeNull();
        });

        it('handles network errors gracefully', async () => {
            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            const result = await decodeVin('1HGBH41JXMN109186');
            expect(result).toBeNull();
        });
    });
});

describe('normalizeModelForNhtsa', () => {
    it('strips XV prefix from Subaru Crosstrek variants', () => {
        expect(normalizeModelForNhtsa('XV Crosstrek')).toBe('Crosstrek');
        expect(normalizeModelForNhtsa('XV Crosstrek Premium')).toBe('Crosstrek');
        expect(normalizeModelForNhtsa('xv crosstrek')).toBe('crosstrek');
    });

    it('handles models without XV prefix normally', () => {
        expect(normalizeModelForNhtsa('Crosstrek')).toBe('Crosstrek');
        expect(normalizeModelForNhtsa('Outback')).toBe('Outback');
        expect(normalizeModelForNhtsa('Forester')).toBe('Forester');
    });

    it('strips drive types from model names', () => {
        // Drive types are stripped when followed by whitespace or at end
        expect(normalizeModelForNhtsa('RAV4 4WD')).toBe('RAV4');
        expect(normalizeModelForNhtsa('Renegade 4x4')).toBe('Renegade');
        expect(normalizeModelForNhtsa('Highlander AWD')).toBe('Highlander');
    });
});

describe('Make/Model/Year Matrix - API Isolation', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('each make/model/year combination produces isolated API requests', async () => {
        const testCases = [
            { make: 'Toyota', model: 'Camry', year: 2018 },
            { make: 'Toyota', model: 'Camry', year: 2020 },
            { make: 'Toyota', model: 'Corolla', year: 2020 },
            { make: 'Honda', model: 'Civic', year: 2020 },
        ];

        // Setup mock responses
        for (let i = 0; i < testCases.length; i++) {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ results: [] }),
            });
        }

        // Make requests
        for (const tc of testCases) {
            await getComplaints(tc.make, tc.model, tc.year);
        }

        // Verify each request was unique
        const urls = fetchMock.mock.calls.map(call => call[0]);

        // Each URL should be unique
        const uniqueUrls = new Set(urls);
        expect(uniqueUrls.size).toBe(testCases.length);

        // Verify specific parameters
        expect(urls[0]).toContain('make=Toyota');
        expect(urls[0]).toContain('model=Camry');
        expect(urls[0]).toContain('modelYear=2018');

        expect(urls[1]).toContain('make=Toyota');
        expect(urls[1]).toContain('model=Camry');
        expect(urls[1]).toContain('modelYear=2020');

        expect(urls[2]).toContain('make=Toyota');
        expect(urls[2]).toContain('model=Corolla');
        expect(urls[2]).toContain('modelYear=2020');

        expect(urls[3]).toContain('make=Honda');
        expect(urls[3]).toContain('model=Civic');
        expect(urls[3]).toContain('modelYear=2020');
    });

    it('safety ratings for consecutive years are fetched independently', async () => {
        const years = [2018, 2019, 2020];

        // Fetch safety ratings sequentially for each year with fresh mocks
        for (const year of years) {
            // Setup mocks for this year's API calls
            fetchMock
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        Results: [{ VehicleId: year * 1000 }],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        Results: [{
                            OverallRating: String(Math.min(5, Math.max(1, year - 2016))),
                            FrontalCrashRating: '4',
                            SideCrashRating: '4',
                            RolloverRating: '3',
                        }],
                    }),
                });

            const result = await getSafetyRatings('Toyota', 'Camry', year);
            expect(result).not.toBeNull();
        }

        // Verify each year made separate API calls (2 calls per year = 6 total)
        expect(fetchMock).toHaveBeenCalledTimes(6);

        // Verify the URLs contain the correct years
        const firstCalls = [
            fetchMock.mock.calls[0][0],
            fetchMock.mock.calls[2][0],
            fetchMock.mock.calls[4][0],
        ];

        expect(firstCalls[0]).toContain('modelyear/2018');
        expect(firstCalls[1]).toContain('modelyear/2019');
        expect(firstCalls[2]).toContain('modelyear/2020');
    });
});
