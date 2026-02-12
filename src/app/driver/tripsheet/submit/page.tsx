'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatIndianNumber } from '@/lib/utils/calculations';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SubmitTripsheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const month = searchParams?.get('month');
  const year = searchParams?.get('year');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tripsheet, setTripsheet] = useState<any>(null);
  const [confirmed, setConfirmed] = useState(false);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  useEffect(() => {
    if (month && year) {
      fetchTripsheet();
    }
  }, [month, year]);

  const fetchTripsheet = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/driver/tripsheet?month=${month}&year=${year}`
      );
      if (response.ok) {
        const result = await response.json();
        setTripsheet(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch tripsheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirmed) {
      toast({
        title: 'Confirmation Required',
        description: 'Please confirm that all information is correct',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/driver/tripsheet/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: Number(month),
          year: Number(year),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tripsheet submitted successfully',
        });
        router.push('/driver/tripsheet');
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit tripsheet',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit tripsheet',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-brand-red" />
      </div>
    );
  }

  if (!tripsheet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tripsheet not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/driver/tripsheet">Go Back</Link>
        </Button>
      </div>
    );
  }

  const hasPendingEntries = tripsheet.summary.totalPendingDays > 0;

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/driver/tripsheet">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Submit Tripsheet</h1>
      </div>

      {/* Month Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {monthNames[Number(month) - 1]} {year}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Review your tripsheet before submitting
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending Entries Warning */}
      {hasPendingEntries && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  Cannot Submit - Pending Entries
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  You have {tripsheet.summary.totalPendingDays} pending{' '}
                  {tripsheet.summary.totalPendingDays === 1 ? 'entry' : 'entries'}.
                  All entries must be completed or marked as off before submission.
                </p>
                <Button asChild size="sm" variant="destructive">
                  <Link href="/driver/tripsheet">Go Back and Complete</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tripsheet Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Working Days:</span>
              <span className="font-semibold">
                {tripsheet.summary.totalWorkingDays}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Off Days:</span>
              <span className="font-semibold">
                {tripsheet.summary.totalOffDays}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Total KM:</span>
              <span className="font-semibold">
                {formatIndianNumber(tripsheet.summary.totalKms)}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-600">Total Hours:</span>
              <span className="font-semibold">
                {tripsheet.summary.totalHours.toFixed(1)}
              </span>
            </div>
          </div>

          {tripsheet.summary.totalExtraHours > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  Extra Hours (above 10):
                </span>
                <span className="font-bold text-blue-900">
                  {tripsheet.summary.totalExtraHours.toFixed(1)} hrs
                </span>
              </div>
            </div>
          )}

          {tripsheet.summary.totalFuelLitres > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Fuel:</span>
                <span className="font-semibold">
                  {tripsheet.summary.totalFuelLitres.toFixed(1)} L • ₹
                  {formatIndianNumber(tripsheet.summary.totalFuelAmount)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      {!hasPendingEntries && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Important</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  All entries have been completed - {tripsheet.summary.totalWorkingDays} working days and{' '}
                  {tripsheet.summary.totalOffDays} off days
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  Once submitted, you cannot edit the entries unless the admin
                  rejects the tripsheet
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>
                  Admin will review and approve your tripsheet for billing
                </span>
              </li>
            </ul>

            {/* Confirmation Checkbox */}
            <div className="pt-4 border-t">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={confirmed}
                  onCheckedChange={(checked) =>
                    setConfirmed(checked as boolean)
                  }
                  disabled={hasPendingEntries}
                  className="mt-1"
                />
                <span className="text-sm text-gray-900 flex-1">
                  I confirm that all the information provided is accurate and complete. I understand that I cannot edit the entries after submission.
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      {!hasPendingEntries && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" asChild size="lg" disabled={submitting}>
            <Link href="/driver/tripsheet">Cancel</Link>
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!confirmed || submitting}
            className="bg-brand-red hover:bg-brand-red/90"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Tripsheet'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
