import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { IVehicleFuelSummary } from '@/backend/types';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';
import { MileageIndicator } from './mileage-indicator';

interface FuelTableProps {
  vehicles: IVehicleFuelSummary[];
  isLoading?: boolean;
}

export function FuelTable({ vehicles, isLoading }: FuelTableProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No fuel data found for the selected period.</p>
      </div>
    );
  }

  // Calculate totals
  const totalKm = vehicles.reduce((sum, v) => sum + v.totalKm, 0);
  const totalLitres = vehicles.reduce((sum, v) => sum + v.totalLitres, 0);
  const totalAmount = vehicles.reduce((sum, v) => sum + v.totalAmount, 0);
  const avgMileage = totalLitres > 0 ? totalKm / totalLitres : 0;
  const avgRate = totalLitres > 0 ? totalAmount / totalLitres : 0;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle No</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="text-right">Total KM</TableHead>
            <TableHead className="text-right">Litres</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Mileage</TableHead>
            <TableHead className="text-right">Rate/L</TableHead>
            <TableHead className="text-center">Trend</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.vehicleId}>
              <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
              <TableCell>{vehicle.vehicleType}</TableCell>
              <TableCell>{vehicle.driverName}</TableCell>
              <TableCell className="text-right">
                {formatIndianNumber(vehicle.totalKm)}
              </TableCell>
              <TableCell className="text-right">
                {vehicle.totalLitres.toFixed(1)} L
              </TableCell>
              <TableCell className="text-right">
                ₹{formatIndianNumber(vehicle.totalAmount, { decimals: 2 })}
              </TableCell>
              <TableCell className="text-right">
                <MileageIndicator
                  mileage={vehicle.averageMileage}
                  health={vehicle.mileageHealth}
                />
              </TableCell>
              <TableCell className="text-right">
                ₹{vehicle.averageRatePerLitre.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                <span className="text-lg font-semibold">
                  {vehicle.trend === 'up' ? '↑' : vehicle.trend === 'down' ? '↓' : '→'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Link href={`/admin/fuel/${vehicle.vehicleId}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3} className="font-bold">
              TOTAL
            </TableCell>
            <TableCell className="text-right font-bold">
              {formatIndianNumber(totalKm)}
            </TableCell>
            <TableCell className="text-right font-bold">
              {totalLitres.toFixed(1)} L
            </TableCell>
            <TableCell className="text-right font-bold">
              ₹{formatIndianNumber(totalAmount, { decimals: 2 })}
            </TableCell>
            <TableCell className="text-right font-bold">
              {avgMileage.toFixed(2)} avg
            </TableCell>
            <TableCell className="text-right font-bold">
              ₹{avgRate.toFixed(2)}
            </TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
