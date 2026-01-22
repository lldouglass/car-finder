// Custom error classes for the Car Longevity Analyzer

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        details?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, true, details);
    }
}

export class VinDecodeError extends AppError {
    constructor(message: string = 'Unable to decode VIN. Please check the VIN and try again.') {
        super(message, 404, true);
    }
}

export class VinInvalidError extends AppError {
    constructor(message: string = 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.') {
        super(message, 400, true);
    }
}

export class VehicleNotFoundError extends AppError {
    constructor(message: string = 'Vehicle information not found for this VIN.') {
        super(message, 404, true);
    }
}

export class ReliabilityDataNotFoundError extends AppError {
    constructor(make: string, model: string) {
        super(
            `No reliability data available for ${make} ${model}. Using default estimates.`,
            200, // Not a real error, just missing data
            true
        );
    }
}

export class NHTSAApiError extends AppError {
    constructor(message: string = 'Unable to fetch safety data from NHTSA. Please try again later.') {
        super(message, 503, true);
    }
}

export class AIAnalysisError extends AppError {
    constructor(message: string = 'AI analysis is temporarily unavailable. Basic analysis will be provided.') {
        super(message, 503, true);
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests. Please wait a moment and try again.') {
        super(message, 429, true);
    }
}

export class NetworkError extends AppError {
    constructor(message: string = 'Network error. Please check your connection and try again.') {
        super(message, 0, true);
    }
}

// User-friendly error messages mapping
export const ERROR_MESSAGES: Record<string, string> = {
    INVALID_VIN: 'The VIN you entered is invalid. Please check and try again.',
    VIN_NOT_FOUND: 'Could not find vehicle information for this VIN.',
    NHTSA_UNAVAILABLE: 'Safety data service is temporarily unavailable.',
    AI_UNAVAILABLE: 'AI analysis is temporarily unavailable. Basic analysis provided.',
    NETWORK_ERROR: 'Connection error. Please check your internet and try again.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    SERVER_ERROR: 'Something went wrong. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    TIMEOUT: 'Request timed out. Please try again.',
};

// Helper to get user-friendly message from error
export function getUserFriendlyMessage(error: unknown): string {
    if (error instanceof AppError) {
        return error.message;
    }

    if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes('fetch')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }
        if (error.message.includes('timeout')) {
            return ERROR_MESSAGES.TIMEOUT;
        }
        return error.message || ERROR_MESSAGES.SERVER_ERROR;
    }

    return ERROR_MESSAGES.SERVER_ERROR;
}

// Helper to determine if error is retryable
export function isRetryableError(error: unknown): boolean {
    if (error instanceof AppError) {
        return [503, 429, 0].includes(error.statusCode);
    }
    if (error instanceof Error) {
        return error.message.includes('fetch') ||
               error.message.includes('network') ||
               error.message.includes('timeout');
    }
    return false;
}
