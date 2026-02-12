'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, CreditCard } from 'lucide-react';
import { formatIndianCurrency } from '@/lib/utils/indian-number-format';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LoanReminder {
  _id: string;
  vehicleNumber: string;
  financeName: string;
  overduePayments: Array<{
    emiDate: string;
    amount: number;
  }>;
  upcomingPayments: Array<{
    emiDate: string;
    amount: number;
  }>;
  totalOverdueAmount: number;
  totalUpcomingAmount: number;
}

export function LoanRemindersCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['loan-reminders'],
    queryFn: async () => {
      const res = await fetch('/api/admin/loans/reminders');
      if (!res.ok) throw new Error('Failed to fetch reminders');
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Loan Payment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Loan Payment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">Failed to load reminders</p>
        </CardContent>
      </Card>
    );
  }

  const reminders: LoanReminder[] = data.data || [];
  const overdueLoans = reminders.filter((r) => r.overduePayments.length > 0);
  const upcomingLoans = reminders.filter((r) => r.upcomingPayments.length > 0);
  const totalOverdueAmount = reminders.reduce((sum, r) => sum + r.totalOverdueAmount, 0);
  const totalUpcomingAmount = reminders.reduce((sum, r) => sum + r.totalUpcomingAmount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Loan Payment Reminders
          </CardTitle>
          {(overdueLoans.length > 0 || upcomingLoans.length > 0) && (
            <div className="flex gap-2">
              {overdueLoans.length > 0 && (
                <Badge variant="destructive">Overdue: {overdueLoans.length}</Badge>
              )}
              {upcomingLoans.length > 0 && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  Upcoming: {upcomingLoans.length}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">All loan payments are up to date</p>
              <p className="text-sm text-green-700">No payment reminders at this time</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {(totalOverdueAmount > 0 || totalUpcomingAmount > 0) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {totalOverdueAmount > 0 && (
                  <div>
                    <p className="text-sm text-red-600">Total Overdue Amount</p>
                    <p className="text-xl font-bold text-red-900">
                      {formatIndianCurrency(totalOverdueAmount)}
                    </p>
                  </div>
                )}
                {totalUpcomingAmount > 0 && (
                  <div>
                    <p className="text-sm text-orange-600">Upcoming Payments (7 days)</p>
                    <p className="text-xl font-bold text-orange-900">
                      {formatIndianCurrency(totalUpcomingAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Overdue Loans */}
            {overdueLoans.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-900 mb-3">Overdue Payments</h4>
                <div className="space-y-3">
                  {overdueLoans.map((loan) => (
                    <div
                      key={loan._id}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-gray-900">
                              {loan.vehicleNumber}
                            </h5>
                            <Badge variant="destructive">OVERDUE</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {loan.financeName} • {loan.overduePayments.length} payment(s) overdue
                          </p>
                          <div className="space-y-1">
                            {loan.overduePayments.slice(0, 3).map((payment, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-gray-600">
                                  {format(new Date(payment.emiDate), 'dd MMM yyyy')}:
                                </span>
                                <span className="font-medium text-red-900 ml-2">
                                  {formatIndianCurrency(payment.amount)}
                                </span>
                              </div>
                            ))}
                            {loan.overduePayments.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{loan.overduePayments.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                        <Link href={`/admin/loans?view=${loan._id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Loans */}
            {upcomingLoans.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-900 mb-3">Upcoming Payments (Next 7 Days)</h4>
                <div className="space-y-3">
                  {upcomingLoans.map((loan) => (
                    <div
                      key={loan._id}
                      className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-gray-900">
                              {loan.vehicleNumber}
                            </h5>
                            <Badge variant="outline" className="border-orange-500 text-orange-700">
                              UPCOMING
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {loan.financeName} • {loan.upcomingPayments.length} payment(s) due soon
                          </p>
                          <div className="space-y-1">
                            {loan.upcomingPayments.slice(0, 3).map((payment, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="text-gray-600">
                                  {format(new Date(payment.emiDate), 'dd MMM yyyy')}:
                                </span>
                                <span className="font-medium text-orange-900 ml-2">
                                  {formatIndianCurrency(payment.amount)}
                                </span>
                              </div>
                            ))}
                            {loan.upcomingPayments.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{loan.upcomingPayments.length - 3} more
                              </p>
                            )}
                          </div>
                        </div>
                        <Link href={`/admin/loans?view=${loan._id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

