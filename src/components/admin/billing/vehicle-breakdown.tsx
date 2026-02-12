'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BillingService } from '@/services/billing.service';
import { VehicleBreakdown } from '@/services/billing.service';
import { Car } from 'lucide-react';

interface VehicleBreakdownProps {
  breakdown: VehicleBreakdown[];
  totalAmount: number;
  month: string;
  year: number;
}

export function VehicleBreakdownCard({ breakdown, totalAmount, month, year }: VehicleBreakdownProps) {
  if (!breakdown || breakdown.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-blue-600" />
          Vehicle-wise Revenue Breakdown
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {month} {year} • {breakdown.length} vehicle{breakdown.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Vehicle Number</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((vehicle, index) => (
              <TableRow key={vehicle.vehicleNumber}>
                <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                <TableCell className="font-semibold">{vehicle.vehicleNumber}</TableCell>
                <TableCell className="text-right font-bold text-gray-900">
                  {BillingService.formatCurrency(vehicle.amount)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-50 font-bold">
              <TableCell colSpan={2} className="text-right">
                Total Revenue:
              </TableCell>
              <TableCell className="text-right text-lg text-green-700">
                {BillingService.formatCurrency(totalAmount)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

