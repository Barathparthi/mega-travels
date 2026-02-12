'use client';

import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ErrorPageProps {
    title?: string;
    message?: string;
    showBack?: boolean;
    showRetry?: boolean;
    onRetry?: () => void;
}

export function ErrorPage({
    title = 'Something went wrong',
    message = 'An unexpected error occurred. Please try again.',
    showBack = true,
    showRetry = true,
    onRetry,
}: ErrorPageProps) {
    const router = useRouter();

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
                <p className="text-gray-600 mb-8">{message}</p>
                <div className="flex gap-3 justify-center">
                    {showBack && (
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    )}
                    {showRetry && (
                        <Button onClick={onRetry || (() => window.location.reload())}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
