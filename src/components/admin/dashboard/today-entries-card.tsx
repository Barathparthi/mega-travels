'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Clock, Truck } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface TodayEntriesStats {
  total: number;
  entered: number;
  offDays: number;
  pending: number;
}

export function TodayEntriesCard() {
  const [stats, setStats] = useState<TodayEntriesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    fetch(`/api/admin/daily-entries?date=${today}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setStats(data.data.stats);
        }
      })
      .catch(err => console.error('Failed to fetch today entries:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today&apos;s Entries</CardTitle>
          <Link href="/admin/daily-entries">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const completionRate = stats.total > 0 
    ? Math.round(((stats.entered + stats.offDays) / stats.total) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today&apos;s Entries</CardTitle>
        <Link href="/admin/daily-entries">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Completion Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Completion Rate</span>
              <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.entered}</p>
                <p className="text-xs text-gray-500">Entered</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.offDays}</p>
                <p className="text-xs text-gray-500">Off Days</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Drivers</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

