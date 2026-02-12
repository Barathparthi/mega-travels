'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  User, 
  Car,
  Search,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageHeader } from '@/components/shared/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RecentTripsheet {
  _id: string;
  tripsheetNumber?: string;
  status: string;
  submittedAt?: string;
  month: number;
  year: number;
  driverId: {
    name: string;
    email: string;
  };
  vehicleId: {
    vehicleNumber: string;
    routeName?: string;
  };
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function RecentSubmissionsPage() {
  const [tripsheets, setTripsheets] = useState<RecentTripsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'draft' | 'approved'>('all');

  useEffect(() => {
    fetchTripsheets();
  }, [selectedMonth, selectedYear, statusFilter]);

  const fetchTripsheets = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '&status=all';
      const response = await fetch(
        `/api/admin/tripsheets?month=${selectedMonth}&year=${selectedYear}&limit=100${statusParam}`,
        {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch tripsheets:', response.status, response.statusText, errorText);
        setError(`Failed to load: ${response.statusText}`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!data.success) {
        console.error('API returned error:', data.message || 'Unknown error');
        setError(data.message || 'Failed to load tripsheets');
        setTripsheets([]);
        setLoading(false);
        return;
      }

      if (data.data && Array.isArray(data.data)) {
        // Convert Mongoose documents to plain objects if needed
        const plainTripsheets = data.data.map((ts: any) => {
          if (ts && typeof ts === 'object') {
            if (ts.toObject && typeof ts.toObject === 'function') {
              return ts.toObject();
            }
            if (ts.driverId && typeof ts.driverId === 'object') {
              ts.driverId = ts.driverId.toObject ? ts.driverId.toObject() : ts.driverId;
            }
            if (ts.vehicleId && typeof ts.vehicleId === 'object') {
              ts.vehicleId = ts.vehicleId.toObject ? ts.vehicleId.toObject() : ts.vehicleId;
            }
          }
          return ts;
        });

        // Sort: submitted first (by submittedAt desc), then draft (by createdAt desc)
        const sorted = plainTripsheets.sort((a: any, b: any) => {
          if (a.status === 'submitted' && b.status === 'submitted') {
            const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return bTime - aTime;
          }
          if (a.status === 'submitted' && b.status !== 'submitted') {
            return -1;
          }
          if (a.status !== 'submitted' && b.status === 'submitted') {
            return 1;
          }
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });

        setTripsheets(sorted);
        setError(null);
      } else {
        console.warn('Unexpected data format:', data);
        setTripsheets([]);
        setError(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch tripsheets:', error);
      setError(error.message || 'Failed to load tripsheets');
      setTripsheets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Approved
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  // Filter by search term
  const filteredTripsheets = tripsheets.filter((ts) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      ts.driverId?.name?.toLowerCase().includes(search) ||
      ts.vehicleId?.vehicleNumber?.toLowerCase().includes(search) ||
      ts.vehicleId?.routeName?.toLowerCase().includes(search)
    );
  });

  const submittedCount = tripsheets.filter(ts => ts.status === 'submitted').length;
  const draftCount = tripsheets.filter(ts => ts.status === 'draft').length;
  const approvedCount = tripsheets.filter(ts => ts.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Recent Submissions"
        subtitle="View all submitted tripsheets and track submission status"
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value: any) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search driver or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{tripsheets.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-green-600">{submittedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-amber-600">{draftCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{approvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tripsheets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tripsheets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading tripsheets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-red-300" />
              <p>{error}</p>
              <Button
                onClick={() => fetchTripsheets()}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : filteredTripsheets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No tripsheets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTripsheets.map((tripsheet) => (
                <Link
                  key={tripsheet._id}
                  href={`/admin/tripsheets/${tripsheet._id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <p className="font-semibold text-base text-gray-900">
                          {tripsheet.driverId?.name || 'Unknown Driver'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          <span className="font-mono">{tripsheet.vehicleId?.vehicleNumber || 'N/A'}</span>
                        </div>
                        {tripsheet.vehicleId?.routeName && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{tripsheet.vehicleId.routeName}</span>
                          </>
                        )}
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {MONTHS[tripsheet.month - 1]?.label} {tripsheet.year}
                          </span>
                        </div>
                      </div>
                      {tripsheet.status === 'submitted' && tripsheet.submittedAt && (
                        <div className="ml-8 mt-2 text-xs text-gray-500">
                          Submitted: {formatDate(tripsheet.submittedAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(tripsheet.status)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
