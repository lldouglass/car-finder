/**
 * Vehicle pricing estimation utilities.
 * Uses realistic depreciation curves based on industry data.
 */

import { VEHICLE_CONSTANTS, PRICING_CONSTANTS } from './constants';

export interface PriceEstimate {
    low: number;
    high: number;
    midpoint: number;
}

export interface MsrpData {
    baseMsrp: number;
    category: 'economy' | 'midsize' | 'luxury' | 'truck' | 'suv';
}

/**
 * MSRP database with vehicle categories for better depreciation modeling.
 * In production, this would be replaced with a pricing API (KBB, Edmunds, etc.)
 * Expanded to match 392 vehicles in the reliability database.
 */
const MSRP_DATABASE: Record<string, MsrpData> = {
    // ============================================
    // TOYOTA
    // ============================================
    'toyota camry': { baseMsrp: 28000, category: 'midsize' },
    'toyota corolla': { baseMsrp: 23000, category: 'economy' },
    'toyota rav4': { baseMsrp: 32000, category: 'suv' },
    'toyota highlander': { baseMsrp: 42000, category: 'suv' },
    'toyota tacoma': { baseMsrp: 35000, category: 'truck' },
    'toyota tundra': { baseMsrp: 48000, category: 'truck' },
    'toyota 4runner': { baseMsrp: 42000, category: 'suv' },
    'toyota prius': { baseMsrp: 28000, category: 'economy' },
    'toyota avalon': { baseMsrp: 38000, category: 'midsize' },
    'toyota sienna': { baseMsrp: 40000, category: 'suv' },
    'toyota sequoia': { baseMsrp: 62000, category: 'suv' },
    'toyota land cruiser': { baseMsrp: 90000, category: 'suv' },
    'toyota venza': { baseMsrp: 35000, category: 'suv' },
    'toyota yaris': { baseMsrp: 18000, category: 'economy' },
    'toyota c-hr': { baseMsrp: 24000, category: 'suv' },
    'toyota gr86': { baseMsrp: 30000, category: 'midsize' },
    'toyota supra': { baseMsrp: 55000, category: 'luxury' },
    'toyota crown': { baseMsrp: 42000, category: 'midsize' },
    'toyota bz4x': { baseMsrp: 43000, category: 'suv' },
    'toyota grand highlander': { baseMsrp: 45000, category: 'suv' },

    // ============================================
    // LEXUS
    // ============================================
    'lexus es': { baseMsrp: 45000, category: 'luxury' },
    'lexus rx': { baseMsrp: 52000, category: 'luxury' },
    'lexus nx': { baseMsrp: 42000, category: 'luxury' },
    'lexus is': { baseMsrp: 42000, category: 'luxury' },
    'lexus gx': { baseMsrp: 65000, category: 'luxury' },
    'lexus lx': { baseMsrp: 95000, category: 'luxury' },
    'lexus ls': { baseMsrp: 80000, category: 'luxury' },
    'lexus gs': { baseMsrp: 52000, category: 'luxury' },
    'lexus rc': { baseMsrp: 48000, category: 'luxury' },
    'lexus lc': { baseMsrp: 95000, category: 'luxury' },
    'lexus ux': { baseMsrp: 38000, category: 'luxury' },
    'lexus tx': { baseMsrp: 58000, category: 'luxury' },

    // ============================================
    // HONDA
    // ============================================
    'honda accord': { baseMsrp: 29000, category: 'midsize' },
    'honda civic': { baseMsrp: 25000, category: 'economy' },
    'honda cr-v': { baseMsrp: 32000, category: 'suv' },
    'honda pilot': { baseMsrp: 42000, category: 'suv' },
    'honda odyssey': { baseMsrp: 40000, category: 'suv' },
    'honda hr-v': { baseMsrp: 26000, category: 'suv' },
    'honda passport': { baseMsrp: 42000, category: 'suv' },
    'honda ridgeline': { baseMsrp: 42000, category: 'truck' },
    'honda fit': { baseMsrp: 20000, category: 'economy' },
    'honda insight': { baseMsrp: 28000, category: 'economy' },
    'honda element': { baseMsrp: 25000, category: 'suv' },
    'honda prologue': { baseMsrp: 48000, category: 'suv' },

    // ============================================
    // ACURA
    // ============================================
    'acura tlx': { baseMsrp: 45000, category: 'luxury' },
    'acura mdx': { baseMsrp: 52000, category: 'luxury' },
    'acura rdx': { baseMsrp: 45000, category: 'luxury' },
    'acura ilx': { baseMsrp: 32000, category: 'luxury' },
    'acura integra': { baseMsrp: 35000, category: 'luxury' },
    'acura tl': { baseMsrp: 38000, category: 'luxury' },
    'acura tsx': { baseMsrp: 35000, category: 'luxury' },
    'acura zdx': { baseMsrp: 65000, category: 'luxury' },

    // ============================================
    // SUBARU
    // ============================================
    'subaru outback': { baseMsrp: 32000, category: 'suv' },
    'subaru forester': { baseMsrp: 32000, category: 'suv' },
    'subaru crosstrek': { baseMsrp: 28000, category: 'suv' },
    'subaru impreza': { baseMsrp: 24000, category: 'economy' },
    'subaru wrx': { baseMsrp: 32000, category: 'midsize' },
    'subaru legacy': { baseMsrp: 26000, category: 'midsize' },
    'subaru ascent': { baseMsrp: 38000, category: 'suv' },
    'subaru brz': { baseMsrp: 30000, category: 'midsize' },
    'subaru solterra': { baseMsrp: 45000, category: 'suv' },

    // ============================================
    // MAZDA
    // ============================================
    'mazda mazda3': { baseMsrp: 24000, category: 'economy' },
    'mazda 3': { baseMsrp: 24000, category: 'economy' },
    'mazda mazda6': { baseMsrp: 28000, category: 'midsize' },
    'mazda 6': { baseMsrp: 28000, category: 'midsize' },
    'mazda cx-5': { baseMsrp: 30000, category: 'suv' },
    'mazda cx-9': { baseMsrp: 40000, category: 'suv' },
    'mazda cx-30': { baseMsrp: 28000, category: 'suv' },
    'mazda cx-50': { baseMsrp: 32000, category: 'suv' },
    'mazda cx-70': { baseMsrp: 45000, category: 'suv' },
    'mazda cx-90': { baseMsrp: 48000, category: 'suv' },
    'mazda mx-5 miata': { baseMsrp: 30000, category: 'midsize' },
    'mazda mx-5': { baseMsrp: 30000, category: 'midsize' },
    'mazda miata': { baseMsrp: 30000, category: 'midsize' },
    'mazda cx-3': { baseMsrp: 24000, category: 'suv' },

    // ============================================
    // HYUNDAI
    // ============================================
    'hyundai sonata': { baseMsrp: 27000, category: 'midsize' },
    'hyundai elantra': { baseMsrp: 22000, category: 'economy' },
    'hyundai tucson': { baseMsrp: 30000, category: 'suv' },
    'hyundai santa fe': { baseMsrp: 35000, category: 'suv' },
    'hyundai kona': { baseMsrp: 26000, category: 'suv' },
    'hyundai palisade': { baseMsrp: 40000, category: 'suv' },
    'hyundai venue': { baseMsrp: 22000, category: 'suv' },
    'hyundai veloster': { baseMsrp: 25000, category: 'economy' },
    'hyundai ioniq': { baseMsrp: 28000, category: 'economy' },
    'hyundai ioniq 5': { baseMsrp: 45000, category: 'suv' },
    'hyundai ioniq 6': { baseMsrp: 48000, category: 'midsize' },
    'hyundai santa cruz': { baseMsrp: 30000, category: 'truck' },
    'hyundai accent': { baseMsrp: 18000, category: 'economy' },

    // ============================================
    // KIA
    // ============================================
    'kia optima': { baseMsrp: 26000, category: 'midsize' },
    'kia k5': { baseMsrp: 28000, category: 'midsize' },
    'kia sorento': { baseMsrp: 35000, category: 'suv' },
    'kia sportage': { baseMsrp: 32000, category: 'suv' },
    'kia telluride': { baseMsrp: 40000, category: 'suv' },
    'kia soul': { baseMsrp: 22000, category: 'economy' },
    'kia forte': { baseMsrp: 22000, category: 'economy' },
    'kia stinger': { baseMsrp: 38000, category: 'midsize' },
    'kia carnival': { baseMsrp: 38000, category: 'suv' },
    'kia seltos': { baseMsrp: 26000, category: 'suv' },
    'kia ev6': { baseMsrp: 48000, category: 'suv' },
    'kia niro': { baseMsrp: 30000, category: 'suv' },
    'kia rio': { baseMsrp: 18000, category: 'economy' },
    'kia sedona': { baseMsrp: 35000, category: 'suv' },

    // ============================================
    // GENESIS
    // ============================================
    'genesis g70': { baseMsrp: 42000, category: 'luxury' },
    'genesis g80': { baseMsrp: 55000, category: 'luxury' },
    'genesis g90': { baseMsrp: 90000, category: 'luxury' },
    'genesis gv70': { baseMsrp: 48000, category: 'luxury' },
    'genesis gv80': { baseMsrp: 58000, category: 'luxury' },
    'genesis electrified g80': { baseMsrp: 82000, category: 'luxury' },
    'genesis gv60': { baseMsrp: 58000, category: 'luxury' },

    // ============================================
    // FORD
    // ============================================
    'ford f-150': { baseMsrp: 45000, category: 'truck' },
    'ford escape': { baseMsrp: 30000, category: 'suv' },
    'ford fusion': { baseMsrp: 26000, category: 'midsize' },
    'ford explorer': { baseMsrp: 40000, category: 'suv' },
    'ford edge': { baseMsrp: 38000, category: 'suv' },
    'ford ranger': { baseMsrp: 35000, category: 'truck' },
    'ford bronco': { baseMsrp: 38000, category: 'suv' },
    'ford bronco sport': { baseMsrp: 32000, category: 'suv' },
    'ford mustang': { baseMsrp: 35000, category: 'midsize' },
    'ford focus': { baseMsrp: 22000, category: 'economy' },
    'ford fiesta': { baseMsrp: 18000, category: 'economy' },
    'ford expedition': { baseMsrp: 60000, category: 'suv' },
    'ford transit': { baseMsrp: 45000, category: 'truck' },
    'ford f-250': { baseMsrp: 55000, category: 'truck' },
    'ford f-350': { baseMsrp: 60000, category: 'truck' },
    'ford maverick': { baseMsrp: 28000, category: 'truck' },
    'ford mach-e': { baseMsrp: 48000, category: 'suv' },
    'ford lightning': { baseMsrp: 55000, category: 'truck' },
    'ford ecosport': { baseMsrp: 24000, category: 'suv' },

    // ============================================
    // LINCOLN
    // ============================================
    'lincoln navigator': { baseMsrp: 85000, category: 'luxury' },
    'lincoln aviator': { baseMsrp: 58000, category: 'luxury' },
    'lincoln corsair': { baseMsrp: 42000, category: 'luxury' },
    'lincoln nautilus': { baseMsrp: 48000, category: 'luxury' },
    'lincoln mkz': { baseMsrp: 42000, category: 'luxury' },
    'lincoln continental': { baseMsrp: 52000, category: 'luxury' },
    'lincoln mkc': { baseMsrp: 38000, category: 'luxury' },
    'lincoln mkx': { baseMsrp: 45000, category: 'luxury' },

    // ============================================
    // NISSAN
    // ============================================
    'nissan altima': { baseMsrp: 27000, category: 'midsize' },
    'nissan rogue': { baseMsrp: 30000, category: 'suv' },
    'nissan sentra': { baseMsrp: 22000, category: 'economy' },
    'nissan maxima': { baseMsrp: 40000, category: 'midsize' },
    'nissan murano': { baseMsrp: 40000, category: 'suv' },
    'nissan pathfinder': { baseMsrp: 40000, category: 'suv' },
    'nissan frontier': { baseMsrp: 35000, category: 'truck' },
    'nissan titan': { baseMsrp: 48000, category: 'truck' },
    'nissan versa': { baseMsrp: 18000, category: 'economy' },
    'nissan kicks': { baseMsrp: 24000, category: 'suv' },
    'nissan 370z': { baseMsrp: 35000, category: 'midsize' },
    'nissan z': { baseMsrp: 45000, category: 'midsize' },
    'nissan armada': { baseMsrp: 55000, category: 'suv' },
    'nissan leaf': { baseMsrp: 32000, category: 'economy' },
    'nissan ariya': { baseMsrp: 45000, category: 'suv' },
    'nissan rogue sport': { baseMsrp: 28000, category: 'suv' },

    // ============================================
    // INFINITI
    // ============================================
    'infiniti q50': { baseMsrp: 45000, category: 'luxury' },
    'infiniti q60': { baseMsrp: 48000, category: 'luxury' },
    'infiniti qx50': { baseMsrp: 45000, category: 'luxury' },
    'infiniti qx60': { baseMsrp: 52000, category: 'luxury' },
    'infiniti qx80': { baseMsrp: 75000, category: 'luxury' },
    'infiniti qx55': { baseMsrp: 50000, category: 'luxury' },
    'infiniti g37': { baseMsrp: 42000, category: 'luxury' },
    'infiniti g35': { baseMsrp: 38000, category: 'luxury' },

    // ============================================
    // CHEVROLET
    // ============================================
    'chevrolet silverado': { baseMsrp: 45000, category: 'truck' },
    'chevrolet silverado 1500': { baseMsrp: 45000, category: 'truck' },
    'chevrolet silverado 2500': { baseMsrp: 55000, category: 'truck' },
    'chevrolet silverado 3500': { baseMsrp: 60000, category: 'truck' },
    'chevrolet equinox': { baseMsrp: 30000, category: 'suv' },
    'chevrolet malibu': { baseMsrp: 26000, category: 'midsize' },
    'chevrolet tahoe': { baseMsrp: 58000, category: 'suv' },
    'chevrolet suburban': { baseMsrp: 62000, category: 'suv' },
    'chevrolet traverse': { baseMsrp: 38000, category: 'suv' },
    'chevrolet trax': { baseMsrp: 24000, category: 'suv' },
    'chevrolet colorado': { baseMsrp: 35000, category: 'truck' },
    'chevrolet camaro': { baseMsrp: 30000, category: 'midsize' },
    'chevrolet impala': { baseMsrp: 32000, category: 'midsize' },
    'chevrolet cruze': { baseMsrp: 22000, category: 'economy' },
    'chevrolet bolt': { baseMsrp: 32000, category: 'economy' },
    'chevrolet bolt ev': { baseMsrp: 32000, category: 'economy' },
    'chevrolet bolt euv': { baseMsrp: 35000, category: 'suv' },
    'chevrolet corvette': { baseMsrp: 70000, category: 'luxury' },
    'chevrolet trailblazer': { baseMsrp: 26000, category: 'suv' },
    'chevrolet blazer': { baseMsrp: 38000, category: 'suv' },
    'chevrolet spark': { baseMsrp: 16000, category: 'economy' },
    'chevrolet sonic': { baseMsrp: 20000, category: 'economy' },

    // ============================================
    // GMC
    // ============================================
    'gmc sierra': { baseMsrp: 48000, category: 'truck' },
    'gmc sierra 1500': { baseMsrp: 48000, category: 'truck' },
    'gmc sierra 2500': { baseMsrp: 55000, category: 'truck' },
    'gmc sierra 3500': { baseMsrp: 62000, category: 'truck' },
    'gmc yukon': { baseMsrp: 62000, category: 'suv' },
    'gmc yukon xl': { baseMsrp: 68000, category: 'suv' },
    'gmc acadia': { baseMsrp: 40000, category: 'suv' },
    'gmc terrain': { baseMsrp: 32000, category: 'suv' },
    'gmc canyon': { baseMsrp: 35000, category: 'truck' },
    'gmc hummer ev': { baseMsrp: 110000, category: 'truck' },

    // ============================================
    // BUICK
    // ============================================
    'buick enclave': { baseMsrp: 48000, category: 'luxury' },
    'buick encore': { baseMsrp: 28000, category: 'luxury' },
    'buick encore gx': { baseMsrp: 30000, category: 'luxury' },
    'buick envision': { baseMsrp: 38000, category: 'luxury' },
    'buick envista': { baseMsrp: 28000, category: 'luxury' },
    'buick lacrosse': { baseMsrp: 35000, category: 'luxury' },
    'buick regal': { baseMsrp: 32000, category: 'luxury' },

    // ============================================
    // CADILLAC
    // ============================================
    'cadillac escalade': { baseMsrp: 85000, category: 'luxury' },
    'cadillac escalade esv': { baseMsrp: 92000, category: 'luxury' },
    'cadillac ct4': { baseMsrp: 38000, category: 'luxury' },
    'cadillac ct5': { baseMsrp: 42000, category: 'luxury' },
    'cadillac xt4': { baseMsrp: 38000, category: 'luxury' },
    'cadillac xt5': { baseMsrp: 48000, category: 'luxury' },
    'cadillac xt6': { baseMsrp: 55000, category: 'luxury' },
    'cadillac lyriq': { baseMsrp: 60000, category: 'luxury' },
    'cadillac cts': { baseMsrp: 48000, category: 'luxury' },
    'cadillac ats': { baseMsrp: 38000, category: 'luxury' },
    'cadillac srx': { baseMsrp: 42000, category: 'luxury' },
    'cadillac xts': { baseMsrp: 52000, category: 'luxury' },

    // ============================================
    // RAM
    // ============================================
    'ram 1500': { baseMsrp: 45000, category: 'truck' },
    'ram 2500': { baseMsrp: 55000, category: 'truck' },
    'ram 3500': { baseMsrp: 60000, category: 'truck' },
    'ram promaster': { baseMsrp: 42000, category: 'truck' },
    'ram promaster city': { baseMsrp: 32000, category: 'truck' },

    // ============================================
    // DODGE
    // ============================================
    'dodge charger': { baseMsrp: 35000, category: 'midsize' },
    'dodge challenger': { baseMsrp: 35000, category: 'midsize' },
    'dodge durango': { baseMsrp: 42000, category: 'suv' },
    'dodge grand caravan': { baseMsrp: 35000, category: 'suv' },
    'dodge journey': { baseMsrp: 28000, category: 'suv' },
    'dodge hornet': { baseMsrp: 32000, category: 'suv' },

    // ============================================
    // CHRYSLER
    // ============================================
    'chrysler pacifica': { baseMsrp: 42000, category: 'suv' },
    'chrysler 300': { baseMsrp: 38000, category: 'midsize' },
    'chrysler voyager': { baseMsrp: 35000, category: 'suv' },
    'chrysler town & country': { baseMsrp: 38000, category: 'suv' },

    // ============================================
    // JEEP
    // ============================================
    'jeep wrangler': { baseMsrp: 35000, category: 'suv' },
    'jeep grand cherokee': { baseMsrp: 45000, category: 'suv' },
    'jeep cherokee': { baseMsrp: 35000, category: 'suv' },
    'jeep compass': { baseMsrp: 30000, category: 'suv' },
    'jeep renegade': { baseMsrp: 28000, category: 'suv' },
    'jeep gladiator': { baseMsrp: 42000, category: 'truck' },
    'jeep wagoneer': { baseMsrp: 65000, category: 'suv' },
    'jeep grand wagoneer': { baseMsrp: 90000, category: 'luxury' },
    'jeep grand cherokee l': { baseMsrp: 48000, category: 'suv' },
    'jeep patriot': { baseMsrp: 24000, category: 'suv' },
    'jeep liberty': { baseMsrp: 28000, category: 'suv' },

    // ============================================
    // VOLKSWAGEN
    // ============================================
    'volkswagen jetta': { baseMsrp: 24000, category: 'economy' },
    'volkswagen passat': { baseMsrp: 30000, category: 'midsize' },
    'volkswagen tiguan': { baseMsrp: 32000, category: 'suv' },
    'volkswagen atlas': { baseMsrp: 40000, category: 'suv' },
    'volkswagen atlas cross sport': { baseMsrp: 38000, category: 'suv' },
    'volkswagen golf': { baseMsrp: 28000, category: 'economy' },
    'volkswagen gti': { baseMsrp: 32000, category: 'economy' },
    'volkswagen golf r': { baseMsrp: 45000, category: 'midsize' },
    'volkswagen id.4': { baseMsrp: 42000, category: 'suv' },
    'volkswagen taos': { baseMsrp: 26000, category: 'suv' },
    'volkswagen arteon': { baseMsrp: 42000, category: 'midsize' },
    'volkswagen cc': { baseMsrp: 35000, category: 'midsize' },
    'volkswagen beetle': { baseMsrp: 26000, category: 'economy' },
    'volkswagen touareg': { baseMsrp: 55000, category: 'suv' },

    // ============================================
    // BMW
    // ============================================
    'bmw 3 series': { baseMsrp: 45000, category: 'luxury' },
    'bmw 330i': { baseMsrp: 45000, category: 'luxury' },
    'bmw 328i': { baseMsrp: 42000, category: 'luxury' },
    'bmw 5 series': { baseMsrp: 58000, category: 'luxury' },
    'bmw 530i': { baseMsrp: 58000, category: 'luxury' },
    'bmw x3': { baseMsrp: 48000, category: 'luxury' },
    'bmw x5': { baseMsrp: 65000, category: 'luxury' },
    'bmw x1': { baseMsrp: 42000, category: 'luxury' },
    'bmw x7': { baseMsrp: 80000, category: 'luxury' },
    'bmw 4 series': { baseMsrp: 50000, category: 'luxury' },
    'bmw 7 series': { baseMsrp: 95000, category: 'luxury' },
    'bmw i3': { baseMsrp: 45000, category: 'luxury' },
    'bmw i4': { baseMsrp: 55000, category: 'luxury' },
    'bmw ix': { baseMsrp: 85000, category: 'luxury' },
    'bmw m3': { baseMsrp: 75000, category: 'luxury' },
    'bmw m5': { baseMsrp: 110000, category: 'luxury' },
    'bmw z4': { baseMsrp: 55000, category: 'luxury' },

    // ============================================
    // MERCEDES-BENZ
    // ============================================
    'mercedes-benz c-class': { baseMsrp: 48000, category: 'luxury' },
    'mercedes-benz c300': { baseMsrp: 48000, category: 'luxury' },
    'mercedes-benz e-class': { baseMsrp: 60000, category: 'luxury' },
    'mercedes-benz e350': { baseMsrp: 60000, category: 'luxury' },
    'mercedes-benz glc': { baseMsrp: 48000, category: 'luxury' },
    'mercedes-benz glc300': { baseMsrp: 48000, category: 'luxury' },
    'mercedes-benz gle': { baseMsrp: 60000, category: 'luxury' },
    'mercedes-benz gle350': { baseMsrp: 60000, category: 'luxury' },
    'mercedes-benz s-class': { baseMsrp: 115000, category: 'luxury' },
    'mercedes-benz a-class': { baseMsrp: 38000, category: 'luxury' },
    'mercedes-benz cla': { baseMsrp: 42000, category: 'luxury' },
    'mercedes-benz gla': { baseMsrp: 40000, category: 'luxury' },
    'mercedes-benz glb': { baseMsrp: 42000, category: 'luxury' },
    'mercedes-benz gls': { baseMsrp: 85000, category: 'luxury' },
    'mercedes-benz g-class': { baseMsrp: 140000, category: 'luxury' },
    'mercedes-benz g-wagon': { baseMsrp: 140000, category: 'luxury' },
    'mercedes-benz eqs': { baseMsrp: 105000, category: 'luxury' },
    'mercedes-benz eqe': { baseMsrp: 78000, category: 'luxury' },
    'mercedes-benz eqb': { baseMsrp: 55000, category: 'luxury' },
    'mercedes-benz sprinter': { baseMsrp: 45000, category: 'truck' },
    'mercedes-benz amg gt': { baseMsrp: 125000, category: 'luxury' },

    // ============================================
    // AUDI
    // ============================================
    'audi a4': { baseMsrp: 45000, category: 'luxury' },
    'audi a6': { baseMsrp: 58000, category: 'luxury' },
    'audi a3': { baseMsrp: 38000, category: 'luxury' },
    'audi q5': { baseMsrp: 48000, category: 'luxury' },
    'audi q7': { baseMsrp: 62000, category: 'luxury' },
    'audi q3': { baseMsrp: 40000, category: 'luxury' },
    'audi q8': { baseMsrp: 75000, category: 'luxury' },
    'audi a5': { baseMsrp: 48000, category: 'luxury' },
    'audi a7': { baseMsrp: 72000, category: 'luxury' },
    'audi a8': { baseMsrp: 90000, category: 'luxury' },
    'audi e-tron': { baseMsrp: 72000, category: 'luxury' },
    'audi e-tron gt': { baseMsrp: 105000, category: 'luxury' },
    'audi q4 e-tron': { baseMsrp: 52000, category: 'luxury' },
    'audi tt': { baseMsrp: 52000, category: 'luxury' },
    'audi r8': { baseMsrp: 160000, category: 'luxury' },
    'audi s4': { baseMsrp: 55000, category: 'luxury' },
    'audi rs5': { baseMsrp: 78000, category: 'luxury' },

    // ============================================
    // VOLVO
    // ============================================
    'volvo xc90': { baseMsrp: 58000, category: 'luxury' },
    'volvo xc60': { baseMsrp: 48000, category: 'luxury' },
    'volvo xc40': { baseMsrp: 40000, category: 'luxury' },
    'volvo s60': { baseMsrp: 45000, category: 'luxury' },
    'volvo s90': { baseMsrp: 58000, category: 'luxury' },
    'volvo v60': { baseMsrp: 48000, category: 'luxury' },
    'volvo v90': { baseMsrp: 58000, category: 'luxury' },
    'volvo c40': { baseMsrp: 55000, category: 'luxury' },
    'volvo ex30': { baseMsrp: 38000, category: 'luxury' },
    'volvo ex90': { baseMsrp: 78000, category: 'luxury' },

    // ============================================
    // TESLA
    // ============================================
    'tesla model 3': { baseMsrp: 42000, category: 'midsize' },
    'tesla model y': { baseMsrp: 48000, category: 'suv' },
    'tesla model s': { baseMsrp: 85000, category: 'luxury' },
    'tesla model x': { baseMsrp: 95000, category: 'luxury' },
    'tesla cybertruck': { baseMsrp: 65000, category: 'truck' },

    // ============================================
    // PORSCHE
    // ============================================
    'porsche 911': { baseMsrp: 115000, category: 'luxury' },
    'porsche cayenne': { baseMsrp: 75000, category: 'luxury' },
    'porsche macan': { baseMsrp: 62000, category: 'luxury' },
    'porsche panamera': { baseMsrp: 95000, category: 'luxury' },
    'porsche boxster': { baseMsrp: 68000, category: 'luxury' },
    'porsche cayman': { baseMsrp: 72000, category: 'luxury' },
    'porsche taycan': { baseMsrp: 90000, category: 'luxury' },
    'porsche 718': { baseMsrp: 68000, category: 'luxury' },

    // ============================================
    // LAND ROVER
    // ============================================
    'land rover range rover': { baseMsrp: 105000, category: 'luxury' },
    'land rover range rover sport': { baseMsrp: 85000, category: 'luxury' },
    'land rover range rover velar': { baseMsrp: 62000, category: 'luxury' },
    'land rover range rover evoque': { baseMsrp: 48000, category: 'luxury' },
    'land rover discovery': { baseMsrp: 62000, category: 'luxury' },
    'land rover discovery sport': { baseMsrp: 48000, category: 'luxury' },
    'land rover defender': { baseMsrp: 58000, category: 'luxury' },
    'land rover lr4': { baseMsrp: 52000, category: 'luxury' },
    'land rover lr2': { baseMsrp: 42000, category: 'luxury' },

    // ============================================
    // JAGUAR
    // ============================================
    'jaguar f-pace': { baseMsrp: 58000, category: 'luxury' },
    'jaguar e-pace': { baseMsrp: 48000, category: 'luxury' },
    'jaguar xe': { baseMsrp: 48000, category: 'luxury' },
    'jaguar xf': { baseMsrp: 52000, category: 'luxury' },
    'jaguar f-type': { baseMsrp: 75000, category: 'luxury' },
    'jaguar i-pace': { baseMsrp: 72000, category: 'luxury' },

    // ============================================
    // MITSUBISHI
    // ============================================
    'mitsubishi outlander': { baseMsrp: 32000, category: 'suv' },
    'mitsubishi outlander sport': { baseMsrp: 28000, category: 'suv' },
    'mitsubishi eclipse cross': { baseMsrp: 30000, category: 'suv' },
    'mitsubishi mirage': { baseMsrp: 18000, category: 'economy' },
    'mitsubishi mirage g4': { baseMsrp: 18000, category: 'economy' },

    // ============================================
    // MINI
    // ============================================
    'mini cooper': { baseMsrp: 32000, category: 'economy' },
    'mini countryman': { baseMsrp: 35000, category: 'suv' },
    'mini clubman': { baseMsrp: 35000, category: 'economy' },
    'mini hardtop': { baseMsrp: 30000, category: 'economy' },

    // ============================================
    // FIAT
    // ============================================
    'fiat 500': { baseMsrp: 22000, category: 'economy' },
    'fiat 500x': { baseMsrp: 28000, category: 'suv' },
    'fiat 500l': { baseMsrp: 26000, category: 'economy' },
    'fiat 124 spider': { baseMsrp: 28000, category: 'midsize' },

    // ============================================
    // ALFA ROMEO
    // ============================================
    'alfa romeo giulia': { baseMsrp: 48000, category: 'luxury' },
    'alfa romeo stelvio': { baseMsrp: 52000, category: 'luxury' },
    'alfa romeo tonale': { baseMsrp: 45000, category: 'luxury' },

    // ============================================
    // RIVIAN
    // ============================================
    'rivian r1t': { baseMsrp: 75000, category: 'truck' },
    'rivian r1s': { baseMsrp: 80000, category: 'suv' },

    // ============================================
    // LUCID
    // ============================================
    'lucid air': { baseMsrp: 90000, category: 'luxury' },

    // ============================================
    // POLESTAR
    // ============================================
    'polestar 2': { baseMsrp: 52000, category: 'luxury' },
    'polestar 3': { baseMsrp: 75000, category: 'luxury' },

    // ============================================
    // MASERATI
    // ============================================
    'maserati ghibli': { baseMsrp: 78000, category: 'luxury' },
    'maserati levante': { baseMsrp: 85000, category: 'luxury' },
    'maserati quattroporte': { baseMsrp: 105000, category: 'luxury' },

    // ============================================
    // SMART
    // ============================================
    'smart fortwo': { baseMsrp: 18000, category: 'economy' },

    // ============================================
    // SCION (discontinued)
    // ============================================
    'scion fr-s': { baseMsrp: 28000, category: 'midsize' },
    'scion xb': { baseMsrp: 20000, category: 'economy' },
    'scion tc': { baseMsrp: 22000, category: 'economy' },
    'scion ia': { baseMsrp: 18000, category: 'economy' },
    'scion im': { baseMsrp: 20000, category: 'economy' },

    // ============================================
    // SATURN (discontinued)
    // ============================================
    'saturn vue': { baseMsrp: 26000, category: 'suv' },
    'saturn outlook': { baseMsrp: 32000, category: 'suv' },
    'saturn aura': { baseMsrp: 24000, category: 'midsize' },
    'saturn sky': { baseMsrp: 28000, category: 'midsize' },

    // ============================================
    // PONTIAC (discontinued)
    // ============================================
    'pontiac g6': { baseMsrp: 24000, category: 'midsize' },
    'pontiac g8': { baseMsrp: 32000, category: 'midsize' },
    'pontiac vibe': { baseMsrp: 20000, category: 'economy' },
    'pontiac grand prix': { baseMsrp: 28000, category: 'midsize' },
    'pontiac solstice': { baseMsrp: 28000, category: 'midsize' },

    // ============================================
    // MERCURY (discontinued)
    // ============================================
    'mercury grand marquis': { baseMsrp: 32000, category: 'midsize' },
    'mercury milan': { baseMsrp: 24000, category: 'midsize' },
    'mercury mariner': { baseMsrp: 28000, category: 'suv' },

    // ============================================
    // HUMMER (discontinued, revived as EV under GMC)
    // ============================================
    'hummer h2': { baseMsrp: 55000, category: 'suv' },
    'hummer h3': { baseMsrp: 35000, category: 'suv' },

    // ============================================
    // SAAB (discontinued)
    // ============================================
    'saab 9-3': { baseMsrp: 32000, category: 'midsize' },
    'saab 9-5': { baseMsrp: 42000, category: 'midsize' },
};

/**
 * Category-specific depreciation rates (annual retention percentage).
 * Based on industry depreciation studies.
 */
const DEPRECIATION_CURVES: Record<MsrpData['category'], number[]> = {
    // [year1, year2, year3, year4, year5, year6+]
    // Values represent percentage of previous year's value retained
    economy: [0.82, 0.88, 0.90, 0.92, 0.94, 0.95],   // Economy cars hold value decently
    midsize: [0.80, 0.87, 0.89, 0.91, 0.93, 0.95],   // Midsize sedans
    suv: [0.78, 0.86, 0.88, 0.90, 0.93, 0.95],       // SUVs - popular, hold value well
    truck: [0.75, 0.85, 0.88, 0.91, 0.94, 0.96],     // Trucks - strong resale
    luxury: [0.72, 0.82, 0.85, 0.88, 0.90, 0.92],    // Luxury - faster initial depreciation
};

/**
 * Minimum value floor as percentage of MSRP by category.
 * Cars don't depreciate to zero - there's always some base value.
 */
const VALUE_FLOORS: Record<MsrpData['category'], number> = {
    economy: 0.15,  // 15% minimum
    midsize: 0.12,
    suv: 0.18,      // SUVs hold value better
    truck: 0.20,    // Trucks hold value best
    luxury: 0.10,   // Luxury has lowest floor
};

/**
 * Brand-specific value retention multipliers.
 * Some brands hold value significantly better than others.
 * Based on industry resale value studies.
 */
const BRAND_RETENTION_MULTIPLIERS: Record<string, number> = {
    // Premium retention (hold value very well)
    'toyota': 1.18,
    'lexus': 1.15,
    'honda': 1.15,
    'subaru': 1.12,
    'mazda': 1.10,
    'porsche': 1.20,

    // Above average retention
    'hyundai': 1.05,
    'kia': 1.05,
    'acura': 1.05,

    // Average retention (1.0 baseline)
    'ford': 1.00,
    'chevrolet': 1.00,
    'gmc': 1.02,
    'ram': 1.02,

    // Below average retention
    'nissan': 0.95,
    'volkswagen': 0.95,
    'dodge': 0.95,
    'jeep': 0.98,
    'chrysler': 0.90,

    // Luxury with faster depreciation
    'bmw': 0.92,
    'mercedes': 0.90,
    'mercedes-benz': 0.90,
    'audi': 0.92,
    'infiniti': 0.88,
    'cadillac': 0.85,
    'lincoln': 0.85,
    'jaguar': 0.82,
    'land rover': 0.85,
};

/**
 * Look up MSRP data for a vehicle.
 */
export function getMsrpData(make: string, model: string): MsrpData {
    const key = `${make.toLowerCase()} ${model.toLowerCase()}`;

    // Direct match
    if (MSRP_DATABASE[key]) {
        return MSRP_DATABASE[key];
    }

    // Partial match (handles trim levels like "Civic EX")
    for (const [dbKey, data] of Object.entries(MSRP_DATABASE)) {
        if (key.includes(dbKey) || dbKey.includes(key.split(' ').slice(0, 2).join(' '))) {
            return data;
        }
    }

    // Default fallback
    return { baseMsrp: 30000, category: 'midsize' };
}

/**
 * Calculate depreciation using realistic curves.
 * Returns the retention percentage (0-1) of original value.
 */
function calculateDepreciation(age: number, category: MsrpData['category']): number {
    const curve = DEPRECIATION_CURVES[category];
    let retention = 1.0;

    // Cap age at maximum to prevent performance issues
    const cappedAge = Math.min(age, VEHICLE_CONSTANTS.maxVehicleAgeYears);

    for (let year = 0; year < cappedAge; year++) {
        const rateIndex = Math.min(year, curve.length - 1);
        retention *= curve[rateIndex];
    }

    // Apply floor
    const floor = VALUE_FLOORS[category];
    return Math.max(retention, floor);
}

/**
 * Calculate mileage adjustment factor.
 * High mileage reduces value, low mileage increases it.
 * @param mileage - Current vehicle mileage
 * @param age - Vehicle age in years
 * @returns Adjustment factor (negative = reduce value, positive = increase value)
 */
function calculateMileageAdjustment(mileage: number, age: number): number {
    // Guard against invalid inputs
    if (!Number.isFinite(mileage) || mileage < 0) mileage = 0;
    if (!Number.isFinite(age) || age < 0) age = 0;

    const expectedMiles = age * VEHICLE_CONSTANTS.avgMilesPerYear;
    const mileageDiff = mileage - expectedMiles;

    // Adjustment per 10,000 miles difference, capped at maximum
    const adjustment = (mileageDiff / 10000) * -PRICING_CONSTANTS.mileageAdjustmentPer10k;
    return Math.max(
        -PRICING_CONSTANTS.maxMileageAdjustment,
        Math.min(PRICING_CONSTANTS.maxMileageAdjustment, adjustment)
    );
}

/**
 * Get brand retention multiplier.
 */
function getBrandRetentionMultiplier(make: string): number {
    const normalizedMake = make.toLowerCase().trim();
    return BRAND_RETENTION_MULTIPLIERS[normalizedMake] ?? 1.0;
}

/**
 * Estimate fair market price for a vehicle.
 */
export function estimateFairPrice(
    make: string,
    model: string,
    year: number,
    mileage: number
): PriceEstimate {
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - year);

    const msrpData = getMsrpData(make, model);
    const baseMsrp = msrpData.baseMsrp;

    // Calculate base depreciated value
    const depreciationRetention = calculateDepreciation(age, msrpData.category);
    let baseValue = baseMsrp * depreciationRetention;

    // Apply brand-specific retention adjustment
    const brandMultiplier = getBrandRetentionMultiplier(make);
    baseValue = baseValue * brandMultiplier;

    // Apply mileage adjustment
    const mileageAdj = calculateMileageAdjustment(mileage, age);
    baseValue = baseValue * (1 + mileageAdj);

    // Calculate range (typically +/- 8-12% for private sales)
    const variance = PRICING_CONSTANTS.priceRangeMargin;
    const midpoint = Math.round(baseValue);
    const low = Math.round(baseValue * (1 - variance));
    const high = Math.round(baseValue * (1 + variance));

    // Ensure minimum values make sense
    const absoluteMin = PRICING_CONSTANTS.minimumValue;
    return {
        low: Math.max(absoluteMin, low),
        high: Math.max(absoluteMin + 500, high),
        midpoint: Math.max(absoluteMin + 250, midpoint),
    };
}

/**
 * Get approximate MSRP (convenience function for backward compatibility).
 */
export function getApproximateMsrp(make: string, model: string): number {
    return getMsrpData(make, model).baseMsrp;
}
