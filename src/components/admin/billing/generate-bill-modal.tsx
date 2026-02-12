'use client';

import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { PendingTripSheet, BillingService } from '@/services/billing.service';
import { useGenerateBill } from '@/hooks/useBilling';
import { Loader2 } from 'lucide-react';
import { useAdminTripsheet } from '@/hooks/useAdminTripsheets';
import { formatIndianCurrency } from '@/lib/utils/billing';
import type { IBillingCalculation } from '@/backend/types';

interface GenerateBillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripSheet: PendingTripSheet | null;
}

export function GenerateBillModal({
  open,
  onOpenChange,
  tripSheet,
}: GenerateBillModalProps) {
  const [notes, setNotes] = useState('');
  const [billingCalculation, setBillingCalculation] = useState<IBillingCalculation | null>(null);

  const generateBillMutation = useGenerateBill();
  
  // Fetch tripsheet with billing calculation when modal opens
  const { data: tripsheetData, isLoading: isLoadingBilling } = useAdminTripsheet(
    tripSheet?._id
  );

  useEffect(() => {
    if (tripsheetData?.success && tripsheetData.data?.billing) {
      setBillingCalculation(tripsheetData.data.billing);
    }
  }, [tripsheetData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tripSheet) return;

    // The API calculates billing automatically from the tripsheet
    // Just pass tripsheetId - the server will calculate all billing amounts
    await generateBillMutation.mutateAsync({
      tripSheetId: tripSheet._id,
    });

    // Reset form and close
    setNotes('');
    setBillingCalculation(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes('');
    setBillingCalculation(null);
    onOpenChange(false);
  };

  if (!tripSheet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Bill</DialogTitle>
          <DialogDescription>
            Create a bill for {tripSheet.vehicleId.registrationNumber} -{' '}
            {BillingService.formatMonthYear(tripSheet.month, tripSheet.year)}
          </DialogDescription>
        </DialogHeader>

        {isLoadingBilling ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading billing calculation...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trip Sheet Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">
                  {tripSheet.vehicleId.registrationNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tripSheet.vehicleId.vehicleModel}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{tripSheet.driverId.name}</p>
                <p className="text-sm text-muted-foreground">
                  {tripSheet.driverId.employeeId}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="font-medium">
                  {BillingService.formatMonthYear(tripSheet.month, tripSheet.year)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="font-medium">{(tripSheet.totalDistance ?? 0).toFixed(2)} km</p>
              </div>
            </div>

            {/* Billing Calculation Breakdown */}
            {billingCalculation && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Billing Calculation</h3>
                
                {/* Monthly Rental */}
                <div className="flex justify-between items-center text-sm">
                  <span>
                    Monthly Rental ({billingCalculation.baseDays} Days Per Month)
                  </span>
                  <span className="font-mono">{formatIndianCurrency(billingCalculation.baseAmount)}</span>
                </div>

                {/* Extra Days */}
                {billingCalculation.extraDays > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>
                      Extra Days: {billingCalculation.extraDays} days × ₹{billingCalculation.extraDayRate.toLocaleString('en-IN')}
                    </span>
                    <span className="font-mono">
                      {formatIndianCurrency(billingCalculation.extraDaysAmount)}
                    </span>
                  </div>
                )}

                {/* KMs Breakdown */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>Total KMs: {billingCalculation.totalKms.toLocaleString('en-IN')} km</span>
                    <span>Base KMs: {billingCalculation.baseKms.toLocaleString('en-IN')} km (Working Days × 100)</span>
                  </div>
                  {billingCalculation.extraKms > 0 ? (
                    <div className="flex justify-between items-center text-sm">
                      <span>
                        Extra KMs: {billingCalculation.extraKms.toLocaleString('en-IN')} km × ₹{billingCalculation.extraKmRate.toLocaleString('en-IN')}
                      </span>
                      <span className="font-mono">
                        {formatIndianCurrency(billingCalculation.extraKmsAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-xs text-gray-500 italic">
                      <span>
                        Extra KMs: 0 km 
                        {billingCalculation.totalKms < billingCalculation.baseKms && (
                          <span className="ml-1">(Within base allowance)</span>
                        )}
                      </span>
                      <span>₹0.00</span>
                    </div>
                  )}
                </div>

                {/* Extra Hours */}
                {billingCalculation.totalExtraHours > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span>
                      Extra Hours: {billingCalculation.totalExtraHours.toFixed(1)} hrs × ₹{billingCalculation.extraHourRate}
                    </span>
                    <span className="font-mono">
                      {formatIndianCurrency(billingCalculation.extraHoursAmount)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                {/* Subtotal */}
                <div className="flex justify-between items-center font-semibold">
                  <span>Subtotal</span>
                  <span className="font-mono text-lg">
                    {formatIndianCurrency(billingCalculation.totalAmount)}
                  </span>
                </div>
              </div>
            )}

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this bill"
                rows={3}
              />
            </div>

            {/* Final Amount */}
            <div className="flex justify-between items-center p-4 bg-[#B22234]/10 rounded-lg border border-[#B22234]/20">
              <span className="text-lg font-semibold">Total Bill Amount</span>
              <span className="text-2xl font-bold text-[#B22234]">
                {formatIndianCurrency(billingCalculation?.totalAmount || 0)}
              </span>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={generateBillMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={generateBillMutation.isPending}
                className="bg-[#B22234] hover:bg-[#8B1A2A]"
              >
                {generateBillMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Bill
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
