'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, Truck, User, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DailyEntry {
  vehicleId: string;
  vehicleNumber: string;
  routeName: string;
  driverId: string | null;
  driverName: string;
  driverPhone: string;
  hasEntry: boolean;
  entry: any | null;
  status: 'pending' | 'working' | 'off';
}

interface DailyEntriesData {
  date: string;
  entries: DailyEntry[];
  stats: {
    total: number;
    entered: number;
    offDays: number;
    pending: number;
  };
}

export default function DailyEntriesPage() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [data, setData] = useState<DailyEntriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    fetchDailyEntries();
  }, [selectedDateStr]);

  const fetchDailyEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/daily-entries?date=${selectedDateStr}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch daily entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const handleToday = () => {
    setSelectedDate(today);
    setCalendarOpen(false);
  };

  const getStatusBadge = (entry: DailyEntry) => {
    if (entry.status === 'working') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Entered
        </Badge>
      );
    }
    if (entry.status === 'off') {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Truck className="h-3 w-3 mr-1" />
          Off Day
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'EEEE, MMMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Entries Tracking"
        subtitle="Monitor daily trip entries from all drivers"
      />

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'max-w-xs justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
          </div>
          {data && (
            <p className="mt-4 text-sm text-gray-600 font-medium">
              Showing entries for: {formatDate(data.date)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
                </div>
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entered</p>
                  <p className="text-2xl font-bold text-green-600">{data.stats.entered}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Off Days</p>
                  <p className="text-2xl font-bold text-blue-600">{data.stats.offDays}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{data.stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : data && data.entries.length > 0 ? (
            <div className="space-y-4">
              {data.entries.map((entry) => (
                <div
                  key={entry.vehicleId}
                  className={cn(
                    'border rounded-lg p-4 transition-colors',
                    entry.status === 'working'
                      ? 'bg-green-50 border-green-200'
                      : entry.status === 'off'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{entry.driverName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {entry.driverPhone}
                          </p>
                        </div>
                        <div className="border-l pl-4">
                          <p className="font-semibold text-gray-900">{entry.vehicleNumber}</p>
                          <p className="text-sm text-gray-500">{entry.routeName}</p>
                        </div>
                      </div>

                      {entry.hasEntry && entry.entry && entry.status === 'working' && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">KM</p>
                            <p className="font-medium text-gray-900">
                              {entry.entry.startingKm} → {entry.entry.closingKm}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Time</p>
                            <p className="font-medium text-gray-900">
                              {entry.entry.startingTime} → {entry.entry.closingTime}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total KM</p>
                            <p className="font-medium text-gray-900">
                              {entry.entry.totalKm || 0} km
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Hours</p>
                            <p className="font-medium text-gray-900">
                              {entry.entry.totalHours || 0} hrs
                            </p>
                          </div>
                        </div>
                      )}

                      {entry.hasEntry && entry.status === 'off' && (
                        <div className="mt-2 text-sm text-blue-700">
                          Marked as Off Day
                          {entry.entry.remarks && (
                            <span className="ml-2 text-gray-600">
                              - {entry.entry.remarks}
                            </span>
                          )}
                        </div>
                      )}

                      {!entry.hasEntry && (
                        <div className="mt-2 text-sm text-amber-700 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          No entry submitted yet
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {getStatusBadge(entry)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No drivers found for this date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

