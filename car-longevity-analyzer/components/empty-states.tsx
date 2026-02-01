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
    Wrench,
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

export function NoComponentIssues() {
    return (
        <EmptyState
            icon={<CheckCircle className="size-5 text-green-600" />}
            title="No NHTSA Complaints"
            description="No complaints have been reported to NHTSA for this vehicle."
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

interface NoPriceDataProps {
    reason?: 'no_mileage' | 'no_price' | 'no_vehicle' | 'api_error';
}

export function NoPriceData({ reason }: NoPriceDataProps = {}) {
    const descriptions: Record<string, string> = {
        no_mileage: 'Mileage is required to estimate fair market value. Please provide the vehicle mileage.',
        no_price: 'Asking price not detected. Please enter the asking price manually.',
        no_vehicle: 'Could not identify vehicle make/model to lookup market prices.',
        api_error: 'Market pricing data temporarily unavailable.',
    };
    return (
        <EmptyState
            icon={<DollarSign className="size-5 text-muted-foreground" />}
            title="Price Analysis Unavailable"
            description={reason ? descriptions[reason] : 'Mileage and price are required to estimate fair market value.'}
        />
    );
}

interface NoLongevityDataProps {
    reason?: 'no_mileage' | 'no_vehicle';
}

export function NoLongevityData({ reason }: NoLongevityDataProps = {}) {
    const descriptions: Record<string, string> = {
        no_mileage: 'Current mileage is required to calculate remaining lifespan. Please provide the vehicle mileage.',
        no_vehicle: 'Could not identify vehicle make/model to lookup lifespan data.',
    };
    return (
        <EmptyState
            icon={<HelpCircle className="size-5 text-muted-foreground" />}
            title="Longevity Data Unavailable"
            description={reason ? descriptions[reason] : 'Mileage is required to calculate remaining vehicle lifespan.'}
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

interface AIAnalysisUnavailableProps {
    reason?: 'api_key' | 'parse_error' | 'rate_limit' | 'timeout';
}

export function AIAnalysisUnavailable({ reason }: AIAnalysisUnavailableProps = {}) {
    const descriptions: Record<string, string> = {
        api_key: 'AI service not configured. Basic analysis is shown.',
        parse_error: 'AI response could not be processed. Basic analysis is shown.',
        rate_limit: 'AI service temporarily unavailable due to high demand.',
        timeout: 'AI analysis timed out. Please try again.',
    };
    return (
        <EmptyState
            icon={<AlertTriangle className="size-5 text-yellow-600" />}
            title="AI Analysis Unavailable"
            description={reason ? descriptions[reason] : 'Advanced AI analysis could not be performed. Basic checks are shown.'}
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

export function NoMaintenanceData() {
    return (
        <EmptyState
            icon={<Wrench className="size-5 text-green-600" />}
            title="No Maintenance Items Due"
            description="No upcoming maintenance items identified for this vehicle at its current mileage."
        />
    );
}
