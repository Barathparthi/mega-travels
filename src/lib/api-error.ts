import { NextResponse } from 'next/server';

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function handleApiError(error: unknown) {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof Error) {
        // MongoDB duplicate key error
        if (error.message.includes('duplicate key')) {
            return NextResponse.json(
                { error: 'This record already exists', code: 'DUPLICATE' },
                { status: 409 }
            );
        }

        // MongoDB validation error
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { error: error.message, code: 'VALIDATION_ERROR' },
                { status: 400 }
            );
        }
    }

    return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
    );
}

// Common errors
export const Errors = {
    UNAUTHORIZED: new ApiError('Unauthorized', 401, 'UNAUTHORIZED'),
    FORBIDDEN: new ApiError('Forbidden', 403, 'FORBIDDEN'),
    NOT_FOUND: (item: string) =>
        new ApiError(`${item} not found`, 404, 'NOT_FOUND'),
    BAD_REQUEST: (message: string) =>
        new ApiError(message, 400, 'BAD_REQUEST'),
    CONFLICT: (message: string) => new ApiError(message, 409, 'CONFLICT'),
};
