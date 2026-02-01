'use client';

import React from 'react';
import { Star, Shield, AlertTriangle, Info } from 'lucide-react';
import type { SafetyRating } from '@/lib/api';

interface SafetyRatingsDisplayProps {
    safetyRating: SafetyRating;
}

function isValidRating(rating: string | undefined): boolean {
    if (!rating || rating === 'Not Rated') return false;
    const num = parseInt(rating, 10);
    return !isNaN(num) && num >= 1 && num <= 5;
}

function StarRating({ rating, label, sublabel }: { rating: string; label: string; sublabel?: string }) {
    const numericRating = parseInt(rating, 10);
    const isRated = isValidRating(rating);
    const stars = isRated ? numericRating : 0;
    const maxStars = 5;

    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <span className="text-sm text-muted-foreground">{label}</span>
                {sublabel && <span className="text-xs text-muted-foreground/70 ml-1">({sublabel})</span>}
            </div>
            <div className="flex items-center gap-1" role="img" aria-label={isRated ? `${stars} out of ${maxStars} stars` : 'Not rated'}>
                {isRated ? (
                    <>
                        {Array.from({ length: maxStars }).map((_, i) => (
                            <Star
                                key={i}
                                className={`size-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                aria-hidden="true"
                            />
                        ))}
                        <span className="ml-2 text-sm font-medium">{stars}/5</span>
                    </>
                ) : (
                    <span className="text-sm text-muted-foreground italic">Not Rated</span>
                )}
            </div>
        </div>
    );
}

export function SafetyRatingsDisplay({ safetyRating }: SafetyRatingsDisplayProps) {
    const overallNumeric = parseInt(safetyRating.overallRating, 10);
    const hasOverallRating = isValidRating(safetyRating.overallRating);

    // Check if we have any valid crash test ratings
    const hasFrontalRating = isValidRating(safetyRating.frontalCrashRating);
    const hasSideRating = isValidRating(safetyRating.sideCrashRating);
    const hasRolloverRating = isValidRating(safetyRating.rolloverRating);
    const hasAnyRating = hasFrontalRating || hasSideRating || hasRolloverRating;

    // Check if we're using component ratings (individual driver/passenger) instead of overall
    const usingComponentRatings = !hasOverallRating && hasAnyRating;

    return (
        <div className="space-y-4">
            {/* Overall Rating Highlight */}
            {hasOverallRating && (
                <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                        <div className="flex justify-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`size-6 ${i < overallNumeric ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                    aria-hidden="true"
                                />
                            ))}
                        </div>
                        <p className="text-sm font-medium">Overall Safety Rating</p>
                        <p className="text-xs text-muted-foreground">Based on NHTSA crash tests</p>
                    </div>
                </div>
            )}

            {/* Note when using component ratings */}
            {usingComponentRatings && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
                    <Info className="size-4 text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="text-blue-700 dark:text-blue-300">
                        NHTSA tested this vehicle but didn&apos;t assign overall category ratings.
                        Showing driver-side test results instead.
                    </p>
                </div>
            )}

            {/* Individual Ratings */}
            {hasAnyRating ? (
                <div className="divide-y divide-border">
                    <StarRating
                        rating={safetyRating.frontalCrashRating}
                        label="Frontal Crash"
                        sublabel={usingComponentRatings ? "driver" : undefined}
                    />
                    <StarRating
                        rating={safetyRating.sideCrashRating}
                        label="Side Crash"
                        sublabel={usingComponentRatings ? "driver" : undefined}
                    />
                    <StarRating rating={safetyRating.rolloverRating} label="Rollover" />
                </div>
            ) : (
                <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No crash test ratings available</p>
                </div>
            )}

            {/* Additional Stats */}
            {(safetyRating.complaintsCount > 0 || safetyRating.recallsCount > 0) && (
                <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                        {safetyRating.complaintsCount > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <AlertTriangle className="size-3" aria-hidden="true" />
                                <span>{safetyRating.complaintsCount} NHTSA complaints</span>
                            </div>
                        )}
                        {safetyRating.recallsCount > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                                <AlertTriangle className="size-3" aria-hidden="true" />
                                <span>{safetyRating.recallsCount} recalls</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function NoSafetyRatings() {
    return (
        <div className="text-center py-6 text-muted-foreground">
            <Shield className="size-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm">Safety ratings not available for this vehicle</p>
            <p className="text-xs mt-1">NHTSA may not have crash test data for this make/model/year</p>
        </div>
    );
}
