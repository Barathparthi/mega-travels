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
import type { IMonthlyTrend } from '@/backend/types';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';

interface TripsBarChartProps {
  data: IMonthlyTrend[];
}

export function TripsBarChart({ data }: TripsBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trips & KM Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="trips"
              fill="#3b82f6"
              name="Trips"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
