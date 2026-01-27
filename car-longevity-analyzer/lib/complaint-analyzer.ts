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
 * Calculates severity based on complaint count and safety incidents
 */
function calculateSeverity(
    complaintCount: number,
    hasSafetyIncidents: boolean,
    hasDeaths: boolean
): KnownIssue['severity'] {
    if (hasDeaths) return 'CRITICAL';
    if (hasSafetyIncidents && complaintCount >= 10) return 'CRITICAL';
    if (hasSafetyIncidents || complaintCount >= 50) return 'MAJOR';
    if (complaintCount >= 20) return 'MODERATE';
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
