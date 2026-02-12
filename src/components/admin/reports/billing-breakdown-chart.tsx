'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IBillingBreakdown } from '@/backend/types';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';

interface BillingBreakdownChartProps {
  data?: IBillingBreakdown['componentBreakdown'];
}

export function BillingBreakdownChart({ data }: BillingBreakdownChartProps) {
  if (!data) return null;

  const chartData = [
    { name: 'Base Fare', amount: data.baseFare },
    { name: 'KM Charges', amount: data.kmCharges },
    { name: 'Driver Bata', amount: data.driverBata },
    { name: 'Night Halt', amount: data.nightHalt },
    { name: 'Add. Hours', amount: data.additionalHours },
    { name: 'Add. KMs', amount: data.additionalKms },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Component Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `₹${formatIndianNumber(value)}`} />
            <Tooltip
              formatter={(value: number) => `₹${formatIndianNumber(value, { decimals: 2 })}`}
            />
            <Legend />
            <Bar dataKey="amount" fill="#10b981" name="Amount" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
