'use client';

import { useState, useEffect } from 'react';
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
import { Download, TrendingUp, Users, DollarSign, Star, Award } from 'lucide-react';
import { useDriverReport } from '@/hooks/useReports';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DriverReportPage() {
  const [drivers, setDrivers] = useState<{ _id: string; name: string }[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [monthsBack, setMonthsBack] = useState(12);

  const { data: report, isLoading, error } = useDriverReport(selectedDriver, monthsBack);

  // Fetch drivers list
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch('/api/admin/users?role=driver');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            setDrivers(result.data);
            setSelectedDriver(result.data[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch drivers:', error);
      }
    };

    fetchDrivers();
  }, []);

  const handleDownload = () => {
    // TODO: Implement PDF/Excel download
    console.log('Downloading driver report...');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Driver Performance Report"
          subtitle="Track individual driver metrics"
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

  if (error || !selectedDriver) {
    return (
      <div>
        <PageHeader
          title="Driver Performance Report"
          subtitle="Track individual driver metrics"
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Please select a driver to view the report.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = report?.totalStats;

  return (
    <div>
      <PageHeader
        title="Driver Performance Report"
        subtitle={report?.driverName || 'Select a driver'}
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
            <div className="flex-1 min-w-[250px]">
              <label className="text-sm font-medium mb-2 block">Select Driver</label>
              <Select
                value={selectedDriver}
                onValueChange={setSelectedDriver}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver._id} value={driver._id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatIndianNumber(stats?.totalTrips || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Completed trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Distance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatIndianNumber(stats?.totalKms || 0)} km
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total distance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{formatIndianNumber(stats?.totalRevenue || 0, { decimals: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <Award className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{formatIndianNumber((stats?.totalSalary || 0) + (stats?.totalBonus || 0), { decimals: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Salary + Bonus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 5.0
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trips & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" fill="#3b82f6" name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distance Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${formatIndianNumber(value)} km`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="kms"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Kilometers"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Generated */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue Generated</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={report?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `₹${formatIndianNumber(value, { decimals: 2 })}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Salary & Bonus Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `₹${formatIndianNumber(value, { decimals: 2 })}`}
                />
                <Legend />
                <Bar dataKey="salary" fill="#3b82f6" name="Salary" />
                <Bar dataKey="bonus" fill="#10b981" name="Bonus" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Salary</span>
                  <span className="text-lg font-bold">
                    ₹{formatIndianNumber(stats?.totalSalary || 0, { decimals: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${stats ? (stats.totalSalary / (stats.totalSalary + stats.totalBonus)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Bonus</span>
                  <span className="text-lg font-bold">
                    ₹{formatIndianNumber(stats?.totalBonus || 0, { decimals: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${stats ? (stats.totalBonus / (stats.totalSalary + stats.totalBonus)) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Total Earnings</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{formatIndianNumber((stats?.totalSalary || 0) + (stats?.totalBonus || 0), { decimals: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg per trip</span>
                  <span className="font-semibold">
                    ₹{stats?.totalTrips ? formatIndianNumber(((stats.totalSalary + stats.totalBonus) / stats.totalTrips), { decimals: 0 }) : 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
