'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Home,
  ArrowLeft,
} from 'lucide-react';
import {
  formatKilometers,
  formatHours,
  formatFuel,
  formatDateShort,
  getDayName,
  isSunday,
  formatIndianNumber,
} from '@/lib/utils/calculations';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TripsheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tripsheet, setTripsheet] = useState<any>(null);
  
  // Get month/year from URL params if available, otherwise use current month/year
  const monthParam = searchParams?.get('month');
  const yearParam = searchParams?.get('year');
  const [currentMonth, setCurrentMonth] = useState(() =>
    monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
  );
  const [currentYear, setCurrentYear] = useState(() =>
    yearParam ? parseInt(yearParam) : new Date().getFullYear()
  );

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

  const fetchTripsheet = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/driver/tripsheet?month=${currentMonth}&year=${currentYear}`,
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } } // Prevent caching to always get fresh data
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

  useEffect(() => {
    fetchTripsheet();
  }, [currentMonth, currentYear]);

  // Refresh tripsheet when page becomes visible (e.g., returning from add-entry)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTripsheet();
      }
    };

    const handleFocus = () => {
      fetchTripsheet();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentMonth, currentYear]);

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      // Don't allow going before January 2026
      if (currentYear > 2026) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      }
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Allow navigation to any month from 2026 onwards
    if (nextYear >= 2026) {
      setCurrentMonth(nextMonth);
      setCurrentYear(nextYear);
    }
  };

  const canGoNext = () => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Allow navigation to any month from 2026 onwards
    return nextYear >= 2026;
  };

  const canGoPrevious = () => {
    if (currentMonth === 1) {
      return currentYear > 2026;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (tripsheet?.summary?.totalPendingDays > 0) {
      alert('Please complete or mark all pending entries before submitting.');
      return;
    }

    router.push(
      `/driver/tripsheet/submit?month=${currentMonth}&year=${currentYear}`
    );
  };

  if (loading) {
    return <TripsheetSkeleton />;
  }

  const statusColors = {
    draft: 'bg-amber-100 text-amber-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 active:scale-95">
          <Link href="/driver/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-base sm:text-lg font-bold text-gray-900">Trip Sheet</h1>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousMonth}
              disabled={!canGoPrevious()}
              className="h-12 w-12 active:scale-95 disabled:opacity-50"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="text-center flex-1 px-2">
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {monthNames[currentMonth - 1]} {currentYear}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={!canGoNext()}
              className="h-12 w-12 active:scale-95 disabled:opacity-50"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Info */}
      {tripsheet?.vehicleId && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-xs text-gray-500 font-medium">Vehicle Number</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{tripsheet.vehicleId.vehicleNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Route</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{tripsheet.vehicleId.routeName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Passengers</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{tripsheet.vehicleId.driverPassengers || 'None'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status and Actions */}
      {tripsheet && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-gray-600">Status:</span>
              <span
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full font-medium',
                  statusColors[(tripsheet.status || 'draft') as keyof typeof statusColors]
                )}
              >
                {tripsheet.status ? (
                  <>
                    {tripsheet.status.charAt(0).toUpperCase() + tripsheet.status.slice(1)}{' '}
                    {tripsheet.status === 'draft' && '🟡'}
                    {tripsheet.status === 'submitted' && '🔵'}
                    {tripsheet.status === 'approved' && '✅'}
                  </>
                ) : (
                  'Draft 🟡'
                )}
              </span>
            </div>

            {tripsheet.summary?.totalPendingDays > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-amber-900">
                    Pending entries: {tripsheet.summary.totalPendingDays} days
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Complete all entries before submitting
                  </p>
                </div>
              </div>
            )}

            {tripsheet.status === 'draft' && (
              <Button
                onClick={handleSubmit}
                disabled={tripsheet.summary?.totalPendingDays > 0}
                className="w-full h-12 bg-brand-red hover:bg-brand-red/90 text-base font-semibold active:scale-95"
              >
                Submit Tripsheet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {tripsheet && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Working Days</p>
                <p className="text-lg sm:text-xl font-bold text-brand-red mt-1">
                  {tripsheet.summary?.totalWorkingDays || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Off Days</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600 mt-1">
                  {tripsheet.summary?.totalOffDays || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Total KM</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                  {formatIndianNumber(tripsheet.summary?.totalKms || 0)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Total Hours</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
                  {(tripsheet.summary?.totalHours || 0).toFixed(1)}
                </p>
              </div>
            </div>

            {(tripsheet.summary?.totalExtraHours || 0) > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600">Extra Hours (above 10)</p>
                <p className="text-lg font-bold text-blue-900">
                  {tripsheet.summary.totalExtraHours.toFixed(1)} hrs
                </p>
              </div>
            )}

            {(tripsheet.summary?.totalFuelLitres || 0) > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Fuel</p>
                <p className="font-medium text-gray-900">
                  {formatFuel(tripsheet.summary.totalFuelLitres)} • ₹
                  {formatIndianNumber(tripsheet.summary.totalFuelAmount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      {tripsheet && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 -mx-1 px-1">
            {tripsheet.entries.map((entry: any, index: number) => {
              const entryDate = new Date(entry.date);
              const isWorking = entry.status === 'working';
              const isOff = entry.status === 'off';
              const isPending = entry.status === 'pending';
              // Format date using local time to avoid timezone shift issues
              const year = entryDate.getFullYear();
              const month = String(entryDate.getMonth() + 1).padStart(2, '0');
              const day = String(entryDate.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;

              return (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-lg border active:bg-gray-50 transition-colors',
                    isOff && 'bg-gray-50 border-gray-200',
                    isPending && 'bg-amber-50 border-amber-200',
                    isWorking && 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Serial Number */}
                      {isWorking && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-red">
                            {entry.serialNumber || ''}
                          </span>
                        </div>
                      )}

                      {/* Date and Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDateShort(entryDate)}
                          </p>
                          <span className="text-xs text-gray-500">
                            {getDayName(entryDate)}
                            {isSunday(entryDate) && isWorking && ' ☀️'}
                          </span>
                        </div>

                        {isWorking && (
                          <div className="text-xs sm:text-sm space-y-1">
                            <p className="text-gray-700 leading-relaxed">
                              <span className="font-medium">{entry.startingKm?.toLocaleString()}</span> →{' '}
                              <span className="font-medium">{entry.closingKm?.toLocaleString()}</span> •{' '}
                              <span className="font-semibold text-brand-red">
                                {formatKilometers(entry.totalKm || 0)}
                              </span>
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {entry.startingTime} → {entry.closingTime} •{' '}
                              <span className="font-semibold">
                                {formatHours(entry.totalHours || 0)}
                              </span>
                              {entry.extraHours > 0 && (
                                <span className="text-brand-red ml-1 font-medium">
                                  (+{entry.extraHours.toFixed(1)})
                                </span>
                              )}
                            </p>
                            {entry.fuelLitres > 0 && (
                              <p className="text-gray-600">
                                ⛽ {formatFuel(entry.fuelLitres)}
                              </p>
                            )}
                          </div>
                        )}

                        {isOff && (
                          <p className="text-xs sm:text-sm font-medium text-blue-600">
                            🏠 OFF
                          </p>
                        )}

                        {isPending && (
                          <p className="text-xs sm:text-sm font-medium text-amber-600 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            No entry yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    {tripsheet.status === 'draft' && (
                      <Link href={`/driver/add-entry?date=${dateStr}`} className="flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 active:scale-95"
                        >
                          {isPending ? (
                            <PlusCircle className="h-5 w-5" />
                          ) : (
                            <Edit className="h-5 w-5" />
                          )}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Total Row */}
            <div className="pt-3 mt-3 border-t-2 border-gray-300">
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span>TOTAL</span>
                <div className="text-sm text-right">
                  <div>{tripsheet.summary?.totalWorkingDays || 0} days</div>
                  <div>{formatKilometers(tripsheet.summary?.totalKms || 0)}</div>
                  <div>{formatHours(tripsheet.summary?.totalHours || 0)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TripsheetSkeleton() {
  return (
    <div className="space-y-4 pb-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
