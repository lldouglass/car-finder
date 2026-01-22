export interface VehicleReliability {
    make: string;
    model: string;
    baseScore: number;
    expectedLifespanMiles: number;
    yearsToAvoid: number[];
}

export const RELIABILITY_DATA: VehicleReliability[] = [
    // Toyota
    { make: 'Toyota', model: 'Camry', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2007, 2008, 2009] },
    { make: 'Toyota', model: 'Corolla', baseScore: 9.5, expectedLifespanMiles: 300000, yearsToAvoid: [2009] },
    { make: 'Toyota', model: 'RAV4', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2008, 2019] },
    { make: 'Toyota', model: 'Highlander', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2003, 2008] },

    // Honda
    { make: 'Honda', model: 'Accord', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2008, 2009, 2010] },
    { make: 'Honda', model: 'Civic', baseScore: 9.0, expectedLifespanMiles: 250000, yearsToAvoid: [2001, 2002, 2006, 2016] },
    { make: 'Honda', model: 'CR-V', baseScore: 8.8, expectedLifespanMiles: 250000, yearsToAvoid: [2011, 2015] },
    { make: 'Honda', model: 'Pilot', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2003, 2005, 2016] },

    // Subaru
    { make: 'Subaru', model: 'Outback', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2011, 2012, 2013] },
    { make: 'Subaru', model: 'Forester', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2011, 2014, 2015] },
    { make: 'Subaru', model: 'Crosstrek', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2013] },

    // Mazda
    { make: 'Mazda', model: 'Mazda3', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2010, 2011] }, // Normalized name
    { make: 'Mazda', model: '3', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2010, 2011] },
    { make: 'Mazda', model: 'Mazda6', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2009, 2014] }, // Normalized name
    { make: 'Mazda', model: '6', baseScore: 8.5, expectedLifespanMiles: 225000, yearsToAvoid: [2009, 2014] },
    { make: 'Mazda', model: 'CX-5', baseScore: 8.8, expectedLifespanMiles: 225000, yearsToAvoid: [2014, 2016] },

    // Hyundai
    { make: 'Hyundai', model: 'Sonata', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013, 2015] },
    { make: 'Hyundai', model: 'Elantra', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2013] },
    { make: 'Hyundai', model: 'Tucson', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2011, 2012, 2016] },
    { make: 'Hyundai', model: 'Santa Fe', baseScore: 7.5, expectedLifespanMiles: 200000, yearsToAvoid: [2007, 2012, 2017] },

    // Ford
    { make: 'Ford', model: 'F-150', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2004, 2005, 2010] },
    { make: 'Ford', model: 'Escape', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2008, 2013, 2014] },
    { make: 'Ford', model: 'Fusion', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2011, 2013, 2014] },

    // Nissan
    { make: 'Nissan', model: 'Altima', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2009, 2013, 2014] }, // CVT issues
    { make: 'Nissan', model: 'Rogue', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2013, 2014, 2015] }, // CVT issues
    { make: 'Nissan', model: 'Sentra', baseScore: 6.5, expectedLifespanMiles: 180000, yearsToAvoid: [2013, 2014, 2015] }, // CVT issues

    // Chevrolet
    { make: 'Chevrolet', model: 'Silverado', baseScore: 8.0, expectedLifespanMiles: 250000, yearsToAvoid: [2007, 2014] },
    { make: 'Chevrolet', model: 'Equinox', baseScore: 6.0, expectedLifespanMiles: 180000, yearsToAvoid: [2010, 2011, 2012, 2013] },
    { make: 'Chevrolet', model: 'Malibu', baseScore: 7.0, expectedLifespanMiles: 200000, yearsToAvoid: [2010, 2013] },
];

export function getReliabilityData(make: string, model: string): VehicleReliability | null {
    const normMake = make.toLowerCase();
    const normModel = model.toLowerCase();

    return RELIABILITY_DATA.find(v =>
        v.make.toLowerCase() === normMake &&
        (v.model.toLowerCase() === normModel || v.model.toLowerCase().includes(normModel) || normModel.includes(v.model.toLowerCase()))
    ) || null;
}
