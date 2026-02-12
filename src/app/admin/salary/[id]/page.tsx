'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDriverSalary, useMarkSalaryPaid, useUpdateSalary } from '@/hooks/useDriverSalary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SalaryBreakdown from '@/components/admin/salary/salary-breakdown';
import DailyBreakdownTable from '@/components/admin/salary/daily-breakdown-table';
import MarkPaidModal from '@/components/admin/salary/mark-paid-modal';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  User,
  Car,
  FileText,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { format } from 'date-fns';

export default function SalaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const salaryId = params.id as string;

  const { data: salary, isLoading } = useDriverSalary(salaryId);
  const markPaidMutation = useMarkSalaryPaid();
  const updateSalaryMutation = useUpdateSalary();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);

  const handleEditNotes = () => {
    setNotes(salary?.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    if (!salary) return;

    await updateSalaryMutation.mutateAsync({
      id: salary._id,
      data: { notes },
    });

    setIsEditingNotes(false);
  };

  const handleCancelEdit = () => {
    setNotes('');
    setIsEditingNotes(false);
  };

  const handleMarkPaid = () => {
    setMarkPaidModalOpen(true);
  };

  const handleConfirmMarkPaid = async (paymentNotes?: string) => {
    if (!salary) return;

    await markPaidMutation.mutateAsync({
      id: salary._id,
      data: { notes: paymentNotes },
    });

    setMarkPaidModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      paid: {
        className: 'bg-green-100 text-green-800 border-green-300',
        label: 'Paid',
      },
      generated: {
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'Generated',
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        label: 'Pending',
      },
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <Badge variant="outline" className={`${statusConfig.className} border-2 text-base px-3 py-1`}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-600">Salary record not found</p>
            <Button asChild className="mt-4">
              <Link href="/admin/salary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Salaries
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/admin/salary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Salaries
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Salary Details
            </h1>
            <p className="text-gray-600 font-mono text-lg">{salary.salaryId}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(salary.status)}
            {salary.status !== 'paid' && (
              <Button
                onClick={handleMarkPaid}
                disabled={markPaidMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Salary Breakdown */}
          <SalaryBreakdown salary={salary} />

          {/* Daily Breakdown */}
          {salary.tripsheetId.entries && (
            <DailyBreakdownTable entries={salary.tripsheetId.entries} />
          )}
        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          {/* Driver & Vehicle Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-[#6B4C9A] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-semibold text-gray-900">
                    {salary.driverId.name}
                  </p>
                  <p className="text-sm text-gray-500">{salary.driverId.email}</p>
                  {salary.driverId.licenseNumber && (
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      License: {salary.driverId.licenseNumber}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 text-[#B22234] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-semibold text-gray-900">
                    {salary.vehicleId.vehicleNumber}
                  </p>
                  {salary.vehicleId.routeName && (
                    <p className="text-sm text-gray-500">
                      {salary.vehicleId.routeName}
                    </p>
                  )}
                  {salary.vehicleId.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {salary.vehicleId.description}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-[#6B4C9A] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="font-semibold text-gray-900">
                    {format(
                      new Date(salary.year, salary.month - 1),
                      'MMMM yyyy'
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Generated on{' '}
                    {format(new Date(salary.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Tripsheet</p>
                  <Link
                    href={`/admin/tripsheets/${salary.tripsheetId._id}`}
                    className="font-semibold text-[#6B4C9A] hover:underline"
                  >
                    {salary.tripsheetId.tripsheetNumber}
                  </Link>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {salary.tripsheetId.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {salary.status === 'paid' && salary.paidAt && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-green-700">Paid On</p>
                  <p className="font-semibold text-green-900">
                    {format(new Date(salary.paidAt), 'dd MMMM yyyy, hh:mm a')}
                  </p>
                </div>
                {salary.paidBy && (
                  <div>
                    <p className="text-sm text-green-700">Paid By</p>
                    <p className="font-semibold text-green-900">
                      {salary.paidBy.name}
                    </p>
                    <p className="text-xs text-green-600">{salary.paidBy.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Notes</CardTitle>
                {!isEditingNotes && salary.status !== 'paid' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditNotes}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={updateSalaryMutation.isPending}
                      className="bg-[#6B4C9A] hover:bg-[#5a3d82]"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {salary.notes || 'No notes added'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mark Paid Modal */}
      <MarkPaidModal
        open={markPaidModalOpen}
        onOpenChange={setMarkPaidModalOpen}
        onConfirm={handleConfirmMarkPaid}
        isLoading={markPaidMutation.isPending}
        salary={salary}
      />
    </div>
  );
}
