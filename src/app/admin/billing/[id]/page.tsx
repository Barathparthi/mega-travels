'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BillingBreakdown } from '@/components/admin/billing/billing-breakdown';
import { useBill, useUpdateBillStatus, useDeleteBill } from '@/hooks/useBilling';
import { BillingService } from '@/services/billing.service';
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle2,
  Trash2,
  Loader2,
  Calendar,
  User,
  Car,
  FileText,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const billId = params.id as string;

  const { data: bill, isLoading, error } = useBill(billId);
  const updateStatusMutation = useUpdateBillStatus();
  const deleteBillMutation = useDeleteBill();
  const billingService = BillingService;

  const handleStatusChange = async (status: 'sent' | 'paid') => {
    await updateStatusMutation.mutateAsync({ id: billId, status });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      await deleteBillMutation.mutateAsync(billId);
      router.push('/admin/billing');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      generated: {
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      },
      sent: {
        variant: 'default',
        className: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
      },
      paid: {
        variant: 'default',
        className: 'bg-green-100 text-green-800 hover:bg-green-100',
      },
    };

    const config = variants[status] || variants.generated;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading bill details...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive">Failed to load bill details</p>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/billing">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bill Details</h1>
              <p className="text-muted-foreground mt-1">
                {(bill as any).tripsheetId?.tripsheetNumber || 'N/A'} -{' '}
                {billingService.formatMonthYear(bill.month, bill.year)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bill.status === 'generated' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('sent')}
                disabled={updateStatusMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {bill.status === 'sent' && (
              <Button
                variant="outline"
                onClick={() => handleStatusChange('paid')}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/admin/billing/${bill._id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Bill
              </Link>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBillMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Separator />

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge(bill.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trip Sheet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Trip Sheet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Trip Sheet Number
                  </p>
                  <p className="font-medium mt-1">
                    {(bill as any).tripsheetId?.tripsheetNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Period
                  </p>
                  <p className="font-medium mt-1">
                    {billingService.formatMonthYear(bill.month, bill.year)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle
                  </p>
                  <p className="font-medium mt-1">
                    {(bill as any).vehicleId?.vehicleNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(bill as any).vehicleId?.description || (bill as any).vehicleId?.routeName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Driver
                  </p>
                  <p className="font-medium mt-1">
                    {(bill as any).driverId?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(bill as any).driverId?.email || (bill as any).driverId?.phone || ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Bill Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Generated</p>
                <p className="font-medium">
                  {(bill as any).createdAt ? format(new Date((bill as any).createdAt), 'dd MMM yyyy, HH:mm') : 'N/A'}
                </p>
                {(bill as any).generatedBy?.name && (
                  <p className="text-sm text-muted-foreground">
                    by {(bill as any).generatedBy.name}
                  </p>
                )}
              </div>

              {(bill as any).sentAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="font-medium">
                      {format(new Date((bill as any).sentAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </>
              )}

              {(bill as any).paidAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="font-medium">
                      {format(new Date((bill as any).paidAt), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing Breakdown */}
        <BillingBreakdown bill={bill} />

        {/* Notes */}
        {bill.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {bill.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
