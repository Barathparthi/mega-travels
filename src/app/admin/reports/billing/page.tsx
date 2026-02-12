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
import { Download, Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useBillingReport } from '@/hooks/useReports';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';
import { BillingBreakdownChart } from '@/components/admin/reports/billing-breakdown-chart';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BillingReportPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: report, isLoading, error } = useBillingReport(selectedMonth, selectedYear);

  const handleDownload = () => {
    // TODO: Implement PDF/Excel download
    console.log('Downloading billing report...');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Billing Analysis Report"
          subtitle="Detailed billing breakdown"
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
          title="Billing Analysis Report"
          subtitle="Detailed billing breakdown"
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

  return (
    <div>
      <PageHeader
        title="Billing Analysis Report"
        subtitle={`${report?.month || MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
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
          </div>
        </CardContent>
      </Card>

      {/* Total Amount */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-2">Total Billing Amount</p>
              <h2 className="text-4xl font-bold">
                ₹{formatIndianNumber(report?.totalAmount || 0, { decimals: 2 })}
              </h2>
            </div>
            <Receipt className="h-16 w-16 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{formatIndianNumber(report?.paymentStatus.paid || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {report?.totalAmount ? ((report.paymentStatus.paid / report.totalAmount) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{formatIndianNumber(report?.paymentStatus.pending || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {report?.totalAmount ? ((report.paymentStatus.pending / report.totalAmount) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{formatIndianNumber(report?.paymentStatus.overdue || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {report?.totalAmount ? ((report.paymentStatus.overdue / report.totalAmount) * 100).toFixed(1) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Component Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Billing Components Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold">Base Fare</p>
                <p className="text-xs text-muted-foreground">Standard trip charges</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{formatIndianNumber(report?.componentBreakdown.baseFare || 0, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report?.totalAmount ? ((report.componentBreakdown.baseFare / report.totalAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-semibold">KM Charges</p>
                <p className="text-xs text-muted-foreground">Distance-based charges</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{formatIndianNumber(report?.componentBreakdown.kmCharges || 0, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report?.totalAmount ? ((report.componentBreakdown.kmCharges / report.totalAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="font-semibold">Additional Hours</p>
                <p className="text-xs text-muted-foreground">Extra time charges</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{formatIndianNumber(report?.componentBreakdown.additionalHours || 0, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report?.totalAmount ? ((report.componentBreakdown.additionalHours / report.totalAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="font-semibold">Additional KMs</p>
                <p className="text-xs text-muted-foreground">Extra distance charges</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{formatIndianNumber(report?.componentBreakdown.additionalKms || 0, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report?.totalAmount ? ((report.componentBreakdown.additionalKms / report.totalAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-semibold">Driver Bata</p>
                <p className="text-xs text-muted-foreground">Driver allowances</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{formatIndianNumber(report?.componentBreakdown.driverBata || 0, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report?.totalAmount ? ((report.componentBreakdown.driverBata / report.totalAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-semibold">Night Halt</p>
                <p className="text-xs text-muted-foreground">Overnight stay charges</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  ₹{formatIndianNumber(report?.componentBreakdown.nightHalt || 0, { decimals: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {report?.totalAmount ? ((report.componentBreakdown.nightHalt / report.totalAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BillingBreakdownChart data={report?.componentBreakdown} />

        {/* By Vehicle Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Vehicle Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report?.byVehicleType && report.byVehicleType.length > 0 ? (
                report.byVehicleType.map((vt, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{vt.vehicleType}</span>
                      <span className="text-sm font-bold">
                        ₹{formatIndianNumber(vt.amount, { decimals: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${vt.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {vt.percentage.toFixed(1)}% of total
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
