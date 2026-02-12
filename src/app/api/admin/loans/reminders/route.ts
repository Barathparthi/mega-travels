import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import VehicleLoan from '@/backend/models/vehicle-loan.model';

/**
 * GET /api/admin/loans/reminders
 * Get overdue and upcoming loan payments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get date 7 days from now
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Fetch active loans
    const loans = await VehicleLoan.find({ isActive: true }).lean();

    const reminders = loans.map((loan: any) => {
      const overduePayments: Array<{ emiDate: string; amount: number }> = [];
      const upcomingPayments: Array<{ emiDate: string; amount: number }> = [];

      for (const payment of loan.payments) {
        const emiDate = new Date(payment.emiDate);
        emiDate.setHours(0, 0, 0, 0);

        if (payment.status === 'pending') {
          if (emiDate < today) {
            // Overdue
            overduePayments.push({
              emiDate: payment.emiDate,
              amount: payment.amount,
            });
          } else if (emiDate >= today && emiDate <= nextWeek) {
            // Upcoming (within 7 days)
            upcomingPayments.push({
              emiDate: payment.emiDate,
              amount: payment.amount,
            });
          }
        }
      }

      const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalUpcomingAmount = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        _id: loan._id.toString(),
        vehicleNumber: loan.vehicleNumber,
        financeName: loan.financeName,
        accountName: loan.accountName,
        overduePayments,
        upcomingPayments,
        totalOverdueAmount,
        totalUpcomingAmount,
      };
    }).filter((reminder) => reminder.overduePayments.length > 0 || reminder.upcomingPayments.length > 0);

    // Sort by overdue first, then by upcoming
    reminders.sort((a, b) => {
      if (a.overduePayments.length > 0 && b.overduePayments.length === 0) return -1;
      if (a.overduePayments.length === 0 && b.overduePayments.length > 0) return 1;
      return b.totalOverdueAmount + b.totalUpcomingAmount - (a.totalOverdueAmount + a.totalUpcomingAmount);
    });

    return NextResponse.json({
      success: true,
      data: reminders,
      total: reminders.length,
      overdueCount: reminders.filter((r) => r.overduePayments.length > 0).length,
      upcomingCount: reminders.filter((r) => r.upcomingPayments.length > 0).length,
    });
  } catch (error: any) {
    console.error('Loan reminders error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch loan reminders',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

