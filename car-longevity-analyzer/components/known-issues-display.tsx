'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, Skull } from 'lucide-react';
import type { KnownIssue } from '@/lib/api';

interface KnownIssuesDisplayProps {
    issues: KnownIssue[];
}

function SeverityBadge({ severity }: { severity: KnownIssue['severity'] }) {
    const config = {
        CRITICAL: {
            className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            icon: <Skull className="size-3" aria-hidden="true" />,
        },
        MAJOR: {
            className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            icon: <AlertCircle className="size-3" aria-hidden="true" />,
        },
        MODERATE: {
            className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            icon: <AlertTriangle className="size-3" aria-hidden="true" />,
        },
        MINOR: {
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            icon: <Info className="size-3" aria-hidden="true" />,
        },
    };

    const { className, icon } = config[severity];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
            {icon}
            {severity}
        </span>
    );
}

function IssueCard({ issue }: { issue: KnownIssue }) {
    const borderColors = {
        CRITICAL: 'border-l-red-500',
        MAJOR: 'border-l-orange-500',
        MODERATE: 'border-l-yellow-500',
        MINOR: 'border-l-blue-500',
    };

    const bgColors = {
        CRITICAL: 'bg-red-50 dark:bg-red-950/30',
        MAJOR: 'bg-orange-50 dark:bg-orange-950/30',
        MODERATE: 'bg-yellow-50 dark:bg-yellow-950/30',
        MINOR: 'bg-blue-50 dark:bg-blue-950/30',
    };

    return (
        <div
            className={`border-l-4 ${borderColors[issue.severity]} ${bgColors[issue.severity]} p-3 rounded-r`}
            role="listitem"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{issue.component}</span>
                        <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="text-xs text-muted-foreground">{issue.description}</p>
                </div>
                {issue.hasSafetyIncidents && (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title="Safety incidents reported">
                        <AlertCircle className="size-4" aria-hidden="true" />
                    </div>
                )}
            </div>
        </div>
    );
}

export function KnownIssuesDisplay({ issues }: KnownIssuesDisplayProps) {
    if (!issues || issues.length === 0) {
        return <NoKnownIssues />;
    }

    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const majorCount = issues.filter(i => i.severity === 'MAJOR').length;

    return (
        <div className="space-y-3">
            {/* Summary warning for critical/major issues */}
            {(criticalCount > 0 || majorCount > 0) && (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded text-sm">
                    <AlertCircle className="size-4 text-red-500" aria-hidden="true" />
                    <span className="text-red-800 dark:text-red-200">
                        {criticalCount > 0 && `${criticalCount} critical`}
                        {criticalCount > 0 && majorCount > 0 && ' and '}
                        {majorCount > 0 && `${majorCount} major`}
                        {' '}issue{(criticalCount + majorCount) !== 1 ? 's' : ''} reported for this model
                    </span>
                </div>
            )}

            {/* Issue list */}
            <div className="space-y-2" role="list" aria-label="Known issues from NHTSA complaints">
                {issues.map((issue, index) => (
                    <IssueCard key={`${issue.component}-${index}`} issue={issue} />
                ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground pt-2">
                Based on NHTSA consumer complaints. Not all vehicles will experience these issues.
            </p>
        </div>
    );
}

export function NoKnownIssues() {
    return (
        <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="size-8 mx-auto mb-2 text-green-500 opacity-70" aria-hidden="true" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">No significant issues found</p>
            <p className="text-xs mt-1">Few or no complaints reported to NHTSA for this vehicle</p>
        </div>
    );
}
