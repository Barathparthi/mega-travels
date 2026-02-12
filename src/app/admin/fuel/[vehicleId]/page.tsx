'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { ArrowLeft, Fuel, DollarSign, TrendingUp, Gauge } from 'lucide-react';
import { useVehicleFuelDetail } from '@/hooks/useFuel';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';

export default function VehicleFuelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.vehicleId as string;

  // Default to current month
  const now = new Date();
  const [startDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [endDate] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const { data, isLoading } = useVehicleFuelDetail(vehicleId, startDate, endDate);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Loading..." subtitle="Please wait" />
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div>
        <PageHeader title="Error" subtitle="Vehicle fuel data not found" />
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>Unable to load vehicle fuel details.</p>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { vehicle, summary, entries } = data.data;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <PageHeader
            title={`${vehicle.vehicleNumber} - ${vehicle.vehicleType}`}
            subtitle={`Driver: ${vehicle.driverName}`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total KM</p>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatIndianNumber(summary.totalKm)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Litres</p>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Fuel className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatIndianNumber(summary.totalLitres.toFixed(1))} L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{formatIndianNumber(summary.totalAmount.toFixed(2))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Mileage</p>
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <Gauge className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.averageMileage.toFixed(2)} km/L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {!entries || entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No fuel entries found for this period.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Litres</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Rate/L</TableHead>
                    <TableHead className="text-right">Odometer</TableHead>
                    <TableHead className="text-right">Since Last</TableHead>
                    <TableHead className="text-right">Mileage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="text-right">
                        {entry.litres.toFixed(1)} L
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{formatIndianNumber(entry.amount.toFixed(2))}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{entry.ratePerLitre.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIndianNumber(entry.odometer)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.kmSinceLast
                          ? `${formatIndianNumber(entry.kmSinceLast)} km`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.mileage ? entry.mileage.toFixed(2) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {summary.totalLitres.toFixed(1)} L
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{formatIndianNumber(summary.totalAmount.toFixed(2))}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{summary.averageRatePerLitre.toFixed(2)} avg
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="text-right font-bold">
                      {summary.averageMileage.toFixed(2)} avg
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
