'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Wrench, Loader2 } from 'lucide-react';
import { formatIndianNumber } from '@/lib/utils/indian-number-format';
import { format } from 'date-fns';

export function ServiceReminder() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['driver-service-reminder'],
    queryFn: async () => {
      const res = await fetch('/api/driver/service-reminder');
      if (!res.ok) throw new Error('Failed to fetch reminder');
      return res.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (error || !data?.success || !data?.data) {
    return null; // Don't show anything if no reminder
  }

  const reminder = data.data;
  const isOverdue = reminder.status === 'overdue';

  return (
    <Card className={`border-2 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-orange-300 bg-orange-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isOverdue ? 'bg-red-100' : 'bg-orange-100'}`}>
            <Wrench className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold text-sm ${isOverdue ? 'text-red-900' : 'text-orange-900'}`}>
                Service Reminder
              </h4>
              {isOverdue && (
                <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-bold rounded">
                  URGENT
                </span>
              )}
            </div>
            <p className={`text-xs leading-relaxed mb-2 ${isOverdue ? 'text-red-800' : 'text-orange-800'}`}>
              {reminder.message}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Last Service:</span>
                <span className={`ml-1 font-medium ${isOverdue ? 'text-red-900' : 'text-orange-900'}`}>
                  {reminder.lastService.serviceType}
                </span>
              </div>
              <div>
                <span className="text-gray-600">KM Since Service:</span>
                <span className={`ml-1 font-medium ${isOverdue ? 'text-red-900' : 'text-orange-900'}`}>
                  {formatIndianNumber(reminder.kmSinceService)} km
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

