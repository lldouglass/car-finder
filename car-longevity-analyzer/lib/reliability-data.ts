export interface KnownIssue {
    description: string;
    repairCost: { low: number; high: number };
    mileageRange: { start: number; end: number };
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    component: 'engine' | 'transmission' | 'electrical' | 'suspension' | 'brakes' | 'body' | 'interior' | 'fuel' | 'cooling' | 'exhaust' | 'steering' | 'hvac';
    affectedYears?: number[];
}

export interface VehicleReliability {
    make: string;
    model: string;
    baseScore: number;
    expectedLifespanMiles: number;
    yearsToAvoid: number[];
    knownIssues?: KnownIssue[];
}

export const RELIABILITY_DATA: VehicleReliability[] = [
    // ============================================
    // TOYOTA - Generally highest reliability
    // ============================================
    { make: 'Toyota', model: 'Camry', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2008, 2009], knownIssues: [
        { description: '2.4L 2AZ-FE engine excessive oil consumption - requires frequent top-offs', repairCost: { low: 1000, high: 4000 }, mileageRange: { start: 60000, end: 150000 }, severity: 'major', component: 'engine', affectedYears: [2007, 2008, 2009, 2010, 2011] },
    ] },
    { make: 'Toyota', model: 'Corolla', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2009], knownIssues: [
        { description: 'Excessive oil consumption in 1.8L 2ZR-FE engine', repairCost: { low: 800, high: 3000 }, mileageRange: { start: 50000, end: 120000 }, severity: 'moderate', component: 'engine', affectedYears: [2009, 2010, 2011, 2012, 2013] },
    ] },
    { make: 'Toyota', model: 'RAV4', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2008, 2019], knownIssues: [
        { description: '2.5L Dynamic Force engine fuel pump defect causing stalling', repairCost: { low: 500, high: 1200 }, mileageRange: { start: 0, end: 50000 }, severity: 'major', component: 'fuel', affectedYears: [2019, 2020] },
    ] },
    { make: 'Toyota', model: 'Highlander', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2003, 2008] },
    { make: 'Toyota', model: 'Tacoma', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2016, 2017] },
    { make: 'Toyota', model: 'Tundra', baseScore: 9.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2008, 2012] },
    { make: 'Toyota', model: '4Runner', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2003, 2004] },
    { make: 'Toyota', model: 'Prius', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2010, 2011, 2012] },
    { make: 'Toyota', model: 'Avalon', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2006, 2007] },
    { make: 'Toyota', model: 'Sienna', baseScore: 9.0, expectedLifespanMiles: 275000, yearsToAvoid: [2007, 2008, 2011] },
    { make: 'Toyota', model: 'Sequoia', baseScore: 9.0, expectedLifespanMiles: 300000, yearsToAvoid: [2003, 2004, 2005] },
    { make: 'Toyota', model: 'Land Cruiser', baseScore: 9.5, expectedLifespanMiles: 350000, yearsToAvoid: [] },
    { make: 'Toyota', model: 'Venza', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2009, 2010] },
    { make: 'Toyota', model: 'Yaris', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2008] },
    { make: 'Toyota', model: 'C-HR', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2018] },
    { make: 'Toyota', model: 'GR86', baseScore: 8.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Toyota', model: 'Supra', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Toyota', model: 'Crown', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },
    { make: 'Toyota', model: 'bZ4X', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2023] },
    { make: 'Toyota', model: 'Grand Highlander', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },

    // ============================================
    // LEXUS - Toyota luxury brand, excellent reliability
    // ============================================
    { make: 'Lexus', model: 'ES', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2007] },
    { make: 'Lexus', model: 'RX', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2008] },
    { make: 'Lexus', model: 'NX', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2015, 2022] },
    { make: 'Lexus', model: 'IS', baseScore: 9.0, expectedLifespanMiles: 275000, yearsToAvoid: [2006, 2007, 2014] },
    { make: 'Lexus', model: 'GX', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [] },
    { make: 'Lexus', model: 'LX', baseScore: 9.5, expectedLifespanMiles: 350000, yearsToAvoid: [] },
    { make: 'Lexus', model: 'LS', baseScore: 9.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2013] },
    { make: 'Lexus', model: 'GS', baseScore: 9.0, expectedLifespanMiles: 275000, yearsToAvoid: [2006, 2013] },
    { make: 'Lexus', model: 'RC', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },
    { make: 'Lexus', model: 'LC', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Lexus', model: 'UX', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [] },
    { make: 'Lexus', model: 'TX', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },

    // ============================================
    // HONDA - Very reliable, some years with issues
    // ============================================
    { make: 'Honda', model: 'Accord', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2008, 2009, 2010, 2013, 2014, 2015, 2016] },
    { make: 'Honda', model: 'Civic', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2001, 2002, 2006, 2016] },
    { make: 'Honda', model: 'CR-V', baseScore: 8.8, expectedLifespanMiles: 250000, yearsToAvoid: [2011, 2015, 2017, 2018, 2019], knownIssues: [
        { description: '1.5T engine oil dilution from fuel - oil level rises, gas smell in oil', repairCost: { low: 100, high: 500 }, mileageRange: { start: 5000, end: 50000 }, severity: 'moderate', component: 'engine', affectedYears: [2017, 2018, 2019] },
        { description: 'A/C condenser damage from road debris causing refrigerant leaks', repairCost: { low: 600, high: 1200 }, mileageRange: { start: 20000, end: 80000 }, severity: 'moderate', component: 'hvac', affectedYears: [2017, 2018, 2019, 2020, 2021] },
    ] },
    { make: 'Honda', model: 'Pilot', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2003, 2005, 2016], knownIssues: [
        { description: '9-speed transmission rough shifting and hesitation', repairCost: { low: 200, high: 3000 }, mileageRange: { start: 10000, end: 80000 }, severity: 'moderate', component: 'transmission', affectedYears: [2016, 2017, 2018, 2019] },
    ] },
    { make: 'Honda', model: 'Odyssey', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2002, 2003, 2011, 2014, 2018], knownIssues: [
        { description: 'Transmission failure in early models with 4-speed auto', repairCost: { low: 2500, high: 4500 }, mileageRange: { start: 80000, end: 140000 }, severity: 'critical', component: 'transmission', affectedYears: [1999, 2000, 2001, 2002, 2003, 2004] },
        { description: '10-speed transmission surging and hesitation', repairCost: { low: 200, high: 3500 }, mileageRange: { start: 10000, end: 60000 }, severity: 'moderate', component: 'transmission', affectedYears: [2018, 2019, 2020] },
    ] },
    { make: 'Honda', model: 'HR-V', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2016, 2017] },
    { make: 'Honda', model: 'Passport', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Honda', model: 'Ridgeline', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2006, 2007, 2017] },
    { make: 'Honda', model: 'Fit', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2008, 2015] },
    { make: 'Honda', model: 'Insight', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2010, 2011] },
    { make: 'Honda', model: 'Element', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2007] },
    { make: 'Honda', model: 'Prologue', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },

    // ============================================
    // ACURA - Honda luxury brand
    // ============================================
    { make: 'Acura', model: 'TLX', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2015, 2021] },
    { make: 'Acura', model: 'MDX', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2004, 2007, 2014, 2016] },
    { make: 'Acura', model: 'RDX', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2013, 2019] },
    { make: 'Acura', model: 'ILX', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2013, 2014] },
    { make: 'Acura', model: 'Integra', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },
    { make: 'Acura', model: 'TL', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [2004, 2005, 2006] },
    { make: 'Acura', model: 'TSX', baseScore: 8.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },
    { make: 'Acura', model: 'ZDX', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },

    // ============================================
    // SUBARU - Good reliability, head gasket issues in older models
    // ============================================
    { make: 'Subaru', model: 'Outback', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2011, 2012, 2013, 2015, 2020], knownIssues: [
        { description: 'Head gasket failure - external oil leaks and coolant loss', repairCost: { low: 1500, high: 3000 }, mileageRange: { start: 80000, end: 150000 }, severity: 'major', component: 'engine', affectedYears: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009] },
        { description: 'CVT transmission judder and hesitation', repairCost: { low: 2500, high: 4500 }, mileageRange: { start: 70000, end: 120000 }, severity: 'major', component: 'transmission', affectedYears: [2015, 2016, 2017, 2018, 2019, 2020] },
    ] },
    { make: 'Subaru', model: 'Forester', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2011, 2014, 2015, 2019], knownIssues: [
        { description: 'Head gasket failure - external leaks, overheating', repairCost: { low: 1500, high: 3000 }, mileageRange: { start: 80000, end: 150000 }, severity: 'major', component: 'engine', affectedYears: [1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010] },
        { description: 'Excessive oil consumption in 2.5L FB25 engine', repairCost: { low: 2000, high: 4000 }, mileageRange: { start: 40000, end: 100000 }, severity: 'major', component: 'engine', affectedYears: [2011, 2012, 2013, 2014] },
    ] },
    { make: 'Subaru', model: 'Crosstrek', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2013, 2014, 2018] },
    { make: 'Subaru', model: 'Impreza', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2008, 2012, 2013] },
    { make: 'Subaru', model: 'WRX', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2008, 2013, 2015, 2022] },
    { make: 'Subaru', model: 'Legacy', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2010, 2011, 2013, 2015, 2020] },
    { make: 'Subaru', model: 'Ascent', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'Subaru', model: 'BRZ', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013] },
    { make: 'Subaru', model: 'Solterra', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2023] },

    // ============================================
    // MAZDA - Excellent reliability, SkyActiv engines very good
    // ============================================
    { make: 'Mazda', model: 'Mazda3', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2010, 2011, 2014] },
    { make: 'Mazda', model: '3', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2010, 2011, 2014] },
    { make: 'Mazda', model: 'Mazda6', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2009, 2014] },
    { make: 'Mazda', model: '6', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2009, 2014] },
    { make: 'Mazda', model: 'CX-5', baseScore: 8.8, expectedLifespanMiles: 225000, yearsToAvoid: [2014, 2016] },
    { make: 'Mazda', model: 'CX-9', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2008, 2010, 2016] },
    { make: 'Mazda', model: 'CX-30', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Mazda', model: 'CX-50', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Mazda', model: 'CX-70', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Mazda', model: 'CX-90', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2024] },
    { make: 'Mazda', model: 'MX-5 Miata', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2006] },
    { make: 'Mazda', model: 'MX-5', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2006] },
    { make: 'Mazda', model: 'Miata', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2006] },
    { make: 'Mazda', model: 'CX-3', baseScore: 8.5, expectedLifespanMiles: 200000, yearsToAvoid: [2016] },

    // ============================================
    // HYUNDAI - Improved significantly, engine issues in some years
    // ============================================
    { make: 'Hyundai', model: 'Sonata', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2015, 2016, 2017, 2018], knownIssues: [
        { description: 'Theta II engine failure - connecting rod bearing failure, engine seizure', repairCost: { low: 4000, high: 8000 }, mileageRange: { start: 60000, end: 150000 }, severity: 'critical', component: 'engine', affectedYears: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
        { description: 'Dual-clutch transmission (DCT) shuddering and jerking', repairCost: { low: 1500, high: 3000 }, mileageRange: { start: 30000, end: 80000 }, severity: 'major', component: 'transmission', affectedYears: [2011, 2012, 2013, 2014] },
    ] },
    { make: 'Hyundai', model: 'Elantra', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2017, 2018], knownIssues: [
        { description: 'Engine bearing failure in 1.8L/2.0L Nu engines', repairCost: { low: 3500, high: 6000 }, mileageRange: { start: 50000, end: 100000 }, severity: 'critical', component: 'engine', affectedYears: [2011, 2012, 2013, 2014, 2015, 2016] },
    ] },
    { make: 'Hyundai', model: 'Tucson', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2016, 2017], knownIssues: [
        { description: 'Theta II engine failure risk - sudden power loss, engine seizure', repairCost: { low: 4000, high: 7500 }, mileageRange: { start: 60000, end: 120000 }, severity: 'critical', component: 'engine', affectedYears: [2016, 2017, 2018, 2019, 2020, 2021] },
    ] },
    { make: 'Hyundai', model: 'Santa Fe', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2012, 2017, 2018, 2019], knownIssues: [
        { description: 'Theta II engine failure - manufacturing debris causing bearing failure', repairCost: { low: 4500, high: 8500 }, mileageRange: { start: 60000, end: 140000 }, severity: 'critical', component: 'engine', affectedYears: [2013, 2014, 2015, 2016, 2017, 2018, 2019] },
    ] },
    { make: 'Hyundai', model: 'Kona', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2018, 2019] },
    { make: 'Hyundai', model: 'Palisade', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2020, 2021] },
    { make: 'Hyundai', model: 'Venue', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Hyundai', model: 'Veloster', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2012, 2013, 2019] },
    { make: 'Hyundai', model: 'Ioniq', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2017] },
    { make: 'Hyundai', model: 'Ioniq 5', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Hyundai', model: 'Ioniq 6', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Hyundai', model: 'Santa Cruz', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Hyundai', model: 'Accent', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2012, 2013] },

    // ============================================
    // KIA - Sister brand to Hyundai, similar reliability
    // ============================================
    { make: 'Kia', model: 'Optima', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2015, 2016], knownIssues: [
        { description: 'Theta II engine failure - rod bearing damage causing engine seizure', repairCost: { low: 4000, high: 8000 }, mileageRange: { start: 60000, end: 150000 }, severity: 'critical', component: 'engine', affectedYears: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
    ] },
    { make: 'Kia', model: 'K5', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2021] },
    { make: 'Kia', model: 'Sorento', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2014, 2016], knownIssues: [
        { description: 'Theta II engine failure - metal debris causing bearing failure', repairCost: { low: 4500, high: 8500 }, mileageRange: { start: 60000, end: 140000 }, severity: 'critical', component: 'engine', affectedYears: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
    ] },
    { make: 'Kia', model: 'Sportage', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2017], knownIssues: [
        { description: 'Theta II engine defect - sudden power loss, potential fire risk', repairCost: { low: 4000, high: 7500 }, mileageRange: { start: 60000, end: 120000 }, severity: 'critical', component: 'engine', affectedYears: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021] },
    ] },
    { make: 'Kia', model: 'Telluride', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2020] },
    { make: 'Kia', model: 'Soul', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2012, 2014, 2020] },
    { make: 'Kia', model: 'Forte', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2012, 2013, 2017, 2019, 2020] },
    { make: 'Kia', model: 'Stinger', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2018] },
    { make: 'Kia', model: 'Carnival', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Kia', model: 'Seltos', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Kia', model: 'EV6', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Kia', model: 'Niro', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2017] },
    { make: 'Kia', model: 'Rio', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2012, 2013] },
    { make: 'Kia', model: 'Sedona', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2011, 2015, 2016] },

    // ============================================
    // GENESIS - Hyundai luxury brand
    // ============================================
    { make: 'Genesis', model: 'G70', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2019] },
    { make: 'Genesis', model: 'G80', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2017, 2018] },
    { make: 'Genesis', model: 'G90', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Genesis', model: 'GV70', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Genesis', model: 'GV80', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2021] },
    { make: 'Genesis', model: 'Electrified G80', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Genesis', model: 'GV60', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },

    // ============================================
    // FORD - Mixed reliability, trucks generally better
    // ============================================
    { make: 'Ford', model: 'F-150', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2004, 2005, 2010, 2011, 2013, 2015, 2016, 2017] },
    { make: 'Ford', model: 'Escape', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2008, 2013, 2014, 2017, 2020, 2021] },
    { make: 'Ford', model: 'Fusion', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2013, 2014, 2016] },
    { make: 'Ford', model: 'Explorer', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2002, 2003, 2004, 2006, 2011, 2013, 2016, 2020] },
    { make: 'Ford', model: 'Edge', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2011, 2012, 2013, 2015, 2017] },
    { make: 'Ford', model: 'Ranger', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2019, 2020] },
    { make: 'Ford', model: 'Bronco', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2021, 2022] },
    { make: 'Ford', model: 'Bronco Sport', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2021] },
    { make: 'Ford', model: 'Mustang', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2006, 2010, 2015, 2018] },
    { make: 'Ford', model: 'Focus', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2012, 2013, 2014, 2015, 2016, 2017, 2018], knownIssues: [
        { description: 'PowerShift DCT transmission shuddering, slipping, and hesitation', repairCost: { low: 2000, high: 4000 }, mileageRange: { start: 20000, end: 80000 }, severity: 'critical', component: 'transmission', affectedYears: [2012, 2013, 2014, 2015, 2016, 2017, 2018] },
        { description: 'Transmission control module (TCM) failure', repairCost: { low: 400, high: 900 }, mileageRange: { start: 30000, end: 70000 }, severity: 'major', component: 'transmission', affectedYears: [2012, 2013, 2014, 2015, 2016] },
        { description: 'Clutch pack premature wear causing grinding and hard shifts', repairCost: { low: 1500, high: 2500 }, mileageRange: { start: 40000, end: 100000 }, severity: 'major', component: 'transmission', affectedYears: [2012, 2013, 2014, 2015, 2016, 2017, 2018] },
    ] },
    { make: 'Ford', model: 'Fiesta', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2011, 2012, 2013, 2014, 2015, 2016], knownIssues: [
        { description: 'PowerShift DCT transmission shuddering and harsh engagement', repairCost: { low: 2000, high: 3500 }, mileageRange: { start: 20000, end: 80000 }, severity: 'critical', component: 'transmission', affectedYears: [2011, 2012, 2013, 2014, 2015, 2016] },
        { description: 'Door latch failures causing doors to open while driving', repairCost: { low: 200, high: 500 }, mileageRange: { start: 30000, end: 90000 }, severity: 'major', component: 'body', affectedYears: [2011, 2012, 2013, 2014, 2015, 2016] },
    ] },
    { make: 'Ford', model: 'Expedition', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2004, 2005, 2018, 2019] },
    { make: 'Ford', model: 'Transit', baseScore: 7.0, expectedLifespanMiles: 250000, yearsToAvoid: [2015, 2016, 2017] },
    { make: 'Ford', model: 'F-250', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2008, 2011, 2017] },
    { make: 'Ford', model: 'F-350', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2008, 2011, 2017] },
    { make: 'Ford', model: 'Maverick', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Ford', model: 'Mach-E', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2021, 2022] },
    { make: 'Ford', model: 'Lightning', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Ford', model: 'EcoSport', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2018, 2019, 2020] },

    // ============================================
    // LINCOLN - Ford luxury brand
    // ============================================
    { make: 'Lincoln', model: 'Navigator', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2004, 2005, 2006, 2018] },
    { make: 'Lincoln', model: 'Aviator', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2020, 2021, 2022] },
    { make: 'Lincoln', model: 'Corsair', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2020, 2021] },
    { make: 'Lincoln', model: 'Nautilus', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2021] },
    { make: 'Lincoln', model: 'MKZ', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013, 2014, 2016, 2017] },
    { make: 'Lincoln', model: 'Continental', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2017, 2019] },
    { make: 'Lincoln', model: 'MKC', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2015, 2017] },
    { make: 'Lincoln', model: 'MKX', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2016, 2017] },

    // ============================================
    // NISSAN - CVT reliability concerns, trucks are better
    // ============================================
    { make: 'Nissan', model: 'Altima', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2009, 2013, 2014, 2015, 2016, 2017, 2018], knownIssues: [
        { description: 'CVT transmission failure - shuddering, slipping, complete failure', repairCost: { low: 3000, high: 5500 }, mileageRange: { start: 60000, end: 120000 }, severity: 'critical', component: 'transmission', affectedYears: [2013, 2014, 2015, 2016, 2017, 2018] },
        { description: 'CVT cooler failure leading to transmission overheating', repairCost: { low: 800, high: 1500 }, mileageRange: { start: 70000, end: 100000 }, severity: 'major', component: 'transmission', affectedYears: [2013, 2014, 2015, 2016] },
    ] },
    { make: 'Nissan', model: 'Rogue', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2013, 2014, 2015, 2016, 2017], knownIssues: [
        { description: 'CVT transmission failure - juddering, hesitation, premature wear', repairCost: { low: 3000, high: 5000 }, mileageRange: { start: 60000, end: 110000 }, severity: 'critical', component: 'transmission', affectedYears: [2013, 2014, 2015, 2016, 2017] },
    ] },
    { make: 'Nissan', model: 'Sentra', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2013, 2014, 2015, 2016, 2017], knownIssues: [
        { description: 'CVT transmission failure - jerky acceleration, whining noise', repairCost: { low: 2800, high: 4500 }, mileageRange: { start: 60000, end: 100000 }, severity: 'critical', component: 'transmission', affectedYears: [2013, 2014, 2015, 2016, 2017] },
    ] },
    { make: 'Nissan', model: 'Maxima', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2010, 2011, 2012, 2016] },
    { make: 'Nissan', model: 'Murano', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2010, 2011, 2015] },
    { make: 'Nissan', model: 'Pathfinder', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2006, 2013, 2014, 2015, 2017] },
    { make: 'Nissan', model: 'Frontier', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2005, 2006, 2007] },
    { make: 'Nissan', model: 'Titan', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2004, 2005, 2006, 2016, 2017] },
    { make: 'Nissan', model: 'Versa', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2012, 2013, 2014, 2015, 2017] },
    { make: 'Nissan', model: 'Kicks', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2018] },
    { make: 'Nissan', model: '370Z', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Nissan', model: 'Z', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Nissan', model: 'Armada', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2006, 2017] },
    { make: 'Nissan', model: 'Leaf', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2011, 2012, 2013] },
    { make: 'Nissan', model: 'Ariya', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Nissan', model: 'Rogue Sport', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2017, 2018, 2020] },

    // ============================================
    // INFINITI - Nissan luxury brand
    // ============================================
    { make: 'Infiniti', model: 'Q50', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2014, 2015, 2016, 2018] },
    { make: 'Infiniti', model: 'Q60', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2014, 2017, 2018] },
    { make: 'Infiniti', model: 'QX50', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'Infiniti', model: 'QX60', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2013, 2014, 2015, 2016, 2017] },
    { make: 'Infiniti', model: 'QX80', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2014] },
    { make: 'Infiniti', model: 'QX55', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Infiniti', model: 'G37', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Infiniti', model: 'G35', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2003, 2004] },

    // ============================================
    // CHEVROLET - Variable reliability by model
    // ============================================
    { make: 'Chevrolet', model: 'Silverado', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2014, 2015, 2016, 2017, 2019] },
    { make: 'Chevrolet', model: 'Silverado 1500', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2014, 2015, 2016, 2017, 2019] },
    { make: 'Chevrolet', model: 'Silverado 2500', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2011, 2016, 2017] },
    { make: 'Chevrolet', model: 'Silverado 3500', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2011, 2016, 2017] },
    { make: 'Chevrolet', model: 'Equinox', baseScore: 6.0, expectedLifespanMiles: 180000, yearsToAvoid: [2010, 2011, 2012, 2013, 2014, 2015, 2018, 2019], knownIssues: [
        { description: '2.4L Ecotec engine excessive oil consumption - requires top-offs between changes', repairCost: { low: 1500, high: 4000 }, mileageRange: { start: 40000, end: 120000 }, severity: 'major', component: 'engine', affectedYears: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017] },
        { description: 'Timing chain stretch/failure in 2.4L causing rough running and check engine light', repairCost: { low: 800, high: 1500 }, mileageRange: { start: 60000, end: 120000 }, severity: 'major', component: 'engine', affectedYears: [2010, 2011, 2012, 2013, 2014, 2015] },
    ] },
    { make: 'Chevrolet', model: 'Malibu', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2013, 2016, 2017, 2018, 2019], knownIssues: [
        { description: 'Transmission shudder and harsh shifting in 8/9-speed automatic', repairCost: { low: 500, high: 3500 }, mileageRange: { start: 30000, end: 80000 }, severity: 'major', component: 'transmission', affectedYears: [2016, 2017, 2018, 2019] },
    ] },
    { make: 'Chevrolet', model: 'Tahoe', baseScore: 8.0, expectedLifespanMiles: 275000, yearsToAvoid: [2007, 2015, 2016] },
    { make: 'Chevrolet', model: 'Suburban', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2015, 2016] },
    { make: 'Chevrolet', model: 'Traverse', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2010, 2011, 2013, 2014, 2018, 2019] },
    { make: 'Chevrolet', model: 'Trax', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2015, 2016, 2017, 2019] },
    { make: 'Chevrolet', model: 'Colorado', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2015, 2016, 2017] },
    { make: 'Chevrolet', model: 'Camaro', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2012, 2016, 2017] },
    { make: 'Chevrolet', model: 'Impala', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2014, 2015, 2016, 2017] },
    { make: 'Chevrolet', model: 'Cruze', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2011, 2012, 2013, 2014, 2016, 2017, 2018] },
    { make: 'Chevrolet', model: 'Bolt', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2017, 2018, 2019, 2020, 2021, 2022] },
    { make: 'Chevrolet', model: 'Bolt EV', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2017, 2018, 2019, 2020, 2021, 2022] },
    { make: 'Chevrolet', model: 'Bolt EUV', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Chevrolet', model: 'Corvette', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2008, 2015, 2020] },
    { make: 'Chevrolet', model: 'Trailblazer', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2021] },
    { make: 'Chevrolet', model: 'Blazer', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020, 2021] },
    { make: 'Chevrolet', model: 'Spark', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2014, 2015, 2016] },
    { make: 'Chevrolet', model: 'Sonic', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2012, 2013, 2014, 2017] },

    // ============================================
    // GMC - Chevrolet trucks with more features
    // ============================================
    { make: 'GMC', model: 'Sierra', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2014, 2015, 2016, 2017, 2019] },
    { make: 'GMC', model: 'Sierra 1500', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2014, 2015, 2016, 2017, 2019] },
    { make: 'GMC', model: 'Sierra 2500', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2011, 2016, 2017] },
    { make: 'GMC', model: 'Sierra 3500', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2011, 2016, 2017] },
    { make: 'GMC', model: 'Yukon', baseScore: 8.0, expectedLifespanMiles: 275000, yearsToAvoid: [2007, 2015, 2016, 2021] },
    { make: 'GMC', model: 'Yukon XL', baseScore: 8.0, expectedLifespanMiles: 275000, yearsToAvoid: [2007, 2015, 2016, 2021] },
    { make: 'GMC', model: 'Acadia', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2008, 2010, 2011, 2012, 2013, 2017, 2018, 2020] },
    { make: 'GMC', model: 'Terrain', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2012, 2013, 2015, 2018, 2019] },
    { make: 'GMC', model: 'Canyon', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2015, 2016, 2017] },
    { make: 'GMC', model: 'Hummer EV', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2022, 2023] },

    // ============================================
    // BUICK - GM luxury brand
    // ============================================
    { make: 'Buick', model: 'Enclave', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2008, 2009, 2010, 2011, 2012, 2013, 2018, 2020] },
    { make: 'Buick', model: 'Encore', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013, 2014, 2015, 2016, 2019] },
    { make: 'Buick', model: 'Encore GX', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2020] },
    { make: 'Buick', model: 'Envision', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2016, 2017, 2019] },
    { make: 'Buick', model: 'Envista', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Buick', model: 'LaCrosse', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2014] },
    { make: 'Buick', model: 'Regal', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2018] },

    // ============================================
    // CADILLAC - GM luxury brand
    // ============================================
    { make: 'Cadillac', model: 'Escalade', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2015, 2016, 2021] },
    { make: 'Cadillac', model: 'Escalade ESV', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2015, 2016, 2021] },
    { make: 'Cadillac', model: 'CT4', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Cadillac', model: 'CT5', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2020] },
    { make: 'Cadillac', model: 'XT4', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'Cadillac', model: 'XT5', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2017, 2018, 2019, 2020] },
    { make: 'Cadillac', model: 'XT6', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2020] },
    { make: 'Cadillac', model: 'Lyriq', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Cadillac', model: 'CTS', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2008, 2009, 2010, 2013, 2014, 2017] },
    { make: 'Cadillac', model: 'ATS', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013, 2014, 2015, 2016] },
    { make: 'Cadillac', model: 'SRX', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2012, 2013, 2015, 2016] },
    { make: 'Cadillac', model: 'XTS', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013, 2014, 2017] },

    // ============================================
    // RAM - Truck brand, generally reliable
    // ============================================
    { make: 'RAM', model: '1500', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2013, 2014, 2015, 2016, 2019, 2020] },
    { make: 'RAM', model: '2500', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2013, 2014, 2016, 2019] },
    { make: 'RAM', model: '3500', baseScore: 8.0, expectedLifespanMiles: 300000, yearsToAvoid: [2013, 2014, 2016, 2019] },
    { make: 'RAM', model: 'ProMaster', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2014, 2015, 2016, 2018, 2019] },
    { make: 'RAM', model: 'ProMaster City', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2015, 2016, 2017, 2018] },

    // ============================================
    // DODGE - Chrysler performance brand
    // ============================================
    { make: 'Dodge', model: 'Charger', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2007, 2008, 2011, 2012, 2013, 2014] },
    { make: 'Dodge', model: 'Challenger', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2010, 2011, 2015] },
    { make: 'Dodge', model: 'Durango', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2014, 2015, 2016] },
    { make: 'Dodge', model: 'Grand Caravan', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2008, 2011, 2012, 2013, 2014, 2015, 2016] },
    { make: 'Dodge', model: 'Journey', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018] },
    { make: 'Dodge', model: 'Hornet', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2023] },

    // ============================================
    // CHRYSLER - Family vehicles
    // ============================================
    { make: 'Chrysler', model: 'Pacifica', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2017, 2018, 2019, 2021, 2022] },
    { make: 'Chrysler', model: '300', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2006, 2007, 2011, 2012, 2013, 2014, 2015] },
    { make: 'Chrysler', model: 'Voyager', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2020, 2021] },
    { make: 'Chrysler', model: 'Town & Country', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2008, 2010, 2011, 2012, 2013, 2014, 2015, 2016] },

    // ============================================
    // JEEP - Off-road focused, mixed reliability
    // ============================================
    { make: 'Jeep', model: 'Wrangler', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2007, 2008, 2012, 2013, 2018, 2019, 2020, 2021] },
    { make: 'Jeep', model: 'Grand Cherokee', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2021, 2022] },
    { make: 'Jeep', model: 'Cherokee', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021] },
    { make: 'Jeep', model: 'Compass', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2007, 2008, 2012, 2013, 2014, 2017, 2018, 2019, 2020] },
    { make: 'Jeep', model: 'Renegade', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2015, 2016, 2017, 2018, 2019, 2020] },
    { make: 'Jeep', model: 'Gladiator', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2020, 2021] },
    { make: 'Jeep', model: 'Wagoneer', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2022, 2023] },
    { make: 'Jeep', model: 'Grand Wagoneer', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2022, 2023] },
    { make: 'Jeep', model: 'Grand Cherokee L', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2021, 2022] },
    { make: 'Jeep', model: 'Patriot', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2007, 2008, 2012, 2013, 2014, 2015, 2016] },
    { make: 'Jeep', model: 'Liberty', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2002, 2003, 2004, 2005, 2006, 2007, 2008, 2011, 2012] },

    // ============================================
    // VOLKSWAGEN - German engineering, mixed reliability
    // ============================================
    { make: 'Volkswagen', model: 'Jetta', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2009, 2010, 2011, 2014, 2015, 2016, 2019] },
    { make: 'Volkswagen', model: 'Passat', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2012, 2013, 2014, 2015, 2016, 2018] },
    { make: 'Volkswagen', model: 'Tiguan', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2010, 2011, 2012, 2018, 2019] },
    { make: 'Volkswagen', model: 'Atlas', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2018, 2019, 2020, 2021] },
    { make: 'Volkswagen', model: 'Atlas Cross Sport', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2020, 2021] },
    { make: 'Volkswagen', model: 'Golf', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2015, 2016, 2019] },
    { make: 'Volkswagen', model: 'GTI', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2007, 2008, 2010, 2015, 2016] },
    { make: 'Volkswagen', model: 'Golf R', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2015, 2016, 2018] },
    { make: 'Volkswagen', model: 'ID.4', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2021, 2022] },
    { make: 'Volkswagen', model: 'Taos', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Volkswagen', model: 'Arteon', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'Volkswagen', model: 'CC', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2009, 2010, 2011, 2012, 2013, 2014, 2015] },
    { make: 'Volkswagen', model: 'Beetle', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2012, 2013, 2014, 2015, 2016] },
    { make: 'Volkswagen', model: 'Touareg', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2004, 2005, 2006, 2011, 2012, 2013, 2015] },

    // ============================================
    // BMW - German luxury, higher maintenance
    // ============================================
    { make: 'BMW', model: '3 Series', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2007, 2008, 2011, 2012, 2013, 2014, 2015] },
    { make: 'BMW', model: '330i', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2007, 2008, 2017] },
    { make: 'BMW', model: '328i', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2008, 2011, 2012, 2013, 2014] },
    { make: 'BMW', model: '5 Series', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2008, 2011, 2012, 2013, 2014, 2017, 2018] },
    { make: 'BMW', model: '530i', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2008, 2017, 2018] },
    { make: 'BMW', model: 'X3', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2008, 2011, 2012, 2013, 2018, 2020] },
    { make: 'BMW', model: 'X5', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2008, 2009, 2011, 2012, 2013, 2014, 2019] },
    { make: 'BMW', model: 'X1', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013, 2014, 2016, 2017] },
    { make: 'BMW', model: 'X7', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'BMW', model: '4 Series', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2014, 2015, 2017] },
    { make: 'BMW', model: '7 Series', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2002, 2003, 2004, 2009, 2010, 2011, 2016, 2017, 2018] },
    { make: 'BMW', model: 'i3', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2014, 2015, 2016] },
    { make: 'BMW', model: 'i4', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'BMW', model: 'iX', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'BMW', model: 'M3', baseScore: 7.5, expectedLifespanMiles: 175000, yearsToAvoid: [2008, 2015] },
    { make: 'BMW', model: 'M5', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2006, 2007, 2008, 2013, 2018] },
    { make: 'BMW', model: 'Z4', baseScore: 7.5, expectedLifespanMiles: 175000, yearsToAvoid: [2003, 2004, 2006, 2009, 2010] },

    // ============================================
    // MERCEDES-BENZ - German luxury, higher maintenance
    // ============================================
    { make: 'Mercedes-Benz', model: 'C-Class', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2008, 2012, 2015, 2016, 2017, 2019] },
    { make: 'Mercedes-Benz', model: 'C300', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2015, 2016, 2017, 2019] },
    { make: 'Mercedes-Benz', model: 'E-Class', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2007, 2011, 2012, 2014, 2015, 2017] },
    { make: 'Mercedes-Benz', model: 'E350', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2007, 2011, 2012, 2014, 2015] },
    { make: 'Mercedes-Benz', model: 'GLC', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2016, 2017, 2018, 2020] },
    { make: 'Mercedes-Benz', model: 'GLC300', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2016, 2017, 2018, 2020] },
    { make: 'Mercedes-Benz', model: 'GLE', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2016, 2017, 2020, 2021] },
    { make: 'Mercedes-Benz', model: 'GLE350', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2016, 2017, 2020, 2021] },
    { make: 'Mercedes-Benz', model: 'S-Class', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2007, 2012, 2014, 2015, 2021] },
    { make: 'Mercedes-Benz', model: 'A-Class', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2019, 2020, 2021] },
    { make: 'Mercedes-Benz', model: 'CLA', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2014, 2015, 2016, 2017, 2020] },
    { make: 'Mercedes-Benz', model: 'GLA', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2015, 2016, 2017, 2021] },
    { make: 'Mercedes-Benz', model: 'GLB', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2020, 2021] },
    { make: 'Mercedes-Benz', model: 'GLS', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2017, 2020, 2021] },
    { make: 'Mercedes-Benz', model: 'G-Class', baseScore: 8.0, expectedLifespanMiles: 275000, yearsToAvoid: [2019] },
    { make: 'Mercedes-Benz', model: 'G-Wagon', baseScore: 8.0, expectedLifespanMiles: 275000, yearsToAvoid: [2019] },
    { make: 'Mercedes-Benz', model: 'EQS', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2022] },
    { make: 'Mercedes-Benz', model: 'EQE', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Mercedes-Benz', model: 'EQB', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Mercedes-Benz', model: 'Sprinter', baseScore: 6.5, expectedLifespanMiles: 250000, yearsToAvoid: [2010, 2011, 2014, 2015, 2016, 2017, 2019, 2020] },
    { make: 'Mercedes-Benz', model: 'AMG GT', baseScore: 7.5, expectedLifespanMiles: 175000, yearsToAvoid: [] },

    // ============================================
    // AUDI - German luxury, higher maintenance
    // ============================================
    { make: 'Audi', model: 'A4', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2010, 2011, 2012, 2013, 2014, 2017, 2018] },
    { make: 'Audi', model: 'A6', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2012, 2013, 2014, 2016, 2019, 2020] },
    { make: 'Audi', model: 'A3', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2015, 2016, 2017] },
    { make: 'Audi', model: 'Q5', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2014, 2018, 2019] },
    { make: 'Audi', model: 'Q7', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2008, 2009, 2011, 2012, 2017, 2020] },
    { make: 'Audi', model: 'Q3', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2015, 2016, 2019, 2020] },
    { make: 'Audi', model: 'Q8', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'Audi', model: 'A5', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2012, 2013, 2018] },
    { make: 'Audi', model: 'A7', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2012, 2013, 2016, 2019] },
    { make: 'Audi', model: 'A8', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2005, 2012, 2013, 2019] },
    { make: 'Audi', model: 'e-tron', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020, 2021] },
    { make: 'Audi', model: 'e-tron GT', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Audi', model: 'Q4 e-tron', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Audi', model: 'TT', baseScore: 7.5, expectedLifespanMiles: 175000, yearsToAvoid: [2008, 2009, 2016] },
    { make: 'Audi', model: 'R8', baseScore: 7.5, expectedLifespanMiles: 150000, yearsToAvoid: [2008, 2009, 2014] },
    { make: 'Audi', model: 'S4', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2010, 2011, 2012, 2013, 2018] },
    { make: 'Audi', model: 'RS5', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2013, 2018] },

    // ============================================
    // VOLVO - Swedish safety, good reliability
    // ============================================
    { make: 'Volvo', model: 'XC90', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2003, 2004, 2005, 2016, 2017, 2019, 2020] },
    { make: 'Volvo', model: 'XC60', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2010, 2015, 2016, 2018, 2019, 2020] },
    { make: 'Volvo', model: 'XC40', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020] },
    { make: 'Volvo', model: 'S60', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2012, 2015, 2016, 2019, 2020] },
    { make: 'Volvo', model: 'S90', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2017, 2018, 2019, 2020] },
    { make: 'Volvo', model: 'V60', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2015, 2016, 2019, 2020] },
    { make: 'Volvo', model: 'V90', baseScore: 7.5, expectedLifespanMiles: 225000, yearsToAvoid: [2017, 2018, 2020] },
    { make: 'Volvo', model: 'C40', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Volvo', model: 'EX30', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Volvo', model: 'EX90', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [] },

    // ============================================
    // TESLA - Electric vehicles, unique concerns
    // ============================================
    { make: 'Tesla', model: 'Model 3', baseScore: 7.5, expectedLifespanMiles: 300000, yearsToAvoid: [2018, 2019] },
    { make: 'Tesla', model: 'Model Y', baseScore: 7.5, expectedLifespanMiles: 300000, yearsToAvoid: [2020, 2021] },
    { make: 'Tesla', model: 'Model S', baseScore: 7.0, expectedLifespanMiles: 300000, yearsToAvoid: [2012, 2013, 2014, 2015, 2016, 2017, 2021] },
    { make: 'Tesla', model: 'Model X', baseScore: 6.5, expectedLifespanMiles: 275000, yearsToAvoid: [2016, 2017, 2018, 2019, 2020, 2021, 2022] },
    { make: 'Tesla', model: 'Cybertruck', baseScore: 6.0, expectedLifespanMiles: 250000, yearsToAvoid: [2024] },

    // ============================================
    // PORSCHE - High performance luxury
    // ============================================
    { make: 'Porsche', model: '911', baseScore: 8.5, expectedLifespanMiles: 200000, yearsToAvoid: [2009, 2012, 2017] },
    { make: 'Porsche', model: 'Cayenne', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2004, 2005, 2011, 2015, 2019] },
    { make: 'Porsche', model: 'Macan', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2015, 2016, 2017] },
    { make: 'Porsche', model: 'Panamera', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2012, 2017] },
    { make: 'Porsche', model: 'Boxster', baseScore: 8.0, expectedLifespanMiles: 175000, yearsToAvoid: [1997, 1998, 1999, 2000, 2001, 2009] },
    { make: 'Porsche', model: 'Cayman', baseScore: 8.0, expectedLifespanMiles: 175000, yearsToAvoid: [2009] },
    { make: 'Porsche', model: 'Taycan', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [2020, 2021] },
    { make: 'Porsche', model: '718', baseScore: 8.0, expectedLifespanMiles: 175000, yearsToAvoid: [] },

    // ============================================
    // LAND ROVER / RANGE ROVER - Luxury SUVs, reliability concerns
    // ============================================
    { make: 'Land Rover', model: 'Range Rover', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2003, 2004, 2005, 2006, 2012, 2013, 2014, 2015, 2016, 2018, 2019, 2020] },
    { make: 'Land Rover', model: 'Range Rover Sport', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2006, 2007, 2008, 2012, 2014, 2015, 2016, 2018, 2019, 2020] },
    { make: 'Land Rover', model: 'Range Rover Velar', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2018, 2019, 2020, 2021] },
    { make: 'Land Rover', model: 'Range Rover Evoque', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2012, 2013, 2014, 2015, 2016, 2017, 2020] },
    { make: 'Land Rover', model: 'Discovery', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2017, 2018, 2019, 2020, 2021] },
    { make: 'Land Rover', model: 'Discovery Sport', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2015, 2016, 2017, 2018, 2019, 2020] },
    { make: 'Land Rover', model: 'Defender', baseScore: 6.0, expectedLifespanMiles: 200000, yearsToAvoid: [2020, 2021, 2022] },
    { make: 'Land Rover', model: 'LR4', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2010, 2011, 2012, 2013, 2014, 2015, 2016] },
    { make: 'Land Rover', model: 'LR2', baseScore: 5.0, expectedLifespanMiles: 150000, yearsToAvoid: [2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015] },

    // ============================================
    // JAGUAR - British luxury, reliability concerns
    // ============================================
    { make: 'Jaguar', model: 'F-Pace', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2017, 2018, 2019, 2020, 2021] },
    { make: 'Jaguar', model: 'E-Pace', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2018, 2019, 2020, 2021] },
    { make: 'Jaguar', model: 'XE', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2017, 2018, 2019, 2020] },
    { make: 'Jaguar', model: 'XF', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2009, 2010, 2011, 2013, 2016, 2017, 2018] },
    { make: 'Jaguar', model: 'F-Type', baseScore: 6.5, expectedLifespanMiles: 150000, yearsToAvoid: [2014, 2015, 2016, 2018] },
    { make: 'Jaguar', model: 'I-Pace', baseScore: 6.5, expectedLifespanMiles: 200000, yearsToAvoid: [2019, 2020, 2021] },

    // ============================================
    // MITSUBISHI - Budget friendly, moderate reliability
    // ============================================
    { make: 'Mitsubishi', model: 'Outlander', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2008, 2014, 2015, 2016, 2017, 2018] },
    { make: 'Mitsubishi', model: 'Outlander Sport', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2011, 2013, 2016, 2017, 2018] },
    { make: 'Mitsubishi', model: 'Eclipse Cross', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2018, 2019] },
    { make: 'Mitsubishi', model: 'Mirage', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2014, 2015, 2017] },
    { make: 'Mitsubishi', model: 'Mirage G4', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2017, 2018] },

    // ============================================
    // MINI - BMW-based, mixed reliability
    // ============================================
    { make: 'MINI', model: 'Cooper', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017] },
    { make: 'MINI', model: 'Countryman', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2011, 2012, 2013, 2014, 2015, 2017, 2018] },
    { make: 'MINI', model: 'Clubman', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2008, 2009, 2010, 2016, 2017] },
    { make: 'MINI', model: 'Hardtop', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2014, 2015, 2016, 2017] },

    // ============================================
    // FIAT - Italian, reliability concerns
    // ============================================
    { make: 'Fiat', model: '500', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
    { make: 'Fiat', model: '500X', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2016, 2017, 2018, 2019] },
    { make: 'Fiat', model: '500L', baseScore: 5.0, expectedLifespanMiles: 150000, yearsToAvoid: [2014, 2015, 2016, 2017, 2018, 2019, 2020] },
    { make: 'Fiat', model: '124 Spider', baseScore: 7.0, expectedLifespanMiles: 175000, yearsToAvoid: [2017] },

    // ============================================
    // ALFA ROMEO - Italian, reliability concerns
    // ============================================
    { make: 'Alfa Romeo', model: 'Giulia', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2017, 2018, 2019, 2020, 2021] },
    { make: 'Alfa Romeo', model: 'Stelvio', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2018, 2019, 2020, 2021] },
    { make: 'Alfa Romeo', model: 'Tonale', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [] },

    // ============================================
    // RIVIAN - New EV manufacturer
    // ============================================
    { make: 'Rivian', model: 'R1T', baseScore: 6.5, expectedLifespanMiles: 250000, yearsToAvoid: [2022, 2023] },
    { make: 'Rivian', model: 'R1S', baseScore: 6.5, expectedLifespanMiles: 250000, yearsToAvoid: [2022, 2023] },

    // ============================================
    // LUCID - Luxury EV manufacturer
    // ============================================
    { make: 'Lucid', model: 'Air', baseScore: 6.5, expectedLifespanMiles: 250000, yearsToAvoid: [2022, 2023] },

    // ============================================
    // POLESTAR - Volvo performance EV
    // ============================================
    { make: 'Polestar', model: '2', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [2021, 2022] },
    { make: 'Polestar', model: '3', baseScore: 7.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },

    // ============================================
    // MASERATI - Italian luxury
    // ============================================
    { make: 'Maserati', model: 'Ghibli', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2014, 2015, 2016, 2017, 2018, 2019, 2020] },
    { make: 'Maserati', model: 'Levante', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2017, 2018, 2019, 2020, 2021] },
    { make: 'Maserati', model: 'Quattroporte', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2014, 2015, 2016, 2017, 2018] },

    // ============================================
    // SMART - Compact city cars
    // ============================================
    { make: 'Smart', model: 'Fortwo', baseScore: 5.5, expectedLifespanMiles: 150000, yearsToAvoid: [2008, 2009, 2010, 2011, 2013, 2016, 2017, 2018] },

    // ============================================
    // SCION - Toyota youth brand (discontinued)
    // ============================================
    { make: 'Scion', model: 'FR-S', baseScore: 8.0, expectedLifespanMiles: 200000, yearsToAvoid: [2013] },
    { make: 'Scion', model: 'xB', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2008] },
    { make: 'Scion', model: 'tC', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2011] },
    { make: 'Scion', model: 'iA', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },
    { make: 'Scion', model: 'iM', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [] },

    // ============================================
    // SATURN - GM brand (discontinued)
    // ============================================
    { make: 'Saturn', model: 'Vue', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009] },
    { make: 'Saturn', model: 'Outlook', baseScore: 5.5, expectedLifespanMiles: 175000, yearsToAvoid: [2007, 2008, 2009, 2010] },
    { make: 'Saturn', model: 'Aura', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2007, 2008, 2009] },
    { make: 'Saturn', model: 'Sky', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2007, 2008] },

    // ============================================
    // PONTIAC - GM brand (discontinued)
    // ============================================
    { make: 'Pontiac', model: 'G6', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2005, 2006, 2007, 2008, 2009] },
    { make: 'Pontiac', model: 'G8', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [] },
    { make: 'Pontiac', model: 'Vibe', baseScore: 8.0, expectedLifespanMiles: 225000, yearsToAvoid: [2003, 2009] },
    { make: 'Pontiac', model: 'Grand Prix', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2004, 2005, 2006, 2007, 2008] },
    { make: 'Pontiac', model: 'Solstice', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2006, 2007] },

    // ============================================
    // MERCURY - Ford brand (discontinued)
    // ============================================
    { make: 'Mercury', model: 'Grand Marquis', baseScore: 7.5, expectedLifespanMiles: 250000, yearsToAvoid: [] },
    { make: 'Mercury', model: 'Milan', baseScore: 6.5, expectedLifespanMiles: 175000, yearsToAvoid: [2010, 2011] },
    { make: 'Mercury', model: 'Mariner', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2008, 2009, 2010, 2011] },

    // ============================================
    // HUMMER - GM brand (discontinued, revived as EV)
    // ============================================
    { make: 'Hummer', model: 'H2', baseScore: 6.0, expectedLifespanMiles: 200000, yearsToAvoid: [2003, 2004, 2005, 2008] },
    { make: 'Hummer', model: 'H3', baseScore: 6.0, expectedLifespanMiles: 200000, yearsToAvoid: [2006, 2007, 2008, 2009, 2010] },

    // ============================================
    // SAAB - Swedish brand (discontinued)
    // ============================================
    { make: 'Saab', model: '9-3', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2003, 2004, 2005, 2006, 2008, 2009, 2010, 2011] },
    { make: 'Saab', model: '9-5', baseScore: 6.0, expectedLifespanMiles: 175000, yearsToAvoid: [2003, 2004, 2005, 2006, 2010, 2011] },
];

/**
 * Normalizes model names for consistent matching.
 * Handles common variations like "Mazda3" vs "3" vs "MAZDA3".
 */
function normalizeModel(model: string): string {
    return model
        .toLowerCase()
        .trim()
        // Remove common prefixes/suffixes that vary
        .replace(/^(the\s+)/i, '')
        // Normalize hyphens and spaces
        .replace(/[-\s]+/g, ' ')
        // Remove common trim level indicators for base matching
        .replace(/\s+(ex|lx|se|le|xle|sport|limited|touring|premium)$/i, '');
}

/**
 * Calculates similarity score between two strings.
 * Returns a value between 0 and 1, where 1 is exact match.
 */
function calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Check for substring match
    if (a.includes(b) || b.includes(a)) {
        const shorter = a.length < b.length ? a : b;
        const longer = a.length >= b.length ? a : b;
        return shorter.length / longer.length;
    }

    // Check if one starts with the other
    if (a.startsWith(b) || b.startsWith(a)) {
        return 0.8;
    }

    return 0;
}

/**
 * Finds reliability data for a vehicle with improved matching.
 * Uses exact matching first, then falls back to fuzzy matching.
 *
 * @param make - Vehicle manufacturer
 * @param model - Vehicle model name
 * @returns Reliability data or null if not found
 */
export function getReliabilityData(make: string, model: string): VehicleReliability | null {
    const normMake = make.toLowerCase().trim();
    const normModel = normalizeModel(model);

    // First pass: Exact make and model match
    const exactMatch = RELIABILITY_DATA.find(v =>
        v.make.toLowerCase() === normMake &&
        normalizeModel(v.model) === normModel
    );

    if (exactMatch) return exactMatch;

    // Second pass: Exact make, fuzzy model match
    // Only consider matches with high similarity
    let bestMatch: VehicleReliability | null = null;
    let bestScore = 0.6; // Minimum threshold for fuzzy match

    for (const vehicle of RELIABILITY_DATA) {
        if (vehicle.make.toLowerCase() !== normMake) continue;

        const dbModel = normalizeModel(vehicle.model);
        const similarity = calculateSimilarity(normModel, dbModel);

        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = vehicle;
        }
    }

    return bestMatch;
}
