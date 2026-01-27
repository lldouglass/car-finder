'use client';

import React from 'react';
import { Star, Shield, AlertTriangle } from 'lucide-react';
import type { SafetyRating } from '@/lib/api';

interface SafetyRatingsDisplayProps {
    safetyRating: SafetyRating;
}

function StarRating({ rating, label }: { rating: string; label: string }) {
    const numericRating = parseInt(rating, 10);
    const isRated = !isNaN(numericRating) && rating !== 'Not Rated';
    const stars = isRated ? numericRating : 0;
    const maxStars = 5;

    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{label}</span>
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
    const hasOverallRating = !isNaN(overallNumeric) && safetyRating.overallRating !== 'Not Rated';

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

            {/* Individual Ratings */}
            <div className="divide-y divide-border">
                <StarRating rating={safetyRating.frontalCrashRating} label="Frontal Crash" />
                <StarRating rating={safetyRating.sideCrashRating} label="Side Crash" />
                <StarRating rating={safetyRating.rolloverRating} label="Rollover" />
            </div>

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
