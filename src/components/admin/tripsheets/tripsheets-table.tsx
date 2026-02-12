"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ArrowUpDown, FileText, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface TripEntry {
  date: string;
  startingKm?: number;
  closingKm?: number;
  totalKm?: number;
  startingTime?: string;
  closingTime?: string;
  totalHours?: number;
  extraHours?: number;
  status: string;
}

interface TripsheetData {
  _id: string;
  tripsheetNumber: string;
  vehicleId: {
    vehicleNumber: string;
    vehicleTypeId: {
      name: string;
      code: string;
    };
  };
  driverId: {
    name: string;
  };
  entries: TripEntry[];
  summary: {
    totalWorkingDays: number;
    totalKms: number;
    totalHours: number;
  };
  status: 'draft' | 'submitted' | 'approved';
  month: number;
  year: number;
}

interface TripsheetsTableProps {
  tripsheets: TripsheetData[];
}

// Flatten tripsheets into individual entries
interface FlattenedEntry extends TripEntry {
  _id: string;
  tripsheetNumber: string;
  vehicleNumber: string;
  driverName: string;
  vehicleType: string;
  tripsheetStatus: string;
  serialNumber: number;
}

export function TripsheetsTable({ tripsheets }: TripsheetsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Debug logging
  console.log('TripsheetsTable received data:', {
    tripsheets,
    isArray: Array.isArray(tripsheets),
    length: tripsheets?.length,
  });

  // Flatten all entries from all tripsheets with proper error handling
  const flattenedData = useMemo(() => {
    try {
      if (!tripsheets || !Array.isArray(tripsheets)) {
        console.warn('Tripsheets is not an array or is null/undefined');
        return [];
      }

      const flattened: FlattenedEntry[] = [];
      let serialNumber = 1;

      tripsheets.forEach((tripsheet, index) => {
        // Safety checks
        if (!tripsheet) {
          console.warn(`Tripsheet at index ${index} is null/undefined`);
          return;
        }

        if (!tripsheet.entries || !Array.isArray(tripsheet.entries)) {
          console.warn(`Tripsheet ${tripsheet._id} has no entries or entries is not an array`);
          return;
        }

        if (!tripsheet.vehicleId || !tripsheet.driverId) {
          console.warn(`Tripsheet ${tripsheet._id} missing vehicleId or driverId`);
          return;
        }

        // Only show working entries
        const workingEntries = tripsheet.entries.filter(
          (entry) => entry && entry.status === 'working'
        );

        workingEntries.forEach((entry) => {
          flattened.push({
            ...entry,
            _id: tripsheet._id || '',
            tripsheetNumber: tripsheet.tripsheetNumber || 'N/A',
            vehicleNumber: tripsheet.vehicleId?.vehicleNumber || 'N/A',
            driverName: tripsheet.driverId?.name || 'N/A',
            vehicleType: tripsheet.vehicleId?.vehicleTypeId?.name || 'N/A',
            tripsheetStatus: tripsheet.status || 'draft',
            serialNumber: serialNumber++,
          });
        });
      });

      console.log('Flattened data:', flattened.length, 'entries');
      return flattened;
    } catch (error) {
      console.error('Error flattening tripsheet data:', error);
      return [];
    }
  }, [tripsheets]);

  const columns = useMemo<ColumnDef<FlattenedEntry>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'S.No',
        cell: ({ row }) => (
          <div className="text-center font-medium">{row.original.serialNumber}</div>
        ),
      },
      {
        accessorKey: 'driverName',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Driver
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.original.driverName}</div>
        ),
      },
      {
        accessorKey: 'date',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm">
            {format(new Date(row.original.date), 'dd-MM-yyyy')}
          </div>
        ),
      },
      {
        accessorKey: 'vehicleNumber',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Vehicle No
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.original.vehicleNumber}</div>
        ),
      },
      {
        accessorKey: 'startingKm',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Starting KM
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {row.original.startingKm?.toLocaleString('en-IN') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'closingKm',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Closing KM
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {row.original.closingKm?.toLocaleString('en-IN') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'totalKm',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Total KM
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-mono font-semibold">
            {row.original.totalKm?.toLocaleString('en-IN') || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'startingTime',
        header: 'Starting Time',
        cell: ({ row }) => (
          <div className="text-center font-mono">
            {row.original.startingTime || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'closingTime',
        header: 'Closing Time',
        cell: ({ row }) => (
          <div className="text-center font-mono">
            {row.original.closingTime || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'totalHours',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Total Hrs
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            {row.original.totalHours?.toFixed(1) || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'extraHours',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="hover:bg-transparent"
            >
              Extra Hr
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.extraHours ? (
              <span className="text-orange-600 font-semibold">
                {row.original.extraHours.toFixed(1)}
              </span>
            ) : (
              '-'
            )}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const tripsheetId = row.original._id;
          const handleDownload = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(`/api/admin/tripsheets/${tripsheetId}/download`, '_blank');
          };
          
          return (
            <div className="flex items-center gap-2">
              <Link href={`/admin/tripsheets/${tripsheetId}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDownload}
                title="Download Excel"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: flattenedData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (flattenedData.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No trip entries found</h3>
        <p className="text-gray-500">
          No working trip entries available for the selected filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Row */}
      <div className="border-t bg-gray-50 px-4 py-3">
        <div className="text-sm text-gray-600">
          <strong>Total Entries:</strong> {flattenedData.length} |
          <strong className="ml-4">Total KM:</strong> {flattenedData.reduce((sum, entry) => sum + (entry.totalKm || 0), 0).toLocaleString('en-IN')} |
          <strong className="ml-4">Total Hours:</strong> {flattenedData.reduce((sum, entry) => sum + (entry.totalHours || 0), 0).toFixed(1)}
        </div>
      </div>
    </div>
  );
}
