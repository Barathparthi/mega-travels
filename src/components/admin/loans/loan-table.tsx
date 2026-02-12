'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Loader2, Eye, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { formatIndianCurrency, formatIndianNumber } from '@/lib/utils/indian-number-format';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EditLoanModal } from './edit-loan-modal';
import { ViewLoanModal } from './view-loan-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VehicleLoan {
  _id: string;
  vehicleId: {
    _id: string;
    vehicleNumber: string;
    vehicleTypeId?: string;
  };
  vehicleNumber: string;
  financeName: string;
  accountName: string;
  loanStartDate: string;
  emiAmount: number;
  totalEmis?: number;
  emiDate: number;
  payments: Array<{
    emiDate: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    paidDate?: string;
    remarks?: string;
  }>;
  overdueCount?: number;
  hasOverdue?: boolean;
  totalPaid?: number;
  totalPending?: number;
  remainingEmis?: number;
  isActive: boolean;
}

export function LoanTable() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [editLoan, setEditLoan] = useState<VehicleLoan | null>(null);
  const [viewLoan, setViewLoan] = useState<VehicleLoan | null>(null);
  const [deleteLoan, setDeleteLoan] = useState<VehicleLoan | null>(null);
  const queryClient = useQueryClient();

  // Fetch vehicles for filter
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/vehicles');
      const data = await res.json();
      return data.data || [];
    },
  });

  // Fetch loans
  const { data, isLoading, error } = useQuery({
    queryKey: ['loans', selectedVehicle, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedVehicle !== 'all') {
        params.append('vehicleId', selectedVehicle);
      }
      params.append('status', selectedStatus);
      const res = await fetch(`/api/admin/loans?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch loans');
      return res.json();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const res = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete loan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-reminders'] });
      setDeleteLoan(null);
    },
  });

  const loans: VehicleLoan[] = data?.data || [];

  const handleDelete = () => {
    if (deleteLoan) {
      deleteMutation.mutate(deleteLoan._id);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          <p>Error: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Loan Records
            </CardTitle>
            <div className="flex gap-2">
              <div className="w-[250px]">
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    {vehiclesData?.map((vehicle: any) => (
                      <SelectItem key={vehicle._id} value={vehicle._id}>
                        {vehicle.vehicleNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No loan records found</p>
              <p className="text-sm mt-1">Add a loan record to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Finance Name</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>EMI Date</TableHead>
                      <TableHead className="text-right">EMI Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.vehicleNumber}
                        </TableCell>
                        <TableCell>{loan.financeName}</TableCell>
                        <TableCell>{loan.accountName}</TableCell>
                        <TableCell>
                          {loan.emiDate}th of month
                        </TableCell>
                        <TableCell className="text-right">
                          {formatIndianCurrency(loan.emiAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-green-600 font-medium">
                            {loan.totalPaid || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-orange-600 font-medium">
                            {loan.totalPending || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {loan.overdueCount && loan.overdueCount > 0 ? (
                            <Badge variant="destructive">{loan.overdueCount}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {loan.hasOverdue ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : loan.totalPending && loan.totalPending > 0 ? (
                            <Badge variant="outline">Active</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">Completed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewLoan(loan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditLoan(loan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteLoan(loan)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      {viewLoan && (
        <ViewLoanModal
          open={!!viewLoan}
          onOpenChange={(open) => !open && setViewLoan(null)}
          loan={viewLoan}
        />
      )}

      {/* Edit Modal */}
      {editLoan && (
        <EditLoanModal
          open={!!editLoan}
          onOpenChange={(open) => !open && setEditLoan(null)}
          loan={editLoan}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLoan} onOpenChange={(open) => !open && setDeleteLoan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

