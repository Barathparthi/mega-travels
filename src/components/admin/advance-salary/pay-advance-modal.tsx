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
import { Loader2, Wallet } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';

interface PayAdvanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advance: any;
  onPay: (id: string, notes?: string) => void;
  isLoading: boolean;
}

export function PayAdvanceModal({
  open,
  onOpenChange,
  advance,
  onPay,
  isLoading,
}: PayAdvanceModalProps) {
  const [notes, setNotes] = useState('');

  if (!advance) return null;

  const handlePay = () => {
    onPay(advance._id, notes || undefined);
    setNotes('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Mark Advance as Paid
          </AlertDialogTitle>
          <AlertDialogDescription>
            Mark this advance salary as paid. This amount will be deducted from the driver's salary when it's generated.
            <div className="mt-4 space-y-2">
              <p><strong>Driver:</strong> {advance.driverId?.name}</p>
              <p><strong>Vehicle:</strong> {advance.vehicleId?.vehicleNumber}</p>
              <p><strong>Amount:</strong> {formatIndianCurrency(advance.amount)}</p>
              <p className="text-sm text-gray-600 mt-2">
                This advance will be automatically deducted from the driver's salary for{' '}
                {new Date(advance.requestedYear, advance.requestedMonth - 1).toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="notes">Payment Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add payment method, transaction ID, or other notes"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={() => setNotes('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePay}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking as Paid...
              </>
            ) : (
              'Mark as Paid'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

