'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

export function ResultsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-9 w-32" />
                </div>

                {/* Vehicle Info skeleton */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Skeleton className="size-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-7 w-2/3" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SkeletonText lines={2} />
                    </CardContent>
                </Card>

                {/* Scores Grid skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center gap-2">
                                    <Skeleton className="size-5" />
                                    <Skeleton className="h-8 w-12" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Details Grid skeleton */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                            <Skeleton className="h-2 w-full" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Red Flags skeleton */}
                <Card className="mb-6">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="border-l-4 border-muted p-3 rounded-r bg-muted/30">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2 mt-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Questions skeleton */}
                <Card className="mb-6">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <Skeleton className="h-4 w-4" />
                                    <Skeleton className="h-4 flex-1" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Inline loading state for form submission
export function AnalyzingOverlay() {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="max-w-sm w-full mx-4">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="size-16 rounded-full border-4 border-muted" />
                            <div className="size-16 rounded-full border-4 border-primary border-t-transparent animate-spin absolute top-0" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Analyzing vehicle...</p>
                            <p className="text-sm text-muted-foreground">
                                Checking safety records, reliability data, and pricing
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
