'use client';

import {
  LineChart,
  Line,
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

interface RevenueTrendChartProps {
  data: IMonthlyTrend[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profit Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis
              tickFormatter={(value) => `₹${formatIndianNumber(value)}`}
            />
            <Tooltip
              formatter={(value: number) => [
                `₹${formatIndianNumber(value, { decimals: 2 })}`,
                '',
              ]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              name="Expenses"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
