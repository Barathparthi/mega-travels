'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

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
  };
}

export function RecentSubmissionsCard() {
  const [tripsheets, setTripsheets] = useState<RecentTripsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentTripsheets();
    // Refresh every 30 seconds to get latest submissions
    const interval = setInterval(() => {
      fetchRecentTripsheets();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentTripsheets = async () => {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      const response = await fetch(`/api/admin/tripsheets?month=${month}&year=${year}&limit=10&status=all`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
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
          // Handle Mongoose document conversion
          if (ts && typeof ts === 'object') {
            if (ts.toObject && typeof ts.toObject === 'function') {
              return ts.toObject();
            }
            // Ensure nested objects are also plain
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
          // Submitted tripsheets first
          if (a.status === 'submitted' && b.status === 'submitted') {
            const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return bTime - aTime; // Newest submitted first
          }
          if (a.status === 'submitted' && b.status !== 'submitted') {
            return -1; // a comes first
          }
          if (a.status !== 'submitted' && b.status === 'submitted') {
            return 1; // b comes first
          }
          // Both draft, sort by createdAt
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
      console.error('Failed to fetch recent tripsheets:', error);
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Submissions</CardTitle>
          <Link
            href="/admin/recent-submissions"
            className="text-sm text-brand-red hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Submissions</CardTitle>
          <Link
            href="/admin/recent-submissions"
            className="text-sm text-brand-red hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-red-300" />
            <p>{error}</p>
            <Button
              onClick={() => fetchRecentTripsheets()}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tripsheets.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Submissions</CardTitle>
          <Link
            href="/admin/recent-submissions"
            className="text-sm text-brand-red hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No tripsheets found for this month</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Submissions</CardTitle>
        <Link
          href="/admin/tripsheets"
          className="text-sm text-brand-red hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tripsheets.map((tripsheet) => (
            <Link
              key={tripsheet._id}
              href={`/admin/tripsheets/${tripsheet._id}`}
              className="block p-3 rounded-lg border border-gray-200 hover:border-brand-red hover:bg-red-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {tripsheet.driverId?.name || 'Unknown Driver'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-mono">
                      {tripsheet.vehicleId?.vehicleNumber || 'N/A'}
                    </span>
                    {tripsheet.status === 'submitted' && tripsheet.submittedAt && (
                      <span className="text-gray-400">•</span>
                    )}
                    {tripsheet.status === 'submitted' && tripsheet.submittedAt && (
                      <span className="text-gray-500">
                        {formatDate(tripsheet.submittedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(tripsheet.status)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
