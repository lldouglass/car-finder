'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Shield, Info, AlertTriangle, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import type { Longevity, LifespanAnalysis, AppliedFactor, SurvivalAnalysis, SurvivalMilestone } from '@/lib/api';

interface UnifiedLifespanDisplayProps {
    longevity: Longevity;
    lifespanAnalysis?: LifespanAnalysis;
    survivalAnalysis?: SurvivalAnalysis;
}

function formatNumber(n: number): string {
    return n.toLocaleString();
}

function formatMiles(miles: number): string {
    if (miles >= 1000000) return `${(miles / 1000000).toFixed(1)}M`;
    if (miles >= 1000) return `${Math.round(miles / 1000)}k`;
    return miles.toLocaleString();
}

function formatPercent(probability: number): string {
    return `${Math.round(probability * 100)}%`;
}

function formatFactorPercent(multiplier: number): string {
    const percent = (multiplier - 1) * 100;
    if (percent > 0) return `+${percent.toFixed(0)}%`;
    if (percent < 0) return `${percent.toFixed(0)}%`;
    return '0%';
}

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

function ImpactIcon({ impact }: { impact: AppliedFactor['impact'] }) {
    if (impact === 'positive') return <TrendingUp className="size-3.5 text-green-500" aria-hidden="true" />;
    if (impact === 'negative') return <TrendingDown className="size-3.5 text-red-500" aria-hidden="true" />;
    return <Minus className="size-3.5 text-gray-400" aria-hidden="true" />;
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
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
            {icon} {label}
        </span>
    );
}

export function UnifiedLifespanDisplay({ longevity, lifespanAnalysis, survivalAnalysis }: UnifiedLifespanDisplayProps) {
    const [showFactors, setShowFactors] = useState(false);

    // Use adjusted lifespan from lifespanAnalysis if available, otherwise compute from longevity
    const estimatedLifespan = lifespanAnalysis
        ? lifespanAnalysis.adjustedLifespan
        : (longevity.percentUsed < 100
            ? Math.round(longevity.estimatedRemainingMiles / ((100 - longevity.percentUsed) / 100))
            : longevity.estimatedRemainingMiles);

    const hasFactors = lifespanAnalysis && lifespanAnalysis.appliedFactors && lifespanAnalysis.appliedFactors.length > 0;
    const confidence = lifespanAnalysis?.confidence || (survivalAnalysis?.modelConfidence) || 'medium';

    // Filter survival milestones to only show >= 1% probability
    const visibleMilestones = survivalAnalysis
        ? survivalAnalysis.milestones.filter(m => Math.round(m.probability * 100) >= 1)
        : [];
    const hasMilestones = visibleMilestones.length > 0;

    return (
        <div className="space-y-5">
            {/* Confidence badge */}
            <div className="flex items-center justify-end">
                <ConfidenceBadge confidence={confidence} />
            </div>

            {/* Hero: Estimated Lifespan */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Estimated Lifespan</p>
                <p className="text-4xl font-bold tracking-tight">
                    {formatNumber(estimatedLifespan)} <span className="text-lg font-normal text-muted-foreground">miles</span>
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/40 rounded-lg py-3 px-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatNumber(longevity.estimatedRemainingMiles)}
                    </p>
                    <p className="text-xs text-muted-foreground">miles</p>
                </div>
                <div className="bg-muted/40 rounded-lg py-3 px-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
                    <p className="text-lg font-semibold">{longevity.remainingYears}</p>
                    <p className="text-xs text-muted-foreground">years</p>
                </div>
                <div className="bg-muted/40 rounded-lg py-3 px-2">
                    <p className="text-xs text-muted-foreground mb-0.5">Life Used</p>
                    <p className="text-lg font-semibold">{longevity.percentUsed}%</p>
                    <div className="mt-1.5 mx-auto w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                        <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, longevity.percentUsed)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Expandable factors breakdown */}
            {hasFactors && (
                <div className="border rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowFactors(!showFactors)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Activity className="size-4 text-purple-500" aria-hidden="true" />
                            How we calculated this
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                {formatMiles(lifespanAnalysis!.baseLifespan)} base → {formatMiles(lifespanAnalysis!.adjustedLifespan)} adjusted
                            </span>
                            {showFactors ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </div>
                    </button>
                    {showFactors && (
                        <div className="px-4 pb-3 border-t">
                            <div className="divide-y">
                                {lifespanAnalysis!.appliedFactors.map((factor, index) => (
                                    <div key={`${factor.category}-${index}`} className="flex items-center justify-between py-2.5">
                                        <div className="flex items-center gap-2">
                                            <ImpactIcon impact={factor.impact} />
                                            <span className="text-sm">{factor.category}</span>
                                            <span className="text-xs text-muted-foreground">({factor.value})</span>
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            factor.impact === 'positive' ? 'text-green-600 dark:text-green-400'
                                            : factor.impact === 'negative' ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-500'
                                        }`}>
                                            {formatFactorPercent(factor.multiplier)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Adjusted based on transmission type, drivetrain, engine type, and other known factors.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Survival milestones */}
            {hasMilestones && (
                <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="size-4 text-blue-500" aria-hidden="true" />
                        Chance of Reaching
                    </h4>
                    <div className="space-y-1.5">
                        {visibleMilestones.map((milestone) => {
                            const pct = milestone.probability * 100;
                            const barClass = getBarClass(milestone.probability);
                            const textClass = getTextClass(milestone.probability);
                            return (
                                <div
                                    key={milestone.totalMiles}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium w-16">
                                            {formatMiles(milestone.totalMiles)}
                                        </span>
                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${barClass}`}
                                                style={{ width: `${Math.min(100, pct)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className={`text-lg font-bold ${textClass}`}>
                                        {formatPercent(milestone.probability)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Survival warnings */}
            {survivalAnalysis && survivalAnalysis.warnings.length > 0 && (
                <div className="space-y-1.5">
                    {survivalAnalysis.warnings.map((warning, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-2 rounded"
                        >
                            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                            <span>{warning}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Single methodology line */}
            <p className="text-xs text-muted-foreground">
                Based on reliability data, vehicle-specific factors, and a Weibull survival model. Assumes normal use and maintenance.
            </p>
        </div>
    );
}
