'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { formatIndianCurrency, formatMonthYear } from '@/lib/utils/salary-calculator';

interface GenerateSalaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes?: string) => void;
  isLoading?: boolean;
  tripsheetData?: {
    tripsheetNumber: string;
    driverName: string;
    vehicleNumber: string;
    month: number;
    year: number;
    totalWorkingDays: number;
    totalDriverExtraHours: number;
    estimatedSalary: number;
  };
}

export default function GenerateSalaryModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  tripsheetData,
}: GenerateSalaryModalProps) {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(notes || undefined);
    setNotes('');
  };

  const handleCancel = () => {
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#6B4C9A]">
            Generate Driver Salary
          </DialogTitle>
          <DialogDescription>
            Confirm salary generation for this tripsheet
          </DialogDescription>
        </DialogHeader>

        {tripsheetData && (
          <div className="space-y-4 py-4">
            {/* Tripsheet Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Tripsheet:</p>
                  <p className="font-semibold text-gray-900">
                    {tripsheetData.tripsheetNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Period:</p>
                  <p className="font-semibold text-gray-900">
                    {formatMonthYear(tripsheetData.month, tripsheetData.year)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Driver:</p>
                  <p className="font-semibold text-gray-900">
                    {tripsheetData.driverName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Vehicle:</p>
                  <p className="font-semibold text-gray-900">
                    {tripsheetData.vehicleNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Salary Calculation Preview */}
            <div className="bg-gradient-to-r from-[#6B4C9A]/10 to-[#B22234]/10 p-4 rounded-lg border border-[#6B4C9A]/20">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Salary Summary
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Working Days:</span>
                  <span className="font-semibold">
                    {tripsheetData.totalWorkingDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Extra Hours:</span>
                  <span className="font-semibold">
                    {tripsheetData.totalDriverExtraHours.toFixed(1)} hours
                  </span>
                </div>
                <div className="h-px bg-gray-300 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">
                    Total Salary:
                  </span>
                  <span className="text-xl font-bold text-[#6B4C9A]">
                    {formatIndianCurrency(tripsheetData.estimatedSalary)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> This will generate a salary record for the
                driver. Make sure the tripsheet has been reviewed and approved.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-[#6B4C9A] hover:bg-[#5a3d82]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Salary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
