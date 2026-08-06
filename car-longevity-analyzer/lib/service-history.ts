import type { KnownIssue } from './reliability-data';
import type { MaintenanceQuality } from './lifespan-factors';

export interface RecognizedService {
    label: string;
    component: KnownIssue['component'] | 'general';
}

export interface ServiceHistoryAnalysis {
    recognized: RecognizedService[];
    /** null when nothing in the text supports a maintenance-quality inference */
    maintenanceQuality: MaintenanceQuality | null;
    /** Descriptions of known issues the stated work appears to address */
    addressedIssueDescriptions: string[];
}

interface ServicePattern {
    label: string;
    component: KnownIssue['component'] | 'general';
    /** Matched against the owner's text to recognize the service */
    aliases: RegExp;
    /** Matched against a known issue's description to mark it addressed */
    issuePattern?: RegExp;
}

// Each entry recognizes one class of service work. `aliases` runs against the
// owner's free text; `issuePattern` runs against known-issue descriptions so a
// recognized service can mark the specific documented risk as addressed.
const SERVICE_PATTERNS: ServicePattern[] = [
    { label: 'Head gasket replaced', component: 'engine', aliases: /head\s*gaskets?/i, issuePattern: /head\s*gasket/i },
    { label: 'Timing belt/chain service', component: 'engine', aliases: /timing\s*(belt|chain)/i, issuePattern: /timing\s*(belt|chain)/i },
    { label: 'Engine rebuilt or replaced', component: 'engine', aliases: /(engine|motor)\s*(rebuilt|rebuild|replaced|swap(ped)?|new)|new\s*(engine|motor)|(rebuilt|replaced)\s*(the\s*)?(engine|motor)/i, issuePattern: /engine|oil\s*consumption|piston|rod\s*bearing/i },
    { label: 'Oil consumption repair', component: 'engine', aliases: /piston\s*rings?|oil\s*consumption\s*(fix(ed)?|repair(ed)?|addressed)/i, issuePattern: /oil\s*consumption|piston/i },
    { label: 'Spark plugs / ignition service', component: 'engine', aliases: /spark\s*plugs?|ignition\s*coils?/i },
    { label: 'Transmission replaced or rebuilt', component: 'transmission', aliases: /(transmission|trans|cvt|gearbox)\s*(rebuilt|rebuild|replaced|new|swap(ped)?)|new\s*(transmission|cvt)|(rebuilt|replaced)\s*(the\s*)?(transmission|cvt)/i, issuePattern: /transmission|cvt|torque\s*converter|shift/i },
    { label: 'Transmission serviced (fluid)', component: 'transmission', aliases: /(transmission|trans|cvt)\s*(fluid|service(d)?|flush(ed)?)/i, issuePattern: /transmission\s*fluid|cvt/i },
    { label: 'Clutch replaced', component: 'transmission', aliases: /clutch\s*(replaced|new|done)|new\s*clutch/i, issuePattern: /clutch/i },
    { label: 'Brake service', component: 'brakes', aliases: /brakes?\s*(done|new|replaced|serviced)|new\s*brakes?|brake\s*(pads?|rotors?|calipers?)/i, issuePattern: /brake/i },
    { label: 'Suspension work', component: 'suspension', aliases: /struts?|shocks?|control\s*arms?|ball\s*joints?|sway\s*bar|suspension\s*(work|replaced|done)/i, issuePattern: /strut|shock|suspension|control\s*arm|ball\s*joint/i },
    { label: 'Water pump replaced', component: 'cooling', aliases: /water\s*pump/i, issuePattern: /water\s*pump/i },
    { label: 'Cooling system service', component: 'cooling', aliases: /radiator|thermostat|coolant\s*(flush(ed)?|service(d)?|leak\s*(fix(ed)?|repair(ed)?))/i, issuePattern: /radiator|coolant|cooling|thermostat|overheat/i },
    { label: 'Battery / charging system', component: 'electrical', aliases: /alternator|starter|new\s*battery|battery\s*(replaced|new)/i, issuePattern: /alternator|starter|battery|electrical/i },
    { label: 'A/C service', component: 'hvac', aliases: /a\/?c\s*(compressor|recharge(d)?|fixed|serviced|repair(ed)?)|air\s*conditioning/i, issuePattern: /a\/?c|air\s*condition|compressor|hvac/i },
    { label: 'Fuel system service', component: 'fuel', aliases: /fuel\s*(pump|injectors?|filter)/i, issuePattern: /fuel\s*(pump|injector)/i },
    { label: 'Exhaust work', component: 'exhaust', aliases: /catalytic\s*converter|muffler|exhaust\s*(work|replaced|repair(ed)?)/i, issuePattern: /exhaust|catalytic/i },
    { label: 'Steering work', component: 'steering', aliases: /power\s*steering|steering\s*rack|tie\s*rods?/i, issuePattern: /steering/i },
    { label: 'Rust repair / undercoating', component: 'body', aliases: /rust\s*(repair(ed)?|treated|proof(ed|ing)?)|undercoat(ed|ing)?/i, issuePattern: /rust|corrosion/i },
    { label: 'New tires', component: 'general', aliases: /new\s*tires?|tires?\s*(replaced|new)/i },
    { label: 'Documented maintenance', component: 'general', aliases: /service\s*records?|maintenance\s*records?|receipts|dealer\s*(serviced|maintained)|full\s*history|regular(ly)?\s*(oil\s*changes?|serviced|maintained)|well[\s-]*maintained|oil\s*change(s|d)?\s*(regular|every|on\s*time)/i },
];

export function parseServiceHistory(text: string): RecognizedService[] {
    const recognized: RecognizedService[] = [];
    for (const pattern of SERVICE_PATTERNS) {
        if (pattern.aliases.test(text)) {
            recognized.push({ label: pattern.label, component: pattern.component });
        }
    }
    return recognized;
}

/**
 * Infer maintenance quality from the stated work. Conservative: real service
 * work implies at least 'good'; documented records plus multiple jobs implies
 * 'excellent'; unrecognized text implies nothing (null).
 */
export function inferMaintenanceQuality(recognized: RecognizedService[]): MaintenanceQuality | null {
    const substantive = recognized.filter((r) => r.component !== 'general' || r.label === 'New tires');
    const hasRecords = recognized.some((r) => r.label === 'Documented maintenance');

    if (hasRecords && substantive.length >= 2) return 'excellent';
    if (hasRecords || substantive.length >= 1) return 'good';
    return null;
}

/**
 * Full analysis: recognize services in the owner's text, infer maintenance
 * quality, and mark which of this model's known issues the work addresses.
 * Addressed matches are deliberately strict (service keyword must appear in
 * the issue description) to avoid overclaiming.
 */
export function analyzeServiceHistory(
    text: string | undefined,
    knownIssues: Pick<KnownIssue, 'description'>[]
): ServiceHistoryAnalysis | null {
    const trimmed = text?.trim();
    if (!trimmed) return null;

    const recognized = parseServiceHistory(trimmed);
    const matchedPatterns = SERVICE_PATTERNS.filter(
        (p) => p.issuePattern && p.aliases.test(trimmed)
    );

    const addressedIssueDescriptions = knownIssues
        .filter((issue) => matchedPatterns.some((p) => p.issuePattern!.test(issue.description)))
        .map((issue) => issue.description);

    return {
        recognized,
        maintenanceQuality: inferMaintenanceQuality(recognized),
        addressedIssueDescriptions,
    };
}
