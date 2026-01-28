'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info, Shield, AlertTriangle } from 'lucide-react';
import type { LifespanAnalysis, AppliedFactor } from '@/lib/api';

interface LifespanFactorsDisplayProps {
    lifespanAnalysis: LifespanAnalysis;
}

function formatPercentage(multiplier: number): string {
    const percent = (multiplier - 1) * 100;
    if (percent > 0) return `+${percent.toFixed(0)}%`;
    if (percent < 0) return `${percent.toFixed(0)}%`;
    return '0%';
}

function ImpactIcon({ impact }: { impact: AppliedFactor['impact'] }) {
    if (impact === 'positive') {
        return <TrendingUp className="size-4 text-green-500" aria-hidden="true" />;
    }
    if (impact === 'negative') {
        return <TrendingDown className="size-4 text-red-500" aria-hidden="true" />;
    }
    return <Minus className="size-4 text-gray-400" aria-hidden="true" />;
}

function ConfidenceBadge({ confidence }: { confidence: LifespanAnalysis['confidence'] }) {
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

function FactorRow({ factor }: { factor: AppliedFactor }) {
    const impactColors = {
        positive: 'text-green-600 dark:text-green-400',
        negative: 'text-red-600 dark:text-red-400',
        neutral: 'text-gray-500',
    };

    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-2">
                <ImpactIcon impact={factor.impact} />
                <div>
                    <span className="text-sm font-medium">{factor.category}</span>
                    <span className="text-xs text-muted-foreground ml-2">({factor.value})</span>
                </div>
            </div>
            <span className={`text-sm font-medium ${impactColors[factor.impact]}`}>
                {formatPercentage(factor.multiplier)}
            </span>
        </div>
    );
}

export function LifespanFactorsDisplay({ lifespanAnalysis }: LifespanFactorsDisplayProps) {
    const {
        baseLifespan,
        adjustedLifespan,
        totalMultiplier,
        appliedFactors,
        confidence,
    } = lifespanAnalysis;

    const hasFactors = appliedFactors && appliedFactors.length > 0;
    const lifespanDiff = adjustedLifespan - baseLifespan;
    const isPositive = lifespanDiff > 0;
    const isNegative = lifespanDiff < 0;

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Lifespan Adjustment</span>
                    <ConfidenceBadge confidence={confidence} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Base</p>
                        <p className="text-lg font-semibold">{(baseLifespan / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-muted-foreground">miles</p>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-500'}`}>
                            {isPositive ? '+' : ''}{((totalMultiplier - 1) * 100).toFixed(0)}%
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Adjusted</p>
                        <p className={`text-lg font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : isNegative ? 'text-red-600 dark:text-red-400' : ''}`}>
                            {(adjustedLifespan / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-muted-foreground">miles</p>
                    </div>
                </div>

                {lifespanDiff !== 0 && (
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                        {isPositive ? 'Increased' : 'Decreased'} by {Math.abs(lifespanDiff).toLocaleString()} miles
                    </p>
                )}
            </div>

            {/* Factor Breakdown */}
            {hasFactors ? (
                <div>
                    <h4 className="text-sm font-medium mb-2">Applied Factors</h4>
                    <div className="bg-background border rounded-lg">
                        {appliedFactors.map((factor, index) => (
                            <FactorRow key={`${factor.category}-${index}`} factor={factor} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-muted-foreground">
                    <Info className="size-5 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p className="text-sm">No adjustment factors available</p>
                    <p className="text-xs mt-1">Using base lifespan estimate for this model</p>
                </div>
            )}

            {/* Explanation */}
            <p className="text-xs text-muted-foreground">
                Lifespan is adjusted based on known factors like transmission type, drivetrain, climate region, and maintenance quality.
                {confidence === 'low' && ' Limited data available for this vehicle.'}
            </p>
        </div>
    );
}

export function NoLifespanAnalysis() {
    return (
        <div className="text-center py-6 text-muted-foreground">
            <Info className="size-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm">Lifespan analysis not available</p>
        </div>
    );
}
