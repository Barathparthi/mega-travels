'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Bill, BillingService } from '@/services/billing.service';
import { MinusCircle, PlusCircle } from 'lucide-react';

interface BillingBreakdownProps {
  bill: Bill;
}

export function BillingBreakdown({ bill }: BillingBreakdownProps) {
  // Use calculation instead of billing (API structure)
  const calculation = (bill as any).calculation || (bill as any).billing;

  if (!calculation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No billing calculation available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Rental */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Monthly Rental ({calculation.baseDays} Days)
          </span>
          <span className="font-medium">
            {BillingService.formatCurrency(calculation.baseAmount)}
          </span>
        </div>

        {/* Extra Days */}
        {calculation.extraDays > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Extra Days: {calculation.extraDays} × ₹{calculation.extraDayRate?.toLocaleString('en-IN') || calculation.extraDayRate}
            </span>
            <span className="font-medium">
              {BillingService.formatCurrency(calculation.extraDaysAmount)}
            </span>
          </div>
        )}

        {/* KMs */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total KMs: {calculation.totalKms?.toLocaleString('en-IN') || calculation.totalKm?.toLocaleString('en-IN') || '0'} km</span>
            <span>Base KMs: {calculation.baseKms?.toLocaleString('en-IN') || '0'} km</span>
          </div>
          {calculation.extraKms > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Extra KMs: {calculation.extraKms.toLocaleString('en-IN')} km × ₹{calculation.extraKmRate?.toLocaleString('en-IN') || calculation.extraKmRate}
              </span>
              <span className="font-medium">
                {BillingService.formatCurrency(calculation.extraKmsAmount)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-xs text-muted-foreground italic">
              <span>Extra KMs: 0 km (Within base allowance)</span>
              <span>₹0.00</span>
            </div>
          )}
        </div>

        {/* Extra Hours */}
        {calculation.totalExtraHours > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Extra Hours: {calculation.totalExtraHours.toFixed(1)} hrs × ₹{calculation.extraHourRate}
            </span>
            <span className="font-medium">
              {BillingService.formatCurrency(calculation.extraHoursAmount)}
            </span>
          </div>
        )}

        {/* Adjustments */}
        {calculation.adjustments && calculation.adjustments !== 0 && (
          <>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Adjustments</span>
              <span className={`font-medium ${calculation.adjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {calculation.adjustments >= 0 ? '+' : ''}{BillingService.formatCurrency(calculation.adjustments)}
              </span>
            </div>
          </>
        )}

        {/* Final Amount */}
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-[#B22234]">
            {BillingService.formatCurrency(calculation.totalAmount || calculation.finalAmount)}
          </span>
        </div>

        {/* Amount in Words */}
        {calculation.amountInWords && (
          <div className="bg-muted/50 p-3 rounded-md mt-4">
            <p className="text-xs text-muted-foreground mb-1">Amount in Words:</p>
            <p className="text-sm font-medium italic">
              Rupees {calculation.amountInWords} Only
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
