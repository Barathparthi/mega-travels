'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AdjustmentForm, Adjustment } from '@/components/admin/billing/adjustment-form';
import { useBill, useUpdateBill } from '@/hooks/useBilling';
import { BillingService } from '@/services/billing.service';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function EditBillPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  const { data: bill, isLoading, error } = useBill(billId);
  const updateBillMutation = useUpdateBill();
  const billingService = BillingService;

  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [notes, setNotes] = useState('');

  // Initialize form when bill data loads
  useEffect(() => {
    if (bill) {
      const calculation = (bill as any).calculation;
      // Note: The new billing system uses automatic calculation
      // Adjustments are stored as a number in calculation.adjustments
      // Convert to array format for the AdjustmentForm component
      if (calculation && calculation.adjustments) {
        // If adjustments is a number, we'll handle it in calculateAdjustments
        // For now, set empty array and use the number directly
        setAdjustments([]);
      }
      setNotes((bill as any).notes || '');
    }
  }, [bill]);

  const calculateSubtotal = () => {
    if (!bill) return 0;
    const calculation = (bill as any).calculation;
    return calculation?.subTotal || calculation?.subtotal || 0;
  };

  const calculateAdjustments = () => {
    // Calculate from adjustments array (for form input)
    const adjustmentsFromArray = adjustments.reduce((total, adj) => {
      return total + (adj.type === 'add' ? adj.amount : -adj.amount);
    }, 0);
    
    // Use existing adjustments from bill if available (number format)
    const existingAdjustments = (bill as any)?.calculation?.adjustments || 0;
    
    // Return the sum if user is modifying, otherwise use existing
    return adjustments.length > 0 ? adjustmentsFromArray : existingAdjustments;
  };

  const calculateFinalAmount = () => {
    const calculation = (bill as any)?.calculation;
    const baseTotal = calculation?.subTotal || calculateSubtotal();
    return baseTotal + calculateAdjustments();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate adjustments
    const invalidAdjustments = adjustments.filter(
      (adj) => !adj.reason.trim() || adj.amount <= 0
    );

    if (invalidAdjustments.length > 0) {
      return;
    }

    // Calculate adjustments as a number (sum of all adjustments)
    const adjustmentsNumber = adjustments.reduce((total, adj) => {
      return total + (adj.type === 'add' ? adj.amount : -adj.amount);
    }, 0);

    await updateBillMutation.mutateAsync({
      id: billId,
      data: {
        adjustments: adjustmentsNumber !== 0 ? adjustmentsNumber : undefined,
        notes: notes.trim() || undefined,
      },
    });

    router.push(`/admin/billing/${billId}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading bill...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive">Failed to load bill</p>
        <p className="text-sm text-muted-foreground mt-2">
          {error?.message || 'Bill not found'}
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/billing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </Button>
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/billing/${billId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Bill</h1>
            <p className="text-muted-foreground mt-1">
              {(bill as any).tripsheetId?.tripsheetNumber || 'N/A'} -{' '}
              {billingService.formatMonthYear(bill.month, bill.year)}
            </p>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Trip Sheet Info */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Sheet Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">
                    {(bill as any).vehicleId?.vehicleNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(bill as any).vehicleId?.description || (bill as any).vehicleId?.routeName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">{(bill as any).driverId?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {(bill as any).driverId?.email || (bill as any).driverId?.phone || ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-medium">
                    {billingService.formatMonthYear(bill.month, bill.year)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="font-medium">
                    {((bill as any).calculation?.totalKms || 0).toFixed(2)} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Calculation Display */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(bill as any).calculation && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rental ({((bill as any).calculation.baseDays || 0)} Days)</span>
                    <span className="font-medium">
                      {billingService.formatCurrency(((bill as any).calculation.baseAmount || 0))}
                    </span>
                  </div>
                  {((bill as any).calculation.extraDays || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Days: {((bill as any).calculation.extraDays || 0)}</span>
                      <span className="font-medium">
                        {billingService.formatCurrency(((bill as any).calculation.extraDaysAmount || 0))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Extra KMs</span>
                    <span className="font-medium">
                      {billingService.formatCurrency(((bill as any).calculation.extraKmsAmount || 0))}
                    </span>
                  </div>
                  {((bill as any).calculation.totalExtraHours || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Hours</span>
                      <span className="font-medium">
                        {billingService.formatCurrency(((bill as any).calculation.extraHoursAmount || 0))}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">Subtotal</span>
                    <span className="text-lg font-semibold">
                      {billingService.formatCurrency(calculateSubtotal())}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adjustments */}
          <Card>
            <CardHeader>
              <CardTitle>Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              <AdjustmentForm adjustments={adjustments} onChange={setAdjustments} />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this bill"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Final Amount Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {billingService.formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adjustments</span>
                  <span
                    className={`font-medium ${
                      calculateAdjustments() >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {calculateAdjustments() >= 0 ? '+' : ''}
                    {billingService.formatCurrency(calculateAdjustments())}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Final Amount</span>
                  <span className="text-2xl font-bold text-[#B22234]">
                    {billingService.formatCurrency(calculateFinalAmount())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/billing/${billId}`)}
              disabled={updateBillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateBillMutation.isPending}
              className="bg-[#B22234] hover:bg-[#8B1A2A]"
            >
              {updateBillMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
  );
}
