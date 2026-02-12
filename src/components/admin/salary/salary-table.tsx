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
import { DriverSalary } from '@/services/driver-salary.service';
import {
  Eye,
  MoreVertical,
  CheckCircle2,
  Trash2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { format } from 'date-fns';

interface SalaryTableProps {
  salaries: DriverSalary[];
  isLoading?: boolean;
  onMarkPaid?: (salary: DriverSalary) => void;
  onDelete?: (salaryId: string) => void;
}

export default function SalaryTable({
  salaries,
  isLoading,
  onMarkPaid,
  onDelete,
}: SalaryTableProps) {
  const getStatusBadge = (status: string) => {
    const config = {
      paid: {
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'Paid',
      },
      generated: {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Generated',
      },
      pending: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending',
      },
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <Badge
        variant="outline"
        className={`${statusConfig.className} border font-medium`}
      >
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  const getMonthYear = (month: number, year: number) => {
    return format(new Date(year, month - 1), 'MMMM yyyy');
  };

  const handleDelete = (salaryId: string, status: string) => {
    if (status === 'paid') {
      alert('Cannot delete paid salary records');
      return;
    }

    if (
      window.confirm(
        'Are you sure you want to delete this salary record? This action cannot be undone.'
      )
    ) {
      onDelete?.(salaryId);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B4C9A]"></div>
          <span className="ml-3 text-gray-600">Loading salaries...</span>
        </div>
      </div>
    );
  }

  if (salaries.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Salaries Found
        </h3>
        <p className="text-gray-600 mb-4">
          No salary records match your current filters.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 mb-2">
            <strong>To generate salaries:</strong>
          </p>
          <ol className="text-sm text-blue-700 text-left space-y-1 list-decimal list-inside">
            <li>Go to <strong>Trip Sheets</strong> and approve tripsheets for this month</li>
            <li>Click the <strong>"Generate All"</strong> button above to create salaries from approved tripsheets</li>
          </ol>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totals = salaries.reduce(
    (acc, salary) => ({
      totalSalary: acc.totalSalary + (salary.calculation?.totalSalary || 0),
      paidSalary:
        acc.paidSalary +
        (salary.status === 'paid' ? (salary.calculation?.totalSalary || 0) : 0),
      unpaidSalary:
        acc.unpaidSalary +
        (salary.status !== 'paid' ? (salary.calculation?.totalSalary || 0) : 0),
    }),
    { totalSalary: 0, paidSalary: 0, unpaidSalary: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-[#6B4C9A]/10 to-[#B22234]/10">
                <TableHead className="font-semibold">Salary ID</TableHead>
                <TableHead className="font-semibold">Driver</TableHead>
                <TableHead className="font-semibold">Vehicle</TableHead>
                <TableHead className="font-semibold">Period</TableHead>
                <TableHead className="font-semibold text-right">
                  Working Days
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Extra Hours
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Total Salary
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Paid Date</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((salary) => (
                <TableRow key={salary._id} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-medium text-[#6B4C9A]">
                    {salary.salaryId || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {salary.driverId?.name || 'N/A'}
                      </p>
                      {salary.driverId?.licenseNumber && (
                        <p className="text-xs text-gray-500 font-mono">
                          {salary.driverId.licenseNumber}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">
                        {salary.vehicleId?.vehicleNumber || 'N/A'}
                      </p>
                      {salary.vehicleId?.routeName && (
                        <p className="text-xs text-gray-500">
                          {salary.vehicleId.routeName}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {getMonthYear(salary.month, salary.year)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {salary.calculation?.totalWorkingDays ?? 0}
                    {(salary.calculation?.extraDays || 0) > 0 && (
                      <span className="text-[#B22234] ml-1">
                        (+{salary.calculation.extraDays})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(salary.calculation?.totalDriverExtraHours || 0).toFixed(1)} hrs
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-[#6B4C9A]">
                    {salary.calculation?.totalSalary !== undefined && salary.calculation?.totalSalary !== null
                      ? formatIndianCurrency(salary.calculation.totalSalary)
                      : '₹0'}
                    {salary.calculation?.advanceDeduction && salary.calculation.advanceDeduction > 0 && (
                      <div className="text-xs text-red-600 mt-1">
                        (-{formatIndianCurrency(salary.calculation.advanceDeduction)})
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(salary.status)}</TableCell>
                  <TableCell>
                    {salary.paidAt ? (
                      <div>
                        <p className="text-sm">{formatDate(salary.paidAt)}</p>
                        {salary.paidBy && (
                          <p className="text-xs text-gray-500">
                            by {salary.paidBy.name}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/salary/${salary._id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {salary.status !== 'paid' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => onMarkPaid?.(salary)}
                              className="cursor-pointer"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(salary._id, salary.status)}
                              className="cursor-pointer text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="bg-gray-100 font-semibold border-t-2">
                <TableCell colSpan={6} className="text-right">
                  TOTALS ({salaries.length} salaries):
                </TableCell>
                <TableCell className="text-right font-mono text-lg text-[#6B4C9A]">
                  {formatIndianCurrency(totals.totalSalary)}
                </TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Total Salaries</p>
          <p className="text-2xl font-bold text-gray-900 font-mono mt-1">
            {formatIndianCurrency(totals.totalSalary)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {salaries.length} salary record(s)
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <p className="text-sm text-green-700 font-medium">Paid Amount</p>
          <p className="text-2xl font-bold text-green-900 font-mono mt-1">
            {formatIndianCurrency(totals.paidSalary)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {salaries.filter((s) => s.status === 'paid').length} paid
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
          <p className="text-sm text-yellow-700 font-medium">Unpaid Amount</p>
          <p className="text-2xl font-bold text-yellow-900 font-mono mt-1">
            {formatIndianCurrency(totals.unpaidSalary)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {salaries.filter((s) => s.status !== 'paid').length} unpaid
          </p>
        </div>
      </div>
    </div>
  );
}
