'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VehicleLoan {
  _id: string;
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
  remainingEmis?: number;
}

interface ViewLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: VehicleLoan;
}

export function ViewLoanModal({ open, onOpenChange, loan }: ViewLoanModalProps) {
  const queryClient = useQueryClient();
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

  const markPaidMutation = useMutation({
    mutationFn: async (paymentIndices: number[]) => {
      const res = await fetch(`/api/admin/loans/${loan._id}/pay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIndices,
          paidDate: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to mark payments as paid');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan-reminders'] });
      setSelectedPayments([]);
    },
  });

  const togglePaymentSelection = (index: number) => {
    if (loan.payments[index].status === 'paid') return;
    
    setSelectedPayments((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleMarkSelectedPaid = () => {
    if (selectedPayments.length === 0) return;
    markPaidMutation.mutate(selectedPayments);
  };

  const today = new Date();
  const sortedPayments = [...loan.payments].sort(
    (a, b) => new Date(a.emiDate).getTime() - new Date(b.emiDate).getTime()
  );

  const paidCount = loan.payments.filter((p) => p.status === 'paid').length;
  const pendingCount = loan.payments.filter((p) => p.status === 'pending').length;
  const overduePayments = loan.payments.filter((p) => {
    const emiDate = new Date(p.emiDate);
    return p.status === 'pending' && emiDate < today;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Details - {loan.vehicleNumber}</DialogTitle>
          <DialogDescription>
            {loan.financeName} • {loan.accountName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">EMI Amount</p>
              <p className="text-lg font-bold">{formatIndianCurrency(loan.emiAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-lg font-bold text-green-600">{paidCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-lg font-bold text-orange-600">{pendingCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-lg font-bold text-red-600">{overduePayments.length}</p>
            </div>
          </div>

          {/* Payment List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">EMI Payment Schedule</h3>
              {selectedPayments.length > 0 && (
                <Button
                  onClick={handleMarkSelectedPaid}
                  disabled={markPaidMutation.isPending}
                  size="sm"
                  className="gap-2"
                >
                  {markPaidMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Mark {selectedPayments.length} as Paid
                </Button>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>EMI Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment, index) => {
                    const originalIndex = loan.payments.indexOf(payment);
                    const emiDate = new Date(payment.emiDate);
                    const isOverdue = payment.status === 'pending' && emiDate < today;
                    const isSelected = selectedPayments.includes(originalIndex);

                    return (
                      <TableRow
                        key={index}
                        className={isOverdue ? 'bg-red-50' : payment.status === 'paid' ? 'bg-green-50' : ''}
                      >
                        <TableCell>
                          {payment.status !== 'paid' && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePaymentSelection(originalIndex)}
                              className="h-4 w-4"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(emiDate, 'dd MMM yyyy')}
                          {isOverdue && (
                            <AlertCircle className="h-4 w-4 text-red-600 inline-block ml-2" />
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatIndianCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {payment.status === 'paid' ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.paidDate
                            ? format(new Date(payment.paidDate), 'dd MMM yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {payment.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

