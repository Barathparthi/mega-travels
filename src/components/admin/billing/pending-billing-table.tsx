'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PendingTripSheet, BillingService } from '@/services/billing.service';
import { usePendingBilling } from '@/hooks/useBilling';
import { FileText, Loader2, Download } from 'lucide-react';

export function PendingBillingTable() {
  const { data: pendingTripSheets, isLoading, error } = usePendingBilling();

  const handleExportToExcel = async (tripSheet: PendingTripSheet) => {
    try {
      const response = await fetch(`/api/admin/tripsheets/${tripSheet._id}/download`);
      
      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json().catch(() => ({ message: 'Failed to export tripsheet' }));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to export tripsheet`);
      }
      
      // Check if response is actually an Excel file
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export tripsheet');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tripsheet_${tripSheet.tripSheetNumber}_${tripSheet.month}_${tripSheet.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error exporting tripsheet:', error);
      alert(`Failed to export tripsheet: ${error.message || 'Please try again.'}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading pending billing...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-sm text-destructive">Failed to load pending billing</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approved Tripsheets
          </CardTitle>
          <CardDescription>
            Approved tripsheets - Export to Excel for billing calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingTripSheets || pendingTripSheets.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No approved tripsheets found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Approved tripsheets will appear here for export
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip Sheet #</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Distance (km)</TableHead>
                      <TableHead className="text-right">Export</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTripSheets.map((tripSheet) => {
                      if (!tripSheet) return null;
                      const totalDistance = tripSheet.totalDistance ?? 0;
                      return (
                      <TableRow key={tripSheet._id}>
                        <TableCell className="font-medium">
                          {tripSheet.tripSheetNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {tripSheet.vehicleId?.registrationNumber || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tripSheet.vehicleId?.vehicleModel || ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tripSheet.driverId?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">
                              {tripSheet.driverId?.employeeId || ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {BillingService.formatMonthYear(
                              tripSheet.month,
                              tripSheet.year
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(totalDistance || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportToExcel(tripSheet)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Export Excel
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
