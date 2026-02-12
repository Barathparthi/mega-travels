"use client";

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRejectTripsheet } from '@/hooks/useAdminTripsheets';

interface RejectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripsheetId: string;
  tripsheetNumber: string;
  driverName: string;
  vehicleNumber: string;
  onSuccess?: () => void;
}

export function RejectModal({
  open,
  onOpenChange,
  tripsheetId,
  tripsheetNumber,
  driverName,
  vehicleNumber,
  onSuccess,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const rejectMutation = useRejectTripsheet();

  const handleReject = async () => {
    if (!reason.trim()) {
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: tripsheetId, reason });
      onOpenChange(false);
      setReason('');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            Reject Tripsheet
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this tripsheet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tripsheet:</span>
              <span className="text-sm font-medium">{tripsheetNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Driver:</span>
              <span className="text-sm font-medium">{driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Vehicle:</span>
              <span className="text-sm font-medium">{vehicleNumber}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Explain why the tripsheet is being rejected (e.g., 'KM readings incorrect on Dec 15', 'Missing fuel entries for 3 days')..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {!reason.trim() && (
              <p className="text-xs text-gray-500 mt-1">
                A detailed reason helps the driver make corrections
              </p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
              The tripsheet will be sent back to the driver for corrections. The driver
              will be able to edit and resubmit.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={rejectMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={rejectMutation.isPending || !reason.trim()}
            variant="destructive"
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Reject Tripsheet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
