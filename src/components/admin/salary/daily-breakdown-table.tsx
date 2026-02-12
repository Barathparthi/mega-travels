'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DailyEntry {
  date: Date;
  dayOfWeek: string;
  dayType: string;
  status: string;
  startingKm?: number;
  closingKm?: number;
  totalKm?: number;
  startingTime?: string;
  closingTime?: string;
  totalHours?: number;
  driverExtraHours?: number;
  remarks?: string;
}

interface DailyBreakdownTableProps {
  entries: DailyEntry[];
}

export default function DailyBreakdownTable({
  entries,
}: DailyBreakdownTableProps) {
  // Filter only working entries
  const workingEntries = entries.filter(
    (entry) => entry.dayType === 'working' && entry.status === 'working'
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      working: { label: 'Working', variant: 'default' as const },
      off: { label: 'Off', variant: 'secondary' as const },
      pending: { label: 'Pending', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculate totals
  const totals = workingEntries.reduce(
    (acc, entry) => ({
      totalKm: acc.totalKm + (entry.totalKm || 0),
      totalHours: acc.totalHours + (entry.totalHours || 0),
      totalDriverExtraHours:
        acc.totalDriverExtraHours + (entry.driverExtraHours || 0),
    }),
    { totalKm: 0, totalHours: 0, totalDriverExtraHours: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Daily Breakdown</CardTitle>
        <p className="text-sm text-gray-600">
          {workingEntries.length} working day(s) out of {entries.length} total
          day(s)
        </p>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Day</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">
                    Start KM
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    End KM
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Total KM
                  </TableHead>
                  <TableHead className="font-semibold">Start Time</TableHead>
                  <TableHead className="font-semibold">End Time</TableHead>
                  <TableHead className="font-semibold text-right">
                    Total Hrs
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Extra Hrs
                  </TableHead>
                  <TableHead className="font-semibold">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workingEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="text-center text-gray-500 py-8"
                    >
                      No working days found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {workingEntries.map((entry, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {formatDate(entry.date)}
                        </TableCell>
                        <TableCell>{entry.dayOfWeek}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.startingKm?.toLocaleString('en-IN') || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.closingKm?.toLocaleString('en-IN') || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {entry.totalKm?.toLocaleString('en-IN') || '-'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.startingTime || '-'}
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.closingTime || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {entry.totalHours?.toFixed(1) || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-[#B22234]">
                          {entry.driverExtraHours
                            ? entry.driverExtraHours.toFixed(1)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                          {entry.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-gray-100 font-semibold">
                      <TableCell colSpan={3} className="text-right">
                        TOTALS:
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                      <TableCell className="text-right font-mono text-[#6B4C9A]">
                        {totals.totalKm.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                      <TableCell className="text-right font-mono text-[#6B4C9A]">
                        {totals.totalHours.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[#B22234]">
                        {totals.totalDriverExtraHours.toFixed(1)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary Cards */}
        {workingEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium">Total Distance</p>
              <p className="text-2xl font-bold text-blue-900 font-mono mt-1">
                {totals.totalKm.toLocaleString('en-IN')} km
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 font-medium">Total Hours</p>
              <p className="text-2xl font-bold text-purple-900 font-mono mt-1">
                {totals.totalHours.toFixed(1)} hrs
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                Extra Hours (Salary)
              </p>
              <p className="text-2xl font-bold text-red-900 font-mono mt-1">
                {totals.totalDriverExtraHours.toFixed(1)} hrs
              </p>
              <p className="text-xs text-red-600 mt-1">
                @ ₹80/hr = ₹
                {(totals.totalDriverExtraHours * 80).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
