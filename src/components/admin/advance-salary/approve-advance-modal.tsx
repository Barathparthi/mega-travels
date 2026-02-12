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
import { Loader2 } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';

interface ApproveAdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: any;
  onApprove: (id: string) => void;
  isLoading: boolean;
}

export function ApproveAdvanceModal({
  open,
  onOpenChange,
  advance,
  onApprove,
  isLoading,
}: ApproveAdvanceModalProps) {
  if (!advance) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Advance Salary</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve this advance salary request?
            <div className="mt-4 space-y-2">
              <p><strong>Driver:</strong> {advance.driverId?.name}</p>
              <p><strong>Vehicle:</strong> {advance.vehicleId?.vehicleNumber}</p>
              <p><strong>Amount:</strong> {formatIndianCurrency(advance.amount)}</p>
              {advance.reason && <p><strong>Reason:</strong> {advance.reason}</p>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onApprove(advance._id)}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

