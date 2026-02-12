'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, FileText, Car, User, DollarSign } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { format } from 'date-fns';

interface TripsheetRevenue {
  _id: string;
  tripsheetNumber: string;
  vehicleId: {
    _id: string;
    vehicleNumber: string;
    vehicleType?: string;
  };
  driverId: {
    _id: string;
    name: string;
  };
  month: number;
  year: number;
  revenue: number;
  driverSalary: number;
  fuelExpenses: number;
  profit: number;
}

interface VehicleRevenueGroup {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverName?: string;
  tripsheets: TripsheetRevenue[];
  totalRevenue: number;
  totalDriverSalary: number;
  totalFuelExpenses: number;
  totalLoanEmi: number;
  totalProfit: number;
}

interface RevenueDetailProps {
  month: number;
  year: number;
}

export function RevenueDetailTable({ month, year }: RevenueDetailProps) {
  const [data, setData] = useState<VehicleRevenueGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueDetails();
  }, [month, year]);

  const fetchRevenueDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/revenue/details?month=${month}&year=${year}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          console.log('Revenue details data:', result.data);
          setData(result.data);
        } else {
          console.error('Revenue details API returned error:', result.message);
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Revenue details API failed:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch revenue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTripsheet = async (tripsheetId: string) => {
    try {
      const response = await fetch(`/api/admin/tripsheets/${tripsheetId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to export tripsheet' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to export tripsheet`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export tripsheet');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tripsheet_${tripsheetId}_${month}_${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error exporting tripsheet:', error);
      alert(`Failed to export tripsheet: ${error.message || 'Please try again.'}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No revenue data available for this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((vehicleGroup) => (
        <Card key={vehicleGroup.vehicleId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">{vehicleGroup.vehicleNumber}</CardTitle>
                  <div className="flex items-center gap-4 mt-1">
                    {vehicleGroup.vehicleType && (
                      <Badge variant="outline">{vehicleGroup.vehicleType}</Badge>
                    )}
                    {vehicleGroup.driverName && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        {vehicleGroup.driverName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {vehicleGroup.totalProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="text-xs text-gray-600">Total Profit</p>
                    <p className={`text-xl font-bold ${
                      vehicleGroup.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatIndianCurrency(vehicleGroup.totalProfit)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Vehicle Summary */}
            <div className="grid grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
                <p className="text-lg font-semibold text-blue-700">
                  {formatIndianCurrency(vehicleGroup.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Driver Salary</p>
                <p className="text-lg font-semibold text-red-700">
                  - {formatIndianCurrency(vehicleGroup.totalDriverSalary)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Fuel Expenses</p>
                <p className="text-lg font-semibold text-orange-700">
                  - {formatIndianCurrency(vehicleGroup.totalFuelExpenses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Loan EMI</p>
                <p className="text-lg font-semibold text-purple-700">
                  - {formatIndianCurrency(vehicleGroup.totalLoanEmi || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Net Profit</p>
                <p className={`text-lg font-semibold ${
                  vehicleGroup.totalProfit >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatIndianCurrency(vehicleGroup.totalProfit)}
                </p>
              </div>
            </div>

            {/* Tripsheets Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tripsheet #</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Driver Salary</TableHead>
                    <TableHead className="text-right">Fuel Expenses</TableHead>
                    <TableHead className="text-right font-bold">Profit</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleGroup.tripsheets.map((tripsheet) => (
                    <TableRow key={tripsheet._id}>
                      <TableCell className="font-medium">
                        {tripsheet.tripsheetNumber}
                      </TableCell>
                      <TableCell className="text-right text-blue-700 font-semibold">
                        {formatIndianCurrency(tripsheet.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        - {formatIndianCurrency(tripsheet.driverSalary)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        - {formatIndianCurrency(tripsheet.fuelExpenses)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <div className="flex items-center justify-end gap-2">
                          {tripsheet.profit >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span
                            className={
                              tripsheet.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {formatIndianCurrency(tripsheet.profit)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportTripsheet(tripsheet._id)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

