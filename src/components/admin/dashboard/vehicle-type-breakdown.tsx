'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface VehicleTypeBreakdownData {
  [vehicleTypeName: string]: number;
}

export function VehicleTypeBreakdown() {
  const [breakdown, setBreakdown] = useState<VehicleTypeBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data && data.data.vehicleTypeBreakdown) {
          setBreakdown(data.data.vehicleTypeBreakdown);
        }
      })
      .catch(err => {
        console.error('Failed to fetch vehicle type breakdown:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Vehicle Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Vehicle Type Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No vehicles found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Convert to array and sort by count (descending)
  const breakdownArray = Object.entries(breakdown)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate total for percentage
  const total = breakdownArray.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Vehicle Type Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {breakdownArray.map(({ type, count }) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 mt-1">{type}</p>
              {total > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {((count / total) * 100).toFixed(1)}% of total
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

