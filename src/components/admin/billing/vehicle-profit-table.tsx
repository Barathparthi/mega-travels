'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/utils/indian-number-format';

interface VehicleProfit {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverName?: string;
  billingAmount: number;
  driverSalary: number;
  fuelExpenses: number;
  loanEmi: number;
  netRevenue: number;
}

interface VehicleProfitData {
  month: string;
  year: number;
  vehicles: VehicleProfit[];
  totals: {
    totalBillingAmount: number;
    totalDriverSalary: number;
    totalFuelExpenses: number;
    totalLoanEmi: number;
    totalNetRevenue: number;
  };
}

interface VehicleProfitTableProps {
  month?: number;
  year?: number;
  showFilters?: boolean;
}

export function VehicleProfitTable({ month, year, showFilters = true }: VehicleProfitTableProps = {}) {
  const currentDate = new Date();
  const [data, setData] = useState<VehicleProfitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(month ?? currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(year ?? currentDate.getFullYear());
  
  // Sync with props if provided
  useEffect(() => {
    if (month !== undefined) setSelectedMonth(month);
    if (year !== undefined) setSelectedYear(year);
  }, [month, year]);
  
  // Update fetch when selected month/year changes (including from props)
  useEffect(() => {
    fetchVehicleProfit();
  }, [selectedMonth, selectedYear]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchVehicleProfit = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/reports/vehicle-profit?month=${selectedMonth}&year=${selectedYear}`
      );
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vehicle profit:', error);
    } finally {
      setLoading(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: monthNames[i],
  }));

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Vehicle Profitability Summary</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Net Revenue = Billing Amount - Driver Salary - Fuel Expenses - Loan EMI
            </p>
          </div>
          {showFilters && (
            <div className="flex gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !data || data.vehicles.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No data available for this month</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure tripsheets have entries with KM, hours, and fuel data
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check server console for detailed logs
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Total Billing</p>
                <p className="text-lg font-bold text-blue-700">
                  {formatIndianCurrency(data.totals.totalBillingAmount)}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-gray-600 mb-1">Total Salary</p>
                <p className="text-lg font-bold text-red-700">
                  {formatIndianCurrency(data.totals.totalDriverSalary)}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs text-gray-600 mb-1">Total Fuel</p>
                <p className="text-lg font-bold text-orange-700">
                  {formatIndianCurrency(data.totals.totalFuelExpenses)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-gray-600 mb-1">Total Loan EMI</p>
                <p className="text-lg font-bold text-purple-700">
                  {formatIndianCurrency(data.totals.totalLoanEmi || 0)}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                data.totals.totalNetRevenue >= 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className="text-xs text-gray-600 mb-1">Net Revenue</p>
                <p className={`text-lg font-bold ${
                  data.totals.totalNetRevenue >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatIndianCurrency(data.totals.totalNetRevenue)}
                </p>
              </div>
            </div>

            {/* Vehicle Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Billing Amount</TableHead>
                    <TableHead className="text-right">Driver Salary</TableHead>
                    <TableHead className="text-right">Fuel Expenses</TableHead>
                    <TableHead className="text-right">Loan EMI</TableHead>
                    <TableHead className="text-right font-bold">Net Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.vehicleId}>
                      <TableCell className="font-medium">
                        {vehicle.vehicleNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vehicle.vehicleType || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {vehicle.driverName || 'Unassigned'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIndianCurrency(vehicle.billingAmount)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        - {formatIndianCurrency(vehicle.driverSalary)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        - {formatIndianCurrency(vehicle.fuelExpenses)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        - {formatIndianCurrency(vehicle.loanEmi || 0)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <div className="flex items-center justify-end gap-2">
                          {vehicle.netRevenue >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={
                              vehicle.netRevenue >= 0 ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {formatIndianCurrency(vehicle.netRevenue)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
