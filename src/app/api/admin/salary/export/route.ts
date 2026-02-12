import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db/connection';
import DriverSalary from '@/backend/models/driver-salary.model';
import ExcelJS from 'exceljs';

/**
 * GET /api/admin/salary/export
 * Export salaries to Excel
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

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month')
      ? parseInt(searchParams.get('month')!)
      : new Date().getMonth() + 1;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear();
    const status = searchParams.get('status');

    // Build query
    const query: any = { month, year };

    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch all salaries for the period
    const salaries = await DriverSalary.find(query)
      .populate({
        path: 'driverId',
        select: 'name email phone licenseNumber',
      })
      .populate({
        path: 'vehicleId',
        select: 'vehicleNumber description routeName',
      })
      .populate({
        path: 'tripsheetId',
        select: 'tripsheetNumber',
      })
      .populate({
        path: 'paidBy',
        select: 'name email',
      })
      .sort({ createdAt: -1 });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Driver Salaries');

    // Set column widths and headers
    worksheet.columns = [
      { header: 'Salary ID', key: 'salaryId', width: 15 },
      { header: 'Driver Name', key: 'driverName', width: 20 },
      { header: 'License Number', key: 'licenseNumber', width: 15 },
      { header: 'Vehicle Number', key: 'vehicleNumber', width: 15 },
      { header: 'Month', key: 'month', width: 12 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
      { header: 'Extra Days', key: 'extraDays', width: 12 },
      { header: 'Total Hours', key: 'totalHours', width: 12 },
      { header: 'Extra Hours', key: 'extraHours', width: 12 },
      { header: 'Base Salary', key: 'baseSalary', width: 15 },
      { header: 'Extra Days Amount', key: 'extraDaysAmount', width: 18 },
      { header: 'Extra Hours Amount', key: 'extraHoursAmount', width: 18 },
      { header: 'Total Salary', key: 'totalSalary', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Paid Date', key: 'paidDate', width: 15 },
      { header: 'Paid By', key: 'paidBy', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6B4C9A' }, // Purple
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Helper function to get month name
    const getMonthName = (monthNum: number): string => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return months[monthNum - 1] || '';
    };

    // Add data rows
    salaries.forEach((salary: any) => {
      const row = worksheet.addRow({
        salaryId: salary.salaryId,
        driverName: salary.driverId?.name || 'N/A',
        licenseNumber: salary.driverId?.licenseNumber || 'N/A',
        vehicleNumber: salary.vehicleId?.vehicleNumber || 'N/A',
        month: getMonthName(salary.month),
        year: salary.year,
        workingDays: salary.calculation.totalWorkingDays,
        extraDays: salary.calculation.extraDays,
        totalHours: salary.calculation.totalHours,
        extraHours: salary.calculation.totalDriverExtraHours,
        baseSalary: salary.calculation.baseSalary,
        extraDaysAmount: salary.calculation.extraDaysAmount,
        extraHoursAmount: salary.calculation.extraHoursAmount,
        totalSalary: salary.calculation.totalSalary,
        status: salary.status.toUpperCase(),
        paidDate: salary.paidAt
          ? new Date(salary.paidAt).toLocaleDateString('en-IN')
          : '',
        paidBy: salary.paidBy?.name || '',
        notes: salary.notes || '',
      });

      // Format currency columns
      ['baseSalary', 'extraDaysAmount', 'extraHoursAmount', 'totalSalary'].forEach(
        (col) => {
          const cell = row.getCell(col);
          cell.numFmt = '₹#,##0';
        }
      );

      // Color code status
      const statusCell = row.getCell('status');
      if (salary.status === 'paid') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' }, // Green
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
      } else if (salary.status === 'generated') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }, // Blue
        };
        statusCell.font = { color: { argb: 'FFFFFFFF' } };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEAB308' }, // Yellow
        };
      }

      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Add totals row
    const totalRow = worksheet.addRow({
      salaryId: '',
      driverName: '',
      licenseNumber: '',
      vehicleNumber: '',
      month: '',
      year: '',
      workingDays: '',
      extraDays: '',
      totalHours: '',
      extraHours: '',
      baseSalary: '',
      extraDaysAmount: '',
      extraHoursAmount: '',
      totalSalary: salaries.reduce(
        (sum: number, s: any) => sum + s.calculation.totalSalary,
        0
      ),
      status: 'TOTAL',
      paidDate: '',
      paidBy: '',
      notes: '',
    });

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };

    const totalSalaryCell = totalRow.getCell('totalSalary');
    totalSalaryCell.numFmt = '₹#,##0';

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="driver-salaries-${getMonthName(
          month
        )}-${year}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Salary export error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to export salaries',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
