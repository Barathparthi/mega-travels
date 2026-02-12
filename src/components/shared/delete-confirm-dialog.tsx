'use client';

import { ConfirmDialog } from './confirm-dialog';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    itemType?: string;
    onDelete: () => void;
    isLoading?: boolean;
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    itemName,
    itemType = 'item',
    onDelete,
    isLoading,
}: DeleteConfirmDialogProps) {
    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Delete ${itemType}?`}
            description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={onDelete}
            isLoading={isLoading}
        />
    );
}
