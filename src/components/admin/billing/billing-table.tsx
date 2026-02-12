'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bill, BillingFilters, BillingService } from '@/services/billing.service';
import { useBills, useUpdateBillStatus, useDeleteBill } from '@/hooks/useBilling';
import {
  Eye,
  Edit,
  MoreVertical,
  Send,
  CheckCircle2,
  Trash2,
  Loader2,
  Receipt,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { VehicleBreakdownCard } from './vehicle-breakdown';

export function BillingTable() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<BillingFilters>({
    year: currentYear,
  });

  const { data: billingData, isLoading, error } = useBills(filters);
  const bills = billingData?.bills || [];
  const stats = billingData?.stats;
  const updateStatusMutation = useUpdateBillStatus();
  const deleteBillMutation = useDeleteBill();

  const handleStatusChange = async (id: string, status: 'sent' | 'paid') => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      await deleteBillMutation.mutateAsync(id);
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

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading bills...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-sm text-destructive">Failed to load bills</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get selected month name
  const selectedMonth = filters.month 
    ? months.find(m => m.value === filters.month)?.label || `${filters.month}`
    : 'All Months';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Generated Bills
            </CardTitle>
            <CardDescription>Manage and track all generated bills</CardDescription>
            {/* Monthly Total Summary */}
            {stats && filters.month && filters.year && (
              <div className="mt-3 space-y-3">
                {/* Total Revenue from All Tripsheets */}
                {stats.totalTripsheetRevenue !== undefined && (
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Total Revenue - {selectedMonth} {filters.year}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {stats.totalTripsheets || 0} approved tripsheet{stats.totalTripsheets !== 1 ? 's' : ''} from all vehicles
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-700">
                          {BillingService.formatCurrency(stats.totalTripsheetRevenue)}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">Total Revenue</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Generated Bills Summary */}
                <div className="p-3 bg-[#B22234]/10 rounded-lg border border-[#B22234]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Generated Bills - {selectedMonth} {filters.year}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.total} bill{stats.total !== 1 ? 's' : ''} • {stats.generated} Generated • {stats.sent} Sent • {stats.paid} Paid
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#B22234]">
                        {BillingService.formatCurrency(stats.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">Total Bill Amount</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Month Filter */}
            <Select
              value={filters.month?.toString() || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  month: value === 'all' ? undefined : parseInt(value),
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Filter */}
            <Select
              value={filters.year?.toString() || currentYear.toString()}
              onValueChange={(value) =>
                setFilters({ ...filters, year: parseInt(value) })
              }
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  status: value === 'all' ? undefined : (value as any),
                })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      {/* Vehicle Breakdown Section - Between header and table */}
      {stats && stats.vehicleBreakdown && stats.vehicleBreakdown.length > 0 && filters.month && filters.year && (
        <div className="px-6 pt-4 pb-2">
          <VehicleBreakdownCard
            breakdown={stats.vehicleBreakdown}
            totalAmount={stats.totalTripsheetRevenue || 0}
            month={selectedMonth}
            year={filters.year}
          />
        </div>
      )}

      <CardContent>
        {!bills || bills.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No bills found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or generate a new bill
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip Sheet #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Distance</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill: any) => {
                    // Handle missing or unpopulated fields safely
                    const tripsheet = bill.tripsheetId || {};
                    const vehicle = bill.vehicleId || {};
                    const driver = bill.driverId || {};
                    
                    return (
                    <TableRow key={bill._id}>
                      <TableCell className="font-medium">
                        {tripsheet.tripsheetNumber || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {vehicle.vehicleNumber || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.description || vehicle.routeName || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {driver.name || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {driver.email || driver.phone || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {BillingService.formatMonthYear(bill.month, bill.year)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {bill.calculation?.totalKms?.toFixed(2) || '0.00'} km
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#B22234]">
                        {BillingService.formatCurrency(bill.calculation?.totalAmount || 0)}
                      </TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {bill.createdAt ? format(new Date(bill.createdAt), 'dd MMM yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/billing/${bill._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/billing/${bill._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Bill
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {bill.status === 'generated' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(bill._id, 'sent')}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {bill.status === 'sent' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(bill._id, 'paid')}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(bill._id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Bill
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
