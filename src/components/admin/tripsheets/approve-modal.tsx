"use client";

import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApproveTripsheet } from '@/hooks/useAdminTripsheets';
import { formatIndianNumber } from '@/lib/utils/billing';

interface ApproveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripsheetId: string;
  tripsheetNumber: string;
  driverName: string;
  vehicleNumber: string;
  summary: {
    totalWorkingDays: number;
    totalKms: number;
    totalHours: number;
  };
  onSuccess?: () => void;
}

export function ApproveModal({
  open,
  onOpenChange,
  tripsheetId,
  tripsheetNumber,
  driverName,
  vehicleNumber,
  summary,
  onSuccess,
}: ApproveModalProps) {
  const approveMutation = useApproveTripsheet();

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(tripsheetId);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Approve error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Approve Tripsheet
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to approve this tripsheet?
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

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-blue-900 mb-2">Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.totalWorkingDays}
                </p>
                <p className="text-xs text-gray-600">Working Days</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.totalKms.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-600">Total KMs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.totalHours.toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">Total Hours</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              Once approved, the tripsheet will be locked and billing can be generated.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={approveMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {approveMutation.isPending ? 'Approving...' : 'Approve Tripsheet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
