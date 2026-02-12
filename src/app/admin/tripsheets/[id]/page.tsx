"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Car,
  User,
  Calendar,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAdminTripsheet } from '@/hooks/useAdminTripsheets';
import { ApproveModal } from '@/components/admin/tripsheets/approve-modal';
import { RejectModal } from '@/components/admin/tripsheets/reject-modal';
import { BillingPreview } from '@/components/admin/tripsheets/billing-preview';
import { getDownloadUrl } from '@/services/admin-tripsheets.service';
import { EntryStatus } from '@/backend/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()].substring(0, 3);
  const year = String(d.getFullYear()).substring(2);
  return `${day}-${month}-${year}`;
}

function getDayName(date: Date | string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(date).getDay()];
}

export default function TripsheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripsheetId = params?.id as string;

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useAdminTripsheet(tripsheetId);

  const handleSuccess = () => {
    refetch();
  };

  const handleDownload = () => {
    window.open(getDownloadUrl(tripsheetId), '_blank');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading tripsheet...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <p className="text-red-800 text-lg">Failed to load tripsheet</p>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  const tripsheet: any = data.data.tripsheet;
  const billing: any = data.data.billing;
  const vehicle: any = tripsheet.vehicleId;
  const driver: any = tripsheet.driverId;
  const vehicleType: any = vehicle.vehicleTypeId;

  const getStatusBadge = () => {
    switch (tripsheet.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-amber-100 text-amber-800">Submitted</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tripsheets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tripsheets
            </Button>
          </Link>
        </div>
      </div>

      {/* Title Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  Tripsheet: {tripsheet.tripsheetNumber}
                </h1>
                {getStatusBadge()}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="h-4 w-4" />
                  <span className="font-medium">{vehicle.vehicleNumber}</span>
                  <span>-</span>
                  <span>{vehicleType.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{driver.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{vehicle.routeName || 'Route not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {MONTH_NAMES[tripsheet.month - 1]} {tripsheet.year}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {tripsheet.status === 'submitted' && (
                <>
                  <Button
                    onClick={() => setApproveModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => setRejectModalOpen(true)}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              <Button onClick={handleDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-brand-red">
              {tripsheet.summary.totalWorkingDays}
            </p>
            <p className="text-sm text-gray-600 mt-1">Working Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-gray-700">
              {tripsheet.summary.totalOffDays}
            </p>
            <p className="text-sm text-gray-600 mt-1">Off Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {tripsheet.summary.totalKms.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total KM</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {tripsheet.summary.totalHours.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {tripsheet.summary.totalExtraHours.toFixed(1)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Extra Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Fuel Summary (Internal) */}
      {tripsheet.summary.totalFuelLitres > 0 && (
        <Card className="border-cyan-200 bg-cyan-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Fuel Summary (Internal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Litres</p>
                <p className="text-2xl font-bold">{tripsheet.summary.totalFuelLitres} L</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">
                  Rs. {tripsheet.summary.totalFuelAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left font-medium">S.No</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-right font-medium">Starting KM</th>
                  <th className="p-3 text-right font-medium">Closing KM</th>
                  <th className="p-3 text-right font-medium">Total KM</th>
                  <th className="p-3 text-center font-medium">Time</th>
                  <th className="p-3 text-right font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {tripsheet.entries
                  .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((entry: any, index: number) => {
                    const isWorking = entry.status === EntryStatus.WORKING;
                    const isOff = entry.status === EntryStatus.OFF;
                    const sNo = tripsheet.entries
                      .slice(0, index)
                      .filter((e: any) => e.status === EntryStatus.WORKING).length + 1;

                    return (
                      <tr
                        key={index}
                        className={`border-b ${isOff ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-3">{isWorking ? sNo : ''}</td>
                        <td className="p-3">
                          {formatDate(entry.date)}
                          <span className="text-xs text-gray-500 ml-2">
                            ({getDayName(entry.date)})
                          </span>
                        </td>
                        <td className="p-3">
                          {isWorking && <Badge variant="outline">Working</Badge>}
                          {isOff && <Badge className="bg-gray-200 text-gray-700">OFF</Badge>}
                          {entry.status === 'pending' && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {isWorking ? entry.startingKm?.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {isWorking ? entry.closingKm?.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {isWorking ? entry.totalKm?.toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="p-3 text-center text-xs">
                          {isWorking
                            ? `${entry.startingTime}-${entry.closingTime}`
                            : '-'}
                        </td>
                        <td className="p-3 text-right">
                          {isWorking ? entry.totalHours?.toFixed(1) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={5} className="p-3 text-right">
                    TOTAL
                  </td>
                  <td className="p-3 text-right font-mono">
                    {tripsheet.summary.totalKms.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                  <td className="p-3 text-right">
                    {tripsheet.summary.totalHours.toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Billing Preview */}
      <BillingPreview billing={billing} vehicleTypeName={vehicleType.name} />

      {/* Modals */}
      <ApproveModal
        open={approveModalOpen}
        onOpenChange={setApproveModalOpen}
        tripsheetId={tripsheet._id}
        tripsheetNumber={tripsheet.tripsheetNumber}
        driverName={driver.name}
        vehicleNumber={vehicle.vehicleNumber}
        summary={tripsheet.summary}
        onSuccess={handleSuccess}
      />

      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        tripsheetId={tripsheet._id}
        tripsheetNumber={tripsheet.tripsheetNumber}
        driverName={driver.name}
        vehicleNumber={vehicle.vehicleNumber}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
