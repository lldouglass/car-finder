import { z } from 'zod';
import { API_TIMEOUTS, VEHICLE_CONSTANTS } from './constants';

const NHTSA_VIN_API = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const NHTSA_SAFETY_API = 'https://api.nhtsa.gov';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Zod schemas for NHTSA API response validation
const VINDecodeResultSchema = z.object({
    Variable: z.string(),
    Value: z.string().nullable(),
});

const VINDecodeResponseSchema = z.object({
    Results: z.array(VINDecodeResultSchema),
});

const RecallSchema = z.object({
    Component: z.string().optional().default(''),
    Summary: z.string().optional().default(''),
    Remedy: z.string().optional().default(''),
    Conequence: z.string().optional().default(''), // NHTSA typo in their API
    ModelYear: z.string().optional().default(''),
    Make: z.string().optional().default(''),
    Model: z.string().optional().default(''),
    NHTSACampaignNumber: z.string().optional().default(''),
    ReportReceivedDate: z.string().optional().default(''),
});

const RecallsResponseSchema = z.object({
    results: z.array(RecallSchema).optional().default([]),
});

// NHTSA Complaints API uses lowercase field names (some can be null)
const ComplaintRawSchema = z.object({
    components: z.string().nullable().optional().default(''),
    summary: z.string().nullable().optional().default(''),
    dateOfIncident: z.string().nullable().optional().default(''),
    crash: z.boolean().nullable().optional().default(false),
    fire: z.boolean().nullable().optional().default(false),
    numberOfInjuries: z.number().nullable().optional().default(0),
    numberOfDeaths: z.number().nullable().optional().default(0),
    vin: z.string().nullable().optional(),
});

// Transform to our internal format (PascalCase for consistency)
// Handle null values by converting to appropriate defaults
const ComplaintSchema = ComplaintRawSchema.transform((raw) => ({
    Component: raw.components ?? '',
    Summary: raw.summary ?? '',
    DateOfIncident: raw.dateOfIncident ?? '',
    Crash: raw.crash ?? false,
    Fire: raw.fire ?? false,
    Injuries: raw.numberOfInjuries ?? 0,
    Deaths: raw.numberOfDeaths ?? 0,
    Vin: raw.vin ?? undefined,
}));

const ComplaintsResponseSchema = z.object({
    results: z.array(ComplaintSchema).optional().default([]),
});

const SafetyRatingVariantSchema = z.object({
    VehicleId: z.number(),
});

const SafetyRatingDetailSchema = z.object({
    OverallRating: z.string().optional().default('Not Rated'),
    OverallFrontCrashRating: z.string().optional().default('Not Rated'),
    OverallSideCrashRating: z.string().optional().default('Not Rated'),
    RolloverRating: z.string().optional().default('Not Rated'),
    NHTSAElectronicStabilityControl: z.string().optional().default(''),
    ComplaintsCount: z.number().optional().default(0),
    RecallsCount: z.number().optional().default(0),
    InvestigationCount: z.number().optional().default(0),
}).transform((data) => ({
    // Normalize field names for the rest of the app
    OverallRating: data.OverallRating,
    FrontalCrashRating: data.OverallFrontCrashRating,
    SideCrashRating: data.OverallSideCrashRating,
    RolloverRating: data.RolloverRating,
    NHTSAElectronicStabilityControl: data.NHTSAElectronicStabilityControl,
    ComplaintsCount: data.ComplaintsCount,
    RecallsCount: data.RecallsCount,
    InvestigationCount: data.InvestigationCount,
}));

// Export types derived from schemas
export type VehicleDetails = {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    device?: string;
    bodyClass?: string;
    driveType?: string;
    fuelType?: string;
    transmissionStyle?: string;
};

export type Recall = z.infer<typeof RecallSchema>;
export type Complaint = z.output<typeof ComplaintSchema>;
export type SafetyRating = z.output<typeof SafetyRatingDetailSchema>;

/**
 * Decodes a VIN to get vehicle details.
 * @param vin The VIN to decode.
 * @returns Parsed vehicle details.
 */
export async function decodeVin(vin: string): Promise<VehicleDetails | null> {
    await delay(API_TIMEOUTS.nhtsaDelay);
    try {
        const response = await fetch(
            `${NHTSA_VIN_API}/decodevin/${vin}?format=json`
        );
        if (!response.ok) throw new Error(`NHTSA API error: ${response.status}`);

        const data = await response.json();

        // Validate response structure
        const parseResult = VINDecodeResponseSchema.safeParse(data);
        if (!parseResult.success) {
            console.error('Invalid NHTSA VIN response structure');
            return null;
        }

        // Parse Results array into key-value pairs
        const results: Record<string, string> = {};
        for (const item of parseResult.data.Results) {
            if (item.Value && item.Value !== 'Not Applicable') {
                results[item.Variable] = item.Value;
            }
        }

        // Check minimal requirements first - if we have the essential data, proceed
        // Even if there are error codes (like check digit warnings), we can still use the data
        if (!results['Model Year'] || !results['Make'] || !results['Model']) {
            if (results['Error Code'] && results['Error Code'] !== '0') {
                console.warn(`VIN API returned error: ${results['Error Text']}`);
            }
            return null;
        }

        const year = parseInt(results['Model Year'], 10);
        const currentYear = new Date().getFullYear();

        // Validate year is reasonable
        if (isNaN(year) || year < VEHICLE_CONSTANTS.minVehicleYear || year > currentYear + 2) {
            console.warn(`Invalid model year: ${results['Model Year']}`);
            return null;
        }

        return {
            vin,
            year,
            make: results['Make'],
            model: results['Model'],
            trim: results['Trim'],
            device: results['Displacement (L)'] ? `${results['Displacement (L)']}L ${results['Engine Number of Cylinders']}-Cyl` : undefined,
            bodyClass: results['Body Class'],
            driveType: results['Drive Type'],
            fuelType: results['Fuel Type - Primary'],
            transmissionStyle: results['Transmission Style'],
        };
    } catch (error) {
        console.error('Error decoding VIN:', error);
        return null;
    }
}

/**
 * Fetches recalls for a specific vehicle.
 * @param make Vehicle make
 * @param model Vehicle model
 * @param year Vehicle year
 * @returns List of recalls.
 */
export async function getRecalls(make: string, model: string, year: number): Promise<Recall[]> {
    await delay(API_TIMEOUTS.nhtsaDelay);
    try {
        const encodedMake = encodeURIComponent(make);
        // Normalize model name to match NHTSA's format
        const normalizedModel = normalizeModelForNhtsa(model);
        const encodedModel = encodeURIComponent(normalizedModel);
        const response = await fetch(
            `${NHTSA_SAFETY_API}/recalls/recallsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${year}`
        );
        if (!response.ok) throw new Error(`NHTSA Recalls API error: ${response.status}`);
        const data = await response.json();

        // Validate response structure
        const parseResult = RecallsResponseSchema.safeParse(data);
        if (!parseResult.success) {
            console.error('Invalid NHTSA recalls response structure');
            return [];
        }

        return parseResult.data.results;
    } catch (error) {
        console.error('Error fetching recalls:', error);
        return [];
    }
}

/**
 * Normalizes model name for NHTSA API by stripping trim levels and variants.
 * NHTSA uses base model names (e.g., "RENEGADE" not "Renegade Latitude 4x4").
 */
function normalizeModelForNhtsa(model: string): string {
    // Common trim level patterns to remove
    const trimPatterns = [
        // Drive types
        /\s+(4x4|4wd|awd|fwd|rwd|2wd|4dr|2dr)\s*/gi,
        // Common trims
        /\s+(base|s|se|sel|sxt|sle|slt|lt|ltz|ls|lx|ex|ex-l|touring|sport|limited|premium|platinum|signature|denali|laredo|latitude|longitude|altitude|trailhawk|sahara|rubicon|overland|summit)\s*/gi,
        // Package/option codes
        /\s+(pkg|package|plus|pro|max)\s*/gi,
        // Door/body style at end
        /\s+(sedan|coupe|hatchback|wagon|suv|crossover|truck|van|convertible)\s*$/gi,
        // Engine specs
        /\s+\d+\.\d+l?\s*/gi,
        // Year ranges or model codes
        /\s+[a-z]?\d{2,4}[a-z]?\s*$/gi,
    ];

    let normalized = model;
    for (const pattern of trimPatterns) {
        normalized = normalized.replace(pattern, ' ');
    }

    // Clean up extra spaces and trim
    return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * Fetches complaints for a specific vehicle.
 * @param make Vehicle make
 * @param model Vehicle model
 * @param year Vehicle year
 * @returns List of complaints.
 */
export async function getComplaints(make: string, model: string, year: number): Promise<Complaint[]> {
    await delay(API_TIMEOUTS.nhtsaDelay);
    try {
        const encodedMake = encodeURIComponent(make);
        // Normalize model name to match NHTSA's format
        const normalizedModel = normalizeModelForNhtsa(model);
        const encodedModel = encodeURIComponent(normalizedModel);
        const response = await fetch(
            `${NHTSA_SAFETY_API}/complaints/complaintsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${year}`
        );
        if (!response.ok) throw new Error(`NHTSA Complaints API error: ${response.status}`);
        const data = await response.json();

        // Validate response structure
        const parseResult = ComplaintsResponseSchema.safeParse(data);
        if (!parseResult.success) {
            console.error('Invalid NHTSA complaints response structure');
            return [];
        }

        return parseResult.data.results;
    } catch (error) {
        console.error('Error fetching complaints:', error);
        return [];
    }
}

/**
 * Fetches safety ratings for a specific vehicle.
 * @param make Vehicle make
 * @param model Vehicle model
 * @param year Vehicle year
 * @returns Safety rating object.
 */
export async function getSafetyRatings(make: string, model: string, year: number): Promise<SafetyRating | null> {
    await delay(API_TIMEOUTS.nhtsaDelay);
    try {
        const encodedMake = encodeURIComponent(make);
        // Normalize model name to match NHTSA's format
        const normalizedModel = normalizeModelForNhtsa(model);
        const encodedModel = encodeURIComponent(normalizedModel);
        const response = await fetch(
            `${NHTSA_SAFETY_API}/SafetyRatings/modelyear/${year}/make/${encodedMake}/model/${encodedModel}`
        );
        if (!response.ok) throw new Error(`NHTSA Safety API error: ${response.status}`);
        const data = await response.json();

        // Validate that results exist and have the expected structure
        const results = data.Results;
        if (!Array.isArray(results) || results.length === 0) return null;

        // Validate first result has VehicleId
        const firstVariant = SafetyRatingVariantSchema.safeParse(results[0]);
        if (!firstVariant.success) {
            console.error('Invalid safety rating variant structure');
            return null;
        }

        const vehicleId = firstVariant.data.VehicleId;

        await delay(API_TIMEOUTS.nhtsaDelay);
        const detailResponse = await fetch(
            `${NHTSA_SAFETY_API}/SafetyRatings/VehicleId/${vehicleId}`
        );
        if (!detailResponse.ok) return null;
        const detailData = await detailResponse.json();

        if (!Array.isArray(detailData.Results) || detailData.Results.length === 0) {
            return null;
        }

        // Validate and parse the rating details
        const ratingResult = SafetyRatingDetailSchema.safeParse(detailData.Results[0]);
        if (!ratingResult.success) {
            console.error('Invalid safety rating detail structure');
            return null;
        }

        return ratingResult.data;

    } catch (error) {
        console.error('Error fetching safety ratings:', error);
        return null;
    }
}
