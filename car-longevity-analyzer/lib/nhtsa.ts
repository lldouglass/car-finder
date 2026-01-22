const NHTSA_VIN_API = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const NHTSA_SAFETY_API = 'https://api.nhtsa.gov';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface VehicleDetails {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    device?: string; // Engine/Displacement
    bodyClass?: string;
    driveType?: string;
    fuelType?: string;
}

interface Recall {
    Component: string;
    Summary: string;
    Remedy: string;
    Conequence: string; // NHTSA typo? Check response. Usually 'Consequence'
    ModelYear: string;
    Make: string;
    Model: string;
    NHTSACampaignNumber: string;
    ReportReceivedDate: string;
}

interface Complaint {
    Component: string;
    Summary: string;
    DateOfIncident: string;
    Crash: boolean;
    Fire: boolean;
    Injuries: number;
    Deaths: number;
    Vin?: string;
}

interface SafetyRating {
    OverallRating: string;
    FrontalCrashRating: string;
    SideCrashRating: string;
    RolloverRating: string;
    NHTSAElectronicStabilityControl: string;
    ComplaintsCount: number;
    RecallsCount: number;
    InvestigationCount: number;
}

/**
 * Decodes a VIN to get vehicle details.
 * @param vin The VIN to decode.
 * @returns Parsed vehicle details.
 */
export async function decodeVin(vin: string): Promise<VehicleDetails | null> {
    await delay(100);
    try {
        const response = await fetch(
            `${NHTSA_VIN_API}/decodevin/${vin}?format=json`
        );
        if (!response.ok) throw new Error(`NHTSA API error: ${response.status}`);

        const data = await response.json();

        if (!data.Results) return null;

        // Parse Results array
        const results = data.Results.reduce((acc: any, item: any) => {
            if (item.Value && item.Value !== 'Not Applicable') {
                acc[item.Variable] = item.Value;
            }
            return acc;
        }, {});

        if (results['Error Code'] && results['Error Code'] !== '0') {
            console.warn(`VIN API returned error: ${results['Error Text']}`);
            return null; // Or throw
        }

        // Check minimal requirements
        if (!results['Model Year'] || !results['Make'] || !results['Model']) {
            return null;
        }

        return {
            vin,
            year: parseInt(results['Model Year']),
            make: results['Make'],
            model: results['Model'],
            trim: results['Trim'],
            device: results['Displacement (L)'] ? `${results['Displacement (L)']}L ${results['Engine Number of Cylinders']}-Cyl` : undefined,
            bodyClass: results['Body Class'],
            driveType: results['Drive Type'],
            fuelType: results['Fuel Type - Primary'],
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
    await delay(100);
    try {
        const encodedMake = encodeURIComponent(make);
        const encodedModel = encodeURIComponent(model);
        const response = await fetch(
            `${NHTSA_SAFETY_API}/recalls/recallsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${year}`
        );
        if (!response.ok) throw new Error(`NHTSA Recalls API error: ${response.status}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching recalls:', error);
        return [];
    }
}

/**
 * Fetches complaints for a specific vehicle.
 * @param make Vehicle make
 * @param model Vehicle model
 * @param year Vehicle year
 * @returns List of complaints.
 */
export async function getComplaints(make: string, model: string, year: number): Promise<Complaint[]> {
    await delay(100);
    try {
        const encodedMake = encodeURIComponent(make);
        const encodedModel = encodeURIComponent(model);
        const response = await fetch(
            `${NHTSA_SAFETY_API}/complaints/complaintsByVehicle?make=${encodedMake}&model=${encodedModel}&modelYear=${year}`
        );
        if (!response.ok) throw new Error(`NHTSA Complaints API error: ${response.status}`);
        const data = await response.json();
        return data.results || [];
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
    await delay(100);
    try {
        const encodedMake = encodeURIComponent(make);
        const encodedModel = encodeURIComponent(model);
        const response = await fetch(
            `${NHTSA_SAFETY_API}/SafetyRatings/modelyear/${year}/make/${encodedMake}/model/${encodedModel}`
        );
        if (!response.ok) throw new Error(`NHTSA Safety API error: ${response.status}`);
        const data = await response.json();

        // The API returns a list of variants (usually by VehicleId). 
        // We might need to select one or get details for the first one.
        // Usually the search returns variants.
        // Example response: { Count: 2, Results: [ { VehicleId: 123, VehicleDescription: ... } ] }

        const results = data.Results || [];
        if (results.length === 0) return null;

        // For simplicity, take the first variant's VehicleId and fetch details
        const vehicleId = results[0].VehicleId;

        await delay(100); // Another delay for the second call
        const detailResponse = await fetch(
            `${NHTSA_SAFETY_API}/SafetyRatings/VehicleId/${vehicleId}`
        );
        if (!detailResponse.ok) return null;
        const detailData = await detailResponse.json();
        const rating = detailData.Results?.[0];

        return rating ? {
            OverallRating: rating.OverallRating,
            FrontalCrashRating: rating.FrontalCrashRating,
            SideCrashRating: rating.SideCrashRating,
            RolloverRating: rating.RolloverRating,
            NHTSAElectronicStabilityControl: rating.NHTSAElectronicStabilityControl,
            ComplaintsCount: rating.ComplaintsCount,
            RecallsCount: rating.RecallsCount,
            InvestigationCount: rating.InvestigationCount
        } : null;

    } catch (error) {
        console.error('Error fetching safety ratings:', error);
        return null;
    }
}
