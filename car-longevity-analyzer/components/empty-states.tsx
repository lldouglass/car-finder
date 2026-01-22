'use client';

import { cn } from '@/lib/utils';
import {
    CheckCircle,
    ShieldCheck,
    AlertTriangle,
    HelpCircle,
    DollarSign,
    FileQuestion,
    Database,
} from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    className?: string;
}

export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center py-8 px-4 text-center',
                className
            )}
            role="status"
            aria-label={title}
        >
            {icon && (
                <div className="rounded-full bg-muted p-3 mb-3">
                    {icon}
                </div>
            )}
            <p className="font-medium text-sm">{title}</p>
            {description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>
            )}
        </div>
    );
}

export function NoRecallsFound() {
    return (
        <EmptyState
            icon={<ShieldCheck className="size-5 text-green-600" />}
            title="No Recalls Found"
            description="No safety recalls have been reported for this vehicle."
        />
    );
}

export function NoKnownIssues() {
    return (
        <EmptyState
            icon={<CheckCircle className="size-5 text-green-600" />}
            title="No Known Issues"
            description="No common issues reported for this make/model/year."
        />
    );
}

export function NoRedFlags() {
    return (
        <EmptyState
            icon={<CheckCircle className="size-5 text-green-600" />}
            title="No Red Flags Detected"
            description="The listing appears clean with no obvious warning signs."
        />
    );
}

export function NoPriceData() {
    return (
        <EmptyState
            icon={<DollarSign className="size-5 text-muted-foreground" />}
            title="Price Analysis Unavailable"
            description="Insufficient data to estimate fair market value."
        />
    );
}

export function NoLongevityData() {
    return (
        <EmptyState
            icon={<HelpCircle className="size-5 text-muted-foreground" />}
            title="Longevity Data Unavailable"
            description="Mileage or lifespan data not available for analysis."
        />
    );
}

export function NoReliabilityData({ make, model }: { make?: string; model?: string }) {
    return (
        <EmptyState
            icon={<Database className="size-5 text-muted-foreground" />}
            title="Reliability Data Not Found"
            description={
                make && model
                    ? `No reliability data available for ${make} ${model}. Using default estimates.`
                    : 'Vehicle not in our reliability database. Using default estimates.'
            }
        />
    );
}

export function NoQuestionsGenerated() {
    return (
        <EmptyState
            icon={<FileQuestion className="size-5 text-muted-foreground" />}
            title="No Specific Questions"
            description="No targeted questions generated for this listing."
        />
    );
}

export function AIAnalysisUnavailable() {
    return (
        <EmptyState
            icon={<AlertTriangle className="size-5 text-yellow-600" />}
            title="AI Analysis Unavailable"
            description="Advanced AI analysis could not be performed. Basic checks are shown."
        />
    );
}

export function VehicleNotIdentified() {
    return (
        <EmptyState
            icon={<HelpCircle className="size-5 text-muted-foreground" />}
            title="Vehicle Not Identified"
            description="Could not identify vehicle details from the listing."
        />
    );
}
