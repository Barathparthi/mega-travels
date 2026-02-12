'use client';

import { ErrorPage } from '@/components/shared/error-page';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <ErrorPage
            title="Application Error"
            message={error.message || 'An unexpected error occurred'}
            onRetry={reset}
        />
    );
}
