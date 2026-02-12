"use client";

import { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, Car, Folder } from 'lucide-react';
import { TripsheetFilters } from '@/components/admin/tripsheets/tripsheet-filters';
import { TripsheetStats } from '@/components/admin/tripsheets/tripsheet-stats';
import { TripsheetsTable } from '@/components/admin/tripsheets/tripsheets-table';
import { useAdminTripsheets } from '@/hooks/useAdminTripsheets';
import type { ITripsheetFilters } from '@/backend/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function TripsheetsPage() {
  const now = new Date();
  const [filters, setFilters] = useState<ITripsheetFilters>({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    status: 'all',
    page: 1,
    limit: 10,
  });
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Fetch data only when a vehicle is selected (handled via hook's enabled flag)
  const { data, isLoading, error } = useAdminTripsheets(filters);

  // Fetch all vehicles once to build the "folders" view
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/admin/vehicles');
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
            setVehicles(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicles for tripsheet folders:', error);
      }
    };

    fetchVehicles();
  }, []);

  const handleVehicleSelect = (vehicleId: string) => {
    setFilters((prev) => ({
      ...prev,
      vehicleId,
      page: 1,
    }));
  };

  const handleMonthSelect = (month: number) => {
    setFilters((prev) => ({
      ...prev,
      month,
      page: 1,
    }));
  };

  const handleFiltersChange = (newFilters: ITripsheetFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-brand-red" />
          Trip Sheets
        </h1>
        <p className="text-gray-600 mt-2">View and manage driver tripsheets by vehicle</p>
      </div>

      {/* Vehicle "folders" */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-brand-red" />
              <h2 className="text-sm font-semibold text-gray-800">Vehicles</h2>
            </div>
            <p className="text-xs text-gray-500">
              Click a vehicle, then choose a month to open its tripsheets.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {vehicles.map((vehicle) => {
              const isActive = filters.vehicleId === vehicle._id;
              return (
                <button
                  key={vehicle._id}
                  type="button"
                  onClick={() => handleVehicleSelect(vehicle._id)}
                  className={cn(
                    'text-left rounded-lg border px-3 py-2 transition-colors hover:border-brand-red hover:bg-red-50/50',
                    isActive && 'border-brand-red bg-red-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Car className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {vehicle.vehicleNumber}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {vehicle.routeName || 'No route'}{' '}
                        {vehicle.vehicleTypeId?.name
                          ? `• ${vehicle.vehicleTypeId.name}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {vehicles.length === 0 && (
              <p className="text-xs text-gray-500 col-span-full">
                No vehicles found. Add vehicles first to manage tripsheets.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <TripsheetFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Month "folders" for the selected vehicle */}
      {filters.vehicleId && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700">Months</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                const date = new Date(filters.year!, month - 1, 1);
                const label = date.toLocaleString('default', { month: 'short' });
                const isActive = filters.month === month;

                return (
                  <Button
                    key={month}
                    type="button"
                    size="sm"
                    variant={isActive ? 'default' : 'outline'}
                    className={cn(
                      'h-8 px-3 text-xs',
                      isActive && 'bg-brand-red text-white hover:bg-brand-red/90'
                    )}
                    onClick={() => handleMonthSelect(month)}
                  >
                    {label} {filters.year}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Vehicle Selected State */}
      {!filters.vehicleId && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
              <Car className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a Vehicle to View Trip Sheets
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Please select a vehicle from the filter above to view its trip sheet entries for the selected month.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show data only when vehicle is selected */}
      {filters.vehicleId && (
        <>
          {/* Stats Cards */}
          {data?.stats && <TripsheetStats stats={data.stats} />}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tripsheets...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">Failed to load tripsheets. Please try again.</p>
            </div>
          )}

          {/* Tripsheets Table */}
          {!isLoading && !error && data?.data && (
            <>
              <TripsheetsTable tripsheets={data.data} />

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      onClick={() => handlePageChange(filters.page! - 1)}
                      disabled={filters.page === 1}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => handlePageChange(filters.page! + 1)}
                      disabled={filters.page === data.pagination.totalPages}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(filters.page! - 1) * filters.limit! + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(filters.page! * filters.limit!, data.pagination.total)}
                        </span>{' '}
                        of <span className="font-medium">{data.pagination.total}</span> results
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handlePageChange(filters.page! - 1)}
                        disabled={filters.page === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                          .filter(
                            (p) =>
                              p === 1 ||
                              p === data.pagination.totalPages ||
                              Math.abs(p - filters.page!) <= 1
                          )
                          .map((page, idx, arr) => (
                            <>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span key={`ellipsis-${page}`} className="px-2 text-gray-500">
                                  ...
                                </span>
                              )}
                              <Button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                variant={page === filters.page ? 'default' : 'outline'}
                                size="sm"
                                className="w-10"
                              >
                                {page}
                              </Button>
                            </>
                          ))}
                      </div>
                      <Button
                        onClick={() => handlePageChange(filters.page! + 1)}
                        disabled={filters.page === data.pagination.totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
