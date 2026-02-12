'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, DollarSign, Calendar, Car, Users } from 'lucide-react';
import { useMonthlyReport } from '@/hooks/useReports';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';
import { RevenueTrendChart } from '@/components/admin/reports/revenue-trend-chart';
import { VehicleTypePieChart } from '@/components/admin/reports/vehicle-type-pie-chart';
import { TripsBarChart } from '@/components/admin/reports/trips-bar-chart';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyReportPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [monthsBack, setMonthsBack] = useState(6);

  const { data: report, isLoading, error } = useMonthlyReport(selectedMonth, selectedYear, monthsBack);

  const handleDownload = () => {
    // TODO: Implement PDF/Excel download
    console.log('Downloading report...');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Monthly Summary Report"
          subtitle="Comprehensive monthly overview"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Monthly Summary Report"
          subtitle="Comprehensive monthly overview"
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Failed to load report. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = report?.stats;
  const profitChange = stats ? (stats.profitMargin >= 0 ? 'positive' : 'negative') : 'neutral';

  return (
    <div>
      <PageHeader
        title="Monthly Summary Report"
        subtitle={`${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
        action={
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((month, index) => (
                    <SelectItem key={index} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Trend Period</label>
              <Select
                value={String(monthsBack)}
                onValueChange={(value) => setMonthsBack(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 Months</SelectItem>
                  <SelectItem value="6">Last 6 Months</SelectItem>
                  <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{formatIndianNumber(stats?.totalRevenue || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg ₹{formatIndianNumber(stats?.averageRevenuePerTrip || 0, { decimals: 0 })} per trip
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit
            </CardTitle>
            {profitChange === 'positive' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitChange === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
              ₹{formatIndianNumber(stats?.netProfit || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margin: {stats?.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatIndianNumber(stats?.totalTrips || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatIndianNumber(stats?.totalKms || 0)} kms total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{formatIndianNumber(stats?.totalExpenses || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fuel: ₹{formatIndianNumber(stats?.totalFuelCost || 0, { decimals: 0 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueTrendChart data={report?.monthlyTrends || []} />
        <VehicleTypePieChart data={report?.vehicleTypeBreakdown || []} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TripsBarChart data={report?.monthlyTrends || []} />

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm">Fuel Costs</span>
                </div>
                <span className="font-semibold">
                  ₹{formatIndianNumber(stats?.totalFuelCost || 0, { decimals: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">Salaries</span>
                </div>
                <span className="font-semibold">
                  ₹{formatIndianNumber(stats?.totalSalaries || 0, { decimals: 2 })}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="font-bold text-lg">
                    ₹{formatIndianNumber(stats?.totalExpenses || 0, { decimals: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Top Performing Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report?.topVehicles && report.topVehicles.length > 0 ? (
                report.topVehicles.map((vehicle, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{vehicle.vehicleNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.trips} trips • {formatIndianNumber(vehicle.kms)} kms
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ₹{formatIndianNumber(vehicle.revenue, { decimals: 0 })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Top Performing Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report?.topDrivers && report.topDrivers.length > 0 ? (
                report.topDrivers.map((driver, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{driver.driverName}</p>
                      <p className="text-xs text-muted-foreground">
                        {driver.trips} trips completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ₹{formatIndianNumber(driver.revenue, { decimals: 0 })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
