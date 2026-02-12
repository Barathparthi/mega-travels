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
import { Download, TrendingUp, Car, Fuel, Activity } from 'lucide-react';
import { useVehicleReport } from '@/hooks/useReports';
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

export default function VehicleReportPage() {
  const [vehicles, setVehicles] = useState<{ _id: string; vehicleNumber: string }[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [monthsBack, setMonthsBack] = useState(12);

  const { data: report, isLoading, error } = useVehicleReport(selectedVehicle, monthsBack);

  // Fetch vehicles list
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/admin/vehicles');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.length > 0) {
            setVehicles(result.data);
            setSelectedVehicle(result.data[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };

    fetchVehicles();
  }, []);

  const handleDownload = () => {
    // TODO: Implement PDF/Excel download
    console.log('Downloading vehicle report...');
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Vehicle Performance Report"
          subtitle="Track individual vehicle metrics"
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

  if (error || !selectedVehicle) {
    return (
      <div>
        <PageHeader
          title="Vehicle Performance Report"
          subtitle="Track individual vehicle metrics"
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Please select a vehicle to view the report.</p>
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
        title="Vehicle Performance Report"
        subtitle={report?.vehicleNumber ? `${report.vehicleNumber} - ${report.vehicleType}` : 'Select a vehicle'}
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
              <label className="text-sm font-medium mb-2 block">Select Vehicle</label>
              <Select
                value={selectedVehicle}
                onValueChange={setSelectedVehicle}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.vehicleNumber}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{formatIndianNumber(stats?.totalRevenue || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats?.totalTrips || 0} trips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Distance
            </CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatIndianNumber(stats?.totalKms || 0)} km
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {stats?.totalTrips ? Math.round(stats.totalKms / stats.totalTrips) : 0} km/trip
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilization
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageUtilization.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average utilization rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profitability
            </CardTitle>
            <Fuel className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.profitability || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{formatIndianNumber(stats?.profitability || 0, { decimals: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue - Fuel costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & KMs Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
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
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distance Covered</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${formatIndianNumber(value)} km`}
                />
                <Legend />
                <Bar dataKey="kms" fill="#3b82f6" name="Kilometers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trips & Utilization */}
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
                <Bar dataKey="trips" fill="#8b5cf6" name="Trips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilization Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="utilization"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Utilization %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Cost & Profitability</CardTitle>
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
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="fuelCost" fill="#ef4444" name="Fuel Cost" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
