/**
 * Complaint Analyzer
 * Analyzes NHTSA complaints to extract known issues for a vehicle
 */

import type { Complaint } from './nhtsa';
import type { KnownIssue } from './api';

/**
 * Normalizes component names to group related complaints together.
 * NHTSA uses various naming conventions for similar components.
 */
function normalizeComponent(component: string): string {
    const normalized = component.toUpperCase().trim();

    // Group related components
    const componentGroups: Record<string, string[]> = {
        'ENGINE': ['ENGINE', 'ENGINE AND ENGINE COOLING', 'ENGINE COOLING SYSTEM'],
        'TRANSMISSION': ['POWER TRAIN', 'AUTOMATIC TRANSMISSION', 'MANUAL TRANSMISSION', 'TRANSMISSION', 'CVT'],
        'BRAKES': ['SERVICE BRAKES', 'BRAKES', 'PARKING BRAKE', 'BRAKE SYSTEM'],
        'STEERING': ['STEERING', 'POWER STEERING', 'ELECTRIC POWER STEERING'],
        'ELECTRICAL': ['ELECTRICAL SYSTEM', 'ELECTRICAL', 'BATTERY', 'CHARGING SYSTEM'],
        'AIRBAGS': ['AIR BAGS', 'AIRBAGS', 'AIR BAG'],
        'FUEL SYSTEM': ['FUEL SYSTEM', 'FUEL/PROPULSION SYSTEM', 'FUEL PUMP'],
        'SUSPENSION': ['SUSPENSION', 'FRONT SUSPENSION', 'REAR SUSPENSION'],
        'TIRES': ['TIRES', 'WHEELS', 'TIRES/WHEELS'],
        'SEAT BELTS': ['SEAT BELTS', 'SEAT BELT', 'RESTRAINT SYSTEM'],
        'EXTERIOR': ['EXTERIOR LIGHTING', 'LIGHTS', 'HEADLIGHTS', 'TAIL LIGHTS'],
        'INTERIOR': ['INTERIOR', 'SEATS', 'SEAT', 'INSTRUMENT PANEL'],
    };

    for (const [group, keywords] of Object.entries(componentGroups)) {
        for (const keyword of keywords) {
            if (normalized.includes(keyword)) {
                return group;
            }
        }
    }

    return normalized || 'OTHER';
}

/**
 * Calculates severity based on complaint count and safety incidents.
 * Thresholds are set to account for vehicle sales volume - popular vehicles
 * will naturally have more complaints. A 10-year-old vehicle that sold
 * millions of units will accumulate complaints over time.
 */
function calculateSeverity(
    complaintCount: number,
    hasSafetyIncidents: boolean,
    hasDeaths: boolean
): KnownIssue['severity'] {
    // CRITICAL: Multiple deaths or very high complaint volume with serious incidents
    if (hasDeaths && complaintCount >= 20) return 'CRITICAL';
    if (hasSafetyIncidents && complaintCount >= 100) return 'CRITICAL';

    // MAJOR: Deaths, or significant safety incidents, or high volume
    if (hasDeaths) return 'MAJOR';
    if (hasSafetyIncidents && complaintCount >= 25) return 'MAJOR';
    if (complaintCount >= 100) return 'MAJOR';

    // MODERATE: Some safety concerns or moderate volume
    if (hasSafetyIncidents || complaintCount >= 40) return 'MODERATE';
    if (complaintCount >= 15) return 'MINOR';

    return 'MINOR';
}

/**
 * Generates a human-readable description of the issue
 */
function generateDescription(
    component: string,
    complaints: Complaint[]
): string {
    const count = complaints.length;
    const crashes = complaints.filter(c => c.Crash).length;
    const fires = complaints.filter(c => c.Fire).length;
    const injuries = complaints.reduce((sum, c) => sum + c.Injuries, 0);
    const deaths = complaints.reduce((sum, c) => sum + c.Deaths, 0);

    const parts: string[] = [];

    parts.push(`${count} complaint${count !== 1 ? 's' : ''} reported`);

    if (deaths > 0) {
        parts.push(`${deaths} death${deaths !== 1 ? 's' : ''}`);
    }
    if (injuries > 0) {
        parts.push(`${injuries} injur${injuries !== 1 ? 'ies' : 'y'}`);
    }
    if (crashes > 0) {
        parts.push(`${crashes} crash${crashes !== 1 ? 'es' : ''}`);
    }
    if (fires > 0) {
        parts.push(`${fires} fire${fires !== 1 ? 's' : ''}`);
    }

    return parts.join(', ');
}

/**
 * Extracts 2-3 representative sample complaints from a list.
 * Prioritizes complaints with safety incidents.
 */
function extractSampleComplaints(complaints: Complaint[], maxSamples: number = 3): string[] {
    if (complaints.length === 0) return [];

    // Sort complaints to prioritize safety incidents
    const sorted = [...complaints].sort((a, b) => {
        // Prioritize by severity: deaths > injuries > crashes > fires > normal
        const aScore = (a.Deaths * 1000) + (a.Injuries * 100) + (a.Crash ? 10 : 0) + (a.Fire ? 5 : 0);
        const bScore = (b.Deaths * 1000) + (b.Injuries * 100) + (b.Crash ? 10 : 0) + (b.Fire ? 5 : 0);
        return bScore - aScore;
    });

    const samples: string[] = [];

    for (const complaint of sorted) {
        if (samples.length >= maxSamples) break;

        const summary = complaint.Summary?.trim();
        if (!summary) continue;

        // Keep full complaint text - don't truncate so users can read everything
        const text = summary;

        // Avoid duplicates (similar complaints)
        const isDuplicate = samples.some(s => {
            const overlap = s.substring(0, 50).toLowerCase();
            return text.toLowerCase().includes(overlap) || overlap.includes(text.substring(0, 50).toLowerCase());
        });

        if (!isDuplicate) {
            samples.push(text);
        }
    }

    return samples;
}

/**
 * Analyzes NHTSA complaints to extract known issues for a vehicle.
 * Groups complaints by component, counts occurrences, and assesses severity.
 *
 * @param complaints - Array of NHTSA complaints
 * @returns Array of known issues, sorted by severity and count
 */
export function extractKnownIssues(complaints: Complaint[]): KnownIssue[] {
    if (!complaints || complaints.length === 0) return [];

    // Group complaints by normalized component
    const componentMap = new Map<string, Complaint[]>();

    for (const complaint of complaints) {
        const component = normalizeComponent(complaint.Component);
        if (!componentMap.has(component)) {
            componentMap.set(component, []);
        }
        componentMap.get(component)!.push(complaint);
    }

    // Convert to known issues
    const issues: KnownIssue[] = [];

    for (const [component, componentComplaints] of componentMap.entries()) {
        // Skip if only 1-2 complaints (not significant)
        if (componentComplaints.length < 3) continue;

        const hasDeaths = componentComplaints.some(c => c.Deaths > 0);
        const hasSafetyIncidents = componentComplaints.some(
            c => c.Crash || c.Fire || c.Injuries > 0 || c.Deaths > 0
        );

        const severity = calculateSeverity(
            componentComplaints.length,
            hasSafetyIncidents,
            hasDeaths
        );

        issues.push({
            component,
            severity,
            complaintCount: componentComplaints.length,
            description: generateDescription(component, componentComplaints),
            hasSafetyIncidents,
            sampleComplaints: extractSampleComplaints(componentComplaints),
        });
    }

    // Sort by severity (CRITICAL > MAJOR > MODERATE > MINOR), then by count
    const severityOrder: Record<string, number> = {
        'CRITICAL': 0,
        'MAJOR': 1,
        'MODERATE': 2,
        'MINOR': 3,
    };

    issues.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.complaintCount - a.complaintCount;
    });

    // Return top 5 issues
    return issues.slice(0, 5);
}
