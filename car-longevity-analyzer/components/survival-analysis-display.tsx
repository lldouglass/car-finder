'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, Shield, Info, Activity } from 'lucide-react';
import type { SurvivalAnalysis, SurvivalMilestone, SurvivalRiskLevel } from '@/lib/api';

interface SurvivalAnalysisDisplayProps {
    survivalAnalysis: SurvivalAnalysis;
}

function formatMiles(miles: number): string {
    if (miles >= 1000000) {
        return `${(miles / 1000000).toFixed(1)}M`;
    }
    if (miles >= 1000) {
        return `${Math.round(miles / 1000)}k`;
    }
    return miles.toLocaleString();
}

function formatPercent(probability: number): string {
    return `${Math.round(probability * 100)}%`;
}

// Bar color based on probability
function getBarClass(probability: number): string {
    const pct = probability * 100;
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    if (pct >= 20) return 'bg-orange-500';
    return 'bg-red-500';
}

function getTextClass(probability: number): string {
    const pct = probability * 100;
    if (pct >= 80) return 'text-green-600 dark:text-green-400';
    if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (pct >= 20) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
}

function ConfidenceBadge({ confidence }: { confidence: SurvivalAnalysis['modelConfidence'] }) {
    const config = {
        high: {
            className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            icon: <Shield className="size-3" aria-hidden="true" />,
            label: 'High Confidence',
        },
        medium: {
            className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            icon: <Info className="size-3" aria-hidden="true" />,
            label: 'Medium Confidence',
        },
        low: {
            className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
            icon: <AlertTriangle className="size-3" aria-hidden="true" />,
            label: 'Low Confidence',
        },
    };

    const { className, icon, label } = config[confidence];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}>
            {icon}
            {label}
        </span>
    );
}

function MilestoneRow({ milestone }: { milestone: SurvivalMilestone }) {
    const probabilityPercent = milestone.probability * 100;
    const barClass = getBarClass(milestone.probability);
    const textClass = getTextClass(milestone.probability);

    return (
        <div
            className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30"
            role="row"
            aria-label={`${formatMiles(milestone.totalMiles)} total miles: ${formatPercent(milestone.probability)} probability`}
        >
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">
                    {formatMiles(milestone.totalMiles)}
                </span>
                {/* Probability bar */}
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${barClass}`}
                        style={{ width: `${Math.min(100, probabilityPercent)}%` }}
                    />
                </div>
            </div>
            <span className={`text-lg font-bold ${textClass}`}>
                {formatPercent(milestone.probability)}
            </span>
        </div>
    );
}

function WarningsList({ warnings }: { warnings: string[] }) {
    if (warnings.length === 0) return null;

    return (
        <div className="space-y-1.5 mt-4">
            {warnings.map((warning, index) => (
                <div
                    key={index}
                    className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-2 rounded"
                >
                    <AlertTriangle className="size-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{warning}</span>
                </div>
            ))}
        </div>
    );
}

export function SurvivalAnalysisDisplay({ survivalAnalysis }: SurvivalAnalysisDisplayProps) {
    const {
        milestones,
        expectedAdditionalMiles,
        confidenceRange,
        modelConfidence,
        warnings,
    } = survivalAnalysis;

    // Filter out milestones with <1% probability
    const visibleMilestones = milestones.filter(m => Math.round(m.probability * 100) >= 1);

    return (
        <div className="space-y-4">
            {/* Summary Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Survival Probability Model</span>
                <ConfidenceBadge confidence={modelConfidence} />
            </div>

            {/* Expected Remaining Miles Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Expected Additional Miles</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {formatMiles(expectedAdditionalMiles)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        (50% probability to reach)
                    </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    Likely range: {formatMiles(confidenceRange.low)} - {formatMiles(confidenceRange.high)} additional miles
                </div>
            </div>

            {/* Milestone Table */}
            {visibleMilestones.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Activity className="size-4 text-purple-500" aria-hidden="true" />
                        Chance of Reaching
                    </h4>
                    <div className="space-y-1.5" role="table" aria-label="Survival probability milestones">
                        {visibleMilestones.map((milestone) => (
                            <MilestoneRow
                                key={milestone.totalMiles}
                                milestone={milestone}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings */}
            <WarningsList warnings={warnings} />

            {/* Single-line explanation */}
            <p className="text-xs text-muted-foreground">
                Based on a Weibull survival model using this vehicle's mileage, reliability score, and known issues. Assumes normal use and maintenance.
            </p>
        </div>
    );
}

export function NoSurvivalAnalysis() {
    return (
        <div className="text-center py-6 text-muted-foreground">
            <Activity className="size-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm">Survival analysis not available</p>
            <p className="text-xs mt-1">Mileage data is required for survival probability estimates</p>
        </div>
    );
}
