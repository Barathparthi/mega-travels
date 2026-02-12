'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            expand={false}
            richColors
            toastOptions={{
                duration: 4000,
                style: {
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    padding: '16px',
                    borderRadius: '8px',
                },
                classNames: {
                    success: 'border-l-4 border-l-green-500',
                    error: 'border-l-4 border-l-red-500',
                    warning: 'border-l-4 border-l-amber-500',
                    info: 'border-l-4 border-l-blue-500',
                },
            }}
            closeButton
        />
    );
}
