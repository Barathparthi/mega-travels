"use client";

import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { ITripsheetStats } from '@/backend/types';

interface TripsheetStatsProps {
  stats: ITripsheetStats;
}

export function TripsheetStats({ stats }: TripsheetStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tripsheets</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Draft</p>
              <p className="text-3xl font-bold mt-2">{stats.draft}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="h-6 w-6 rounded-full bg-gray-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Still editing</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Submitted</p>
              <p className="text-3xl font-bold mt-2">{stats.submitted}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <div className="h-6 w-6 rounded-full bg-amber-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Pending review</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold mt-2">{stats.approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <div className="h-6 w-6 rounded-full bg-green-500" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Completed</p>
        </CardContent>
      </Card>
    </div>
  );
}
