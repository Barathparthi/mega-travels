'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';
import { format } from 'date-fns';

interface ServiceReminder {
  vehicleId: string;
  vehicleNumber: string;
  lastService: {
    serviceType: string;
    serviceDate: string;
    serviceKm: number;
  };
  currentKm: number;
  kmSinceService: number;
  daysSinceService: number;
  status: 'due' | 'overdue' | 'upcoming';
  message: string;
}

export function ServiceRemindersCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['service-reminders'],
    queryFn: async () => {
      const res = await fetch('/api/admin/services/check-reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const reminders: ServiceReminder[] = data?.data || [];
  const overdueCount = data?.overdue || 0;
  const dueCount = data?.due || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Service Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Service Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Failed to load reminders</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Service Reminders
          </CardTitle>
          {reminders.length > 0 && (
            <div className="flex gap-2">
              {overdueCount > 0 && (
                <Badge variant="destructive">Overdue: {overdueCount}</Badge>
              )}
              {dueCount > 0 && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  Due: {dueCount}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">All vehicles are up to date</p>
              <p className="text-sm text-green-700">No service reminders at this time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.vehicleId}
                className={`p-4 rounded-lg border ${
                  reminder.status === 'overdue'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {reminder.vehicleNumber}
                      </h4>
                      <Badge
                        variant={reminder.status === 'overdue' ? 'destructive' : 'outline'}
                        className={reminder.status === 'due' ? 'border-orange-500 text-orange-700' : ''}
                      >
                        {reminder.status === 'overdue' ? 'OVERDUE' : 'DUE'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{reminder.message}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500">Last Service</p>
                        <p className="font-medium">{reminder.lastService.serviceType}</p>
                        <p className="text-gray-600">
                          {format(new Date(reminder.lastService.serviceDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Service KM</p>
                        <p className="font-medium">
                          {formatIndianNumber(reminder.lastService.serviceKm)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Current KM</p>
                        <p className="font-medium">{formatIndianNumber(reminder.currentKm)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">KM Since Service</p>
                        <p className="font-medium text-orange-700">
                          {formatIndianNumber(reminder.kmSinceService)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

