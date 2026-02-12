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
import { Loader2, CheckCircle2 } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { DriverSalary } from '@/services/driver-salary.service';

interface MarkPaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes?: string) => void;
  isLoading?: boolean;
  salary?: DriverSalary;
}

export default function MarkPaidModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  salary,
}: MarkPaidModalProps) {
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
          <DialogTitle className="text-xl font-bold text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            Mark Salary as Paid
          </DialogTitle>
          <DialogDescription>
            Confirm that this salary has been paid to the driver
          </DialogDescription>
        </DialogHeader>

        {salary && (
          <div className="space-y-4 py-4">
            {/* Salary Info */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Salary ID:</p>
                  <p className="font-semibold text-gray-900 font-mono">
                    {salary.salaryId}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Driver:</p>
                  <p className="font-semibold text-gray-900">
                    {salary.driverId.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Vehicle:</p>
                  <p className="font-semibold text-gray-900">
                    {salary.vehicleId.vehicleNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Period:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(salary.year, salary.month - 1).toLocaleDateString(
                      'en-IN',
                      { month: 'long', year: 'numeric' }
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
              <div className="text-center">
                <p className="text-sm text-green-700 font-medium mb-2">
                  Payment Amount
                </p>
                <p className="text-4xl font-bold text-green-900 font-mono">
                  {formatIndianCurrency(salary.calculation.totalSalary)}
                </p>
                <p className="text-xs text-green-700 mt-3">
                  {salary.calculation.amountInWords}
                </p>
              </div>
            </div>

            {/* Breakdown Summary */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Salary Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Salary:</span>
                  <span className="font-mono">
                    {formatIndianCurrency(salary.calculation.baseSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Extra Days ({salary.calculation.extraDays} days):
                  </span>
                  <span className="font-mono">
                    {formatIndianCurrency(salary.calculation.extraDaysAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Extra Hours ({salary.calculation.totalDriverExtraHours.toFixed(
                      1
                    )}{' '}
                    hrs):
                  </span>
                  <span className="font-mono">
                    {formatIndianCurrency(salary.calculation.extraHoursAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Payment Notes (Optional)</Label>
              <Textarea
                id="payment-notes"
                placeholder="Add payment method, transaction ID, or other notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                These notes will be added to the salary record
              </p>
            </div>

            {/* Warning */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                <strong>Important:</strong> By confirming, you are marking this
                salary as PAID. This action will update the salary status and
                record the payment timestamp.
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
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
