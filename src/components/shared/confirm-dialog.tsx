'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from './loading-spinner';
import { AlertTriangle, Trash2, Check } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive' | 'warning';
    onConfirm: () => void;
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    isLoading = false,
}: ConfirmDialogProps) {
    const icons = {
        default: <Check className="w-6 h-6 text-brand-red" />,
        destructive: <Trash2 className="w-6 h-6 text-red-600" />,
        warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    };

    const iconBg = {
        default: 'bg-red-50',
        destructive: 'bg-red-100',
        warning: 'bg-amber-100',
    };

    const buttonVariant = {
        default: 'bg-brand-red hover:bg-brand-red/90',
        destructive: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-amber-600 hover:bg-amber-700',
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div
                        className={`w-12 h-12 ${iconBg[variant]} rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                        {icons[variant]}
                    </div>
                    <AlertDialogTitle className="text-center">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-3">
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={buttonVariant[variant]}
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2 text-white" />
                                Processing...
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
