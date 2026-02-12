'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';

interface RejectAdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: any;
  onReject: (id: string, reason?: string) => void;
  isLoading: boolean;
}

export function RejectAdvanceModal({
  open,
  onOpenChange,
  advance,
  onReject,
  isLoading,
}: RejectAdvanceModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  if (!advance) return null;

  const handleReject = () => {
    onReject(advance._id, rejectionReason || undefined);
    setRejectionReason('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Advance Salary</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reject this advance salary request?
            <div className="mt-4 space-y-2">
              <p><strong>Driver:</strong> {advance.driverId?.name}</p>
              <p><strong>Vehicle:</strong> {advance.vehicleId?.vehicleNumber}</p>
              <p><strong>Amount:</strong> {formatIndianCurrency(advance.amount)}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
          <Textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={() => setRejectionReason('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

