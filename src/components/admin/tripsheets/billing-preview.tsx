"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { IBillingCalculation } from '@/backend/types';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/utils/billing';

interface BillingPreviewProps {
  billing: IBillingCalculation;
  vehicleTypeName: string;
}

export function BillingPreview({ billing, vehicleTypeName }: BillingPreviewProps) {
  return (
    <Card className="border-2 border-brand-red/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span>
          <span>Billing Preview ({vehicleTypeName})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Monthly Rental */}
        <div className="flex justify-between items-center">
          <span className="text-sm">
            Monthly Rental ({billing.baseDays} Days Per Month)
          </span>
          <span className="font-mono text-sm">{formatIndianCurrency(billing.baseAmount)}</span>
        </div>

        {/* Extra Days */}
        {billing.extraDays > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Extra Days: {billing.extraDays} days × ₹{billing.extraDayRate.toLocaleString('en-IN')}
            </span>
            <span className="font-mono text-sm">
              {formatIndianCurrency(billing.extraDaysAmount)}
            </span>
          </div>
        )}

        {/* KMs Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>Total KMs: {billing.totalKms.toLocaleString('en-IN')} km</span>
            <span>Base KMs: {billing.baseKms.toLocaleString('en-IN')} km (Working Days × 100)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Extra KMs: {billing.extraKms.toLocaleString('en-IN')} km 
              {billing.extraKms > 0 && (
                <span> × ₹{billing.extraKmRate.toLocaleString('en-IN')}</span>
              )}
              {billing.extraKms === 0 && billing.totalKms < billing.baseKms && (
                <span className="text-xs text-gray-500 italic ml-1">(Within base allowance @ ₹{billing.extraKmRate.toLocaleString('en-IN')}/km)</span>
              )}
            </span>
            <span className="font-mono text-sm">
              {formatIndianCurrency(billing.extraKmsAmount)}
            </span>
          </div>
        </div>

        {/* Extra Hours */}
        {billing.totalExtraHours > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Extra Hours: {billing.totalExtraHours.toFixed(1)} hrs × ₹{billing.extraHourRate}
            </span>
            <span className="font-mono text-sm">
              {formatIndianCurrency(billing.extraHoursAmount)}
            </span>
          </div>
        )}

        <Separator className="my-3" />

        {/* Sub Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-lg">SUB TOTAL</span>
          <span className="font-bold text-xl font-mono text-brand-red">
            {formatIndianCurrency(billing.totalAmount)}
          </span>
        </div>

        {/* Amount in Words */}
        <div className="bg-gray-50 p-3 rounded-lg mt-3">
          <p className="text-xs text-gray-600 mb-1">Amount in Words:</p>
          <p className="text-sm font-medium italic">
            Rupees {billing.amountInWords} Only
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
