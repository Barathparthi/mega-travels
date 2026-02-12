'use client';

import { PendingBillingTable } from '@/components/admin/billing/pending-billing-table';
import { VehicleProfitTable } from '@/components/admin/billing/vehicle-profit-table';
import { Separator } from '@/components/ui/separator';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Revenue</h1>
        <p className="text-muted-foreground mt-2">
          View monthly revenue and export tripsheets to Excel
        </p>
      </div>

      <Separator />

      {/* Vehicle Profitability Section - Shows monthly revenue per vehicle */}
      <VehicleProfitTable />

      <Separator />

      {/* Approved Tripsheets Section - Export to Excel */}
      <PendingBillingTable />
    </div>
  );
}
