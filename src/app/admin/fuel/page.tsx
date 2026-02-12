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
import { Badge } from '@/components/ui/badge';
import { Download, Lock } from 'lucide-react';
import { FuelSummaryCards } from '@/components/admin/fuel/fuel-summary-cards';
import { FuelTable } from '@/components/admin/fuel/fuel-table';
import { useFuelSummary, useExportFuelReport } from '@/hooks/useFuel';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

export default function FuelExpensesPage() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [vehicleId, setVehicleId] = useState<string>('all');

  const { data, isLoading } = useFuelSummary({ month, year, vehicleId });
  const exportMutation = useExportFuelReport();

  const handleExport = () => {
    exportMutation.mutate({ month, year, vehicleId });
  };

  const vehicles = data?.data?.vehicles || [];
  const stats = data?.data?.stats || {
    totalLitres: 0,
    totalAmount: 0,
    averageRatePerLitre: 0,
    averageMileage: 0,
    vehicleCount: 0,
  };

  return (
    <div>
      <PageHeader
        title="Fuel Expenses"
        subtitle="Track fuel consumption and costs"
        action={
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Internal Only
          </Badge>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select
                value={String(month)}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={String(year)}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Vehicle</label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((v: any) => (
                    <SelectItem key={v.vehicleId} value={v.vehicleId}>
                      {v.vehicleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending || isLoading}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <FuelSummaryCards stats={stats} isLoading={isLoading} />

      {/* Fuel Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Consumption by Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <FuelTable vehicles={vehicles} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
