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

// Risk level colors and styling
const RISK_CONFIG: Record<SurvivalRiskLevel, {
    bgClass: string;
    textClass: string;
    barClass: string;
    label: string;
}> = {
    safe: {
        bgClass: 'bg-green-100 dark:bg-green-900/30',
        textClass: 'text-green-700 dark:text-green-300',
        barClass: 'bg-green-500',
        label: 'Safe',
    },
    moderate: {
        bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
        textClass: 'text-yellow-700 dark:text-yellow-300',
        barClass: 'bg-yellow-500',
        label: 'Moderate',
    },
    risky: {
        bgClass: 'bg-orange-100 dark:bg-orange-900/30',
        textClass: 'text-orange-700 dark:text-orange-300',
        barClass: 'bg-orange-500',
        label: 'Risky',
    },
    unlikely: {
        bgClass: 'bg-red-100 dark:bg-red-900/30',
        textClass: 'text-red-700 dark:text-red-300',
        barClass: 'bg-red-500',
        label: 'Unlikely',
    },
};

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
    const config = RISK_CONFIG[milestone.riskLevel];
    const probabilityPercent = milestone.probability * 100;

    return (
        <div
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${config.bgClass}`}
            role="row"
            aria-label={`${formatMiles(milestone.additionalMiles)} more miles: ${formatPercent(milestone.probability)} probability`}
        >
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium w-16">
                    +{formatMiles(milestone.additionalMiles)}
                </span>
                {/* Probability bar */}
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${config.barClass}`}
                        style={{ width: `${Math.min(100, probabilityPercent)}%` }}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${config.textClass}`}>
                    {formatPercent(milestone.probability)}
                </span>
            </div>
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
            <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Activity className="size-4 text-purple-500" aria-hidden="true" />
                    Probability of Reaching Milestones
                </h4>
                <div className="space-y-1.5" role="table" aria-label="Survival probability milestones">
                    {milestones.map((milestone) => (
                        <MilestoneRow
                            key={milestone.additionalMiles}
                            milestone={milestone}
                        />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
                {(['safe', 'moderate', 'risky', 'unlikely'] as const).map((level) => {
                    const config = RISK_CONFIG[level];
                    return (
                        <div key={level} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded ${config.barClass}`} />
                            <span className="text-muted-foreground">
                                {level === 'safe' && '80%+'}
                                {level === 'moderate' && '50-79%'}
                                {level === 'risky' && '20-49%'}
                                {level === 'unlikely' && '<20%'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Warnings */}
            <WarningsList warnings={warnings} />

            {/* Explanation */}
            <p className="text-xs text-muted-foreground">
                Probabilities are calculated using a Weibull survival model, which accounts for the vehicle's current mileage,
                adjusted lifespan, reliability score, and known issues. These estimates assume continued normal use and maintenance.
            </p>

            {/* Disclaimer */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
                <strong>Note:</strong> These probabilities estimate the chance of reaching each mileage milestone based on
                real-world vehicle survival data. They account for all reasons vehicles leave the road—mechanical failure,
                accidents, and owner decisions. Only about 15-20% of even the most reliable vehicles remain on the road
                at 200k miles.
            </div>
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
