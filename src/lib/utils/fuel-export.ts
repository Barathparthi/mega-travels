import ExcelJS from 'exceljs';
import type { IVehicleFuelSummary, IFuelSummaryStats, IFuelEntry } from '@/backend/types';
import { formatIndianNumber } from './indian-number-format';

const MONTH_NAMES = [
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

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const monthShort = MONTH_NAMES[d.getMonth()].substring(0, 3);
  const year = String(d.getFullYear()).substring(2);
  return `${day}-${monthShort}-${year}`;
}

/**
 * Generate Excel fuel expense report
 */
export async function generateFuelReportExcel(
  vehicles: IVehicleFuelSummary[],
  stats: IFuelSummaryStats,
  month: number,
  year: number
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Fuel Report');

  // Set column widths
  sheet.columns = [
    { width: 5 },   // A: S.No
    { width: 15 },  // B: Vehicle No
    { width: 12 },  // C: Type
    { width: 15 },  // D: Driver
    { width: 10 },  // E: Total KM
    { width: 10 },  // F: Litres
    { width: 12 },  // G: Amount
    { width: 10 },  // H: Mileage
    { width: 10 },  // I: Rate/L
    { width: 8 },   // J: Trend
  ];

  let rowNum = 1;

  // Header - Company Name
  const headerRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:J${rowNum - 1}`);
  headerRow.getCell(1).value = 'MAYAA TRAVELS';
  headerRow.getCell(1).font = { size: 16, bold: true };
  headerRow.getCell(1).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
  headerRow.height = 25;

  // Subheader - Fuel Expense Report
  const subHeaderRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:J${rowNum - 1}`);
  subHeaderRow.getCell(1).value = 'FUEL EXPENSE REPORT (INTERNAL)';
  subHeaderRow.getCell(1).font = { size: 12, bold: true };
  subHeaderRow.getCell(1).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };

  // Month/Year
  const periodRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:J${rowNum - 1}`);
  periodRow.getCell(1).value = `${MONTH_NAMES[month - 1]} ${year}`;
  periodRow.getCell(1).font = { size: 11, bold: true };
  periodRow.getCell(1).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };

  rowNum++; // Empty row

  // Summary Stats
  const statsRow1 = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:E${rowNum - 1}`);
  statsRow1.getCell(1).value = `Total Vehicles: ${stats.vehicleCount}`;
  statsRow1.getCell(1).font = { bold: true };

  sheet.mergeCells(`F${rowNum - 1}:J${rowNum - 1}`);
  statsRow1.getCell(6).value = `Total Litres: ${formatIndianNumber(stats.totalLitres, { decimals: 1 })} L`;
  statsRow1.getCell(6).font = { bold: true };

  const statsRow2 = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:E${rowNum - 1}`);
  statsRow2.getCell(1).value = `Average Mileage: ${stats.averageMileage.toFixed(2)} km/L`;
  statsRow2.getCell(1).font = { bold: true };

  sheet.mergeCells(`F${rowNum - 1}:J${rowNum - 1}`);
  statsRow2.getCell(6).value = `Total Amount: ₹${formatIndianNumber(stats.totalAmount, { decimals: 2 })}`;
  statsRow2.getCell(6).font = { bold: true };

  rowNum++; // Empty row

  // Table Header
  const tableHeaderRow = sheet.getRow(rowNum++);
  const headers = [
    'S.No',
    'Vehicle No',
    'Type',
    'Driver',
    'Total KM',
    'Litres',
    'Amount (₹)',
    'Mileage',
    'Rate/L (₹)',
    'Trend',
  ];

  headers.forEach((header, index) => {
    const cell = tableHeaderRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Vehicle Data Rows
  vehicles.forEach((vehicle, index) => {
    const row = sheet.getRow(rowNum++);
    row.height = 20;

    // S.No
    row.getCell(1).value = index + 1;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Vehicle Number
    row.getCell(2).value = vehicle.vehicleNumber;
    row.getCell(2).alignment = { vertical: 'middle' };

    // Type
    row.getCell(3).value = vehicle.vehicleType;
    row.getCell(3).alignment = { vertical: 'middle' };

    // Driver
    row.getCell(4).value = vehicle.driverName;
    row.getCell(4).alignment = { vertical: 'middle' };

    // Total KM
    row.getCell(5).value = formatIndianNumber(vehicle.totalKm);
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

    // Litres
    row.getCell(6).value = `${vehicle.totalLitres.toFixed(1)} L`;
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

    // Amount
    row.getCell(7).value = `₹${formatIndianNumber(vehicle.totalAmount, { decimals: 2 })}`;
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };

    // Mileage with color coding
    const mileageCell = row.getCell(8);
    mileageCell.value = `${vehicle.averageMileage.toFixed(2)} km/L`;
    mileageCell.alignment = { horizontal: 'right', vertical: 'middle' };

    if (vehicle.mileageHealth === 'good') {
      mileageCell.font = { color: { argb: 'FF00B050' }, bold: true };
    } else if (vehicle.mileageHealth === 'average') {
      mileageCell.font = { color: { argb: 'FFFFC000' }, bold: true };
    } else {
      mileageCell.font = { color: { argb: 'FFFF0000' }, bold: true };
    }

    // Rate per litre
    row.getCell(9).value = `₹${vehicle.averageRatePerLitre.toFixed(2)}`;
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };

    // Trend
    const trendCell = row.getCell(10);
    trendCell.value =
      vehicle.trend === 'up' ? '↑' : vehicle.trend === 'down' ? '↓' : '→';
    trendCell.alignment = { horizontal: 'center', vertical: 'middle' };
    trendCell.font = { size: 14, bold: true };

    // Borders
    for (let i = 1; i <= 10; i++) {
      row.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  });

  // Total Row
  const totalRow = sheet.getRow(rowNum++);
  totalRow.height = 22;

  sheet.mergeCells(`A${rowNum - 1}:D${rowNum - 1}`);
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(1).font = { bold: true, size: 11 };
  totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  const totalKm = vehicles.reduce((sum, v) => sum + v.totalKm, 0);
  totalRow.getCell(5).value = formatIndianNumber(totalKm);
  totalRow.getCell(5).font = { bold: true };
  totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell(6).value = `${formatIndianNumber(stats.totalLitres, { decimals: 1 })} L`;
  totalRow.getCell(6).font = { bold: true };
  totalRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell(7).value = `₹${formatIndianNumber(stats.totalAmount, { decimals: 2 })}`;
  totalRow.getCell(7).font = { bold: true };
  totalRow.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell(8).value = `${stats.averageMileage.toFixed(2)} avg`;
  totalRow.getCell(8).font = { bold: true };
  totalRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell(9).value = `₹${stats.averageRatePerLitre.toFixed(2)}`;
  totalRow.getCell(9).font = { bold: true };
  totalRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell(10).value = '';

  // Borders for total row
  for (let i = 1; i <= 10; i++) {
    totalRow.getCell(i).border = {
      top: { style: 'double' },
      left: { style: 'thin' },
      bottom: { style: 'double' },
      right: { style: 'thin' },
    };
    totalRow.getCell(i).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
  }

  rowNum++; // Empty row

  // Footer
  const footerRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:J${rowNum - 1}`);
  footerRow.getCell(1).value = 'Generated on: ' + formatDate(new Date());
  footerRow.getCell(1).font = { italic: true, size: 9 };
  footerRow.getCell(1).alignment = { horizontal: 'center' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any;
}

/**
 * Generate Excel vehicle fuel detail report
 */
export async function generateVehicleFuelDetailExcel(
  vehicleInfo: { vehicleNumber: string; vehicleType: string; driverName: string },
  summary: {
    totalKm: number;
    totalLitres: number;
    totalAmount: number;
    averageMileage: number;
    averageRatePerLitre: number;
  },
  entries: IFuelEntry[],
  dateRange: { startDate: Date; endDate: Date }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Vehicle Fuel Detail');

  // Set column widths
  sheet.columns = [
    { width: 5 },   // A: S.No
    { width: 12 },  // B: Date
    { width: 10 },  // C: Litres
    { width: 12 },  // D: Amount
    { width: 10 },  // E: Rate/L
    { width: 12 },  // F: Odometer
    { width: 12 },  // G: KM Since Last
    { width: 10 },  // H: Mileage
  ];

  let rowNum = 1;

  // Header - Company Name
  const headerRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:H${rowNum - 1}`);
  headerRow.getCell(1).value = 'MAYAA TRAVELS';
  headerRow.getCell(1).font = { size: 16, bold: true };
  headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Vehicle Details
  const vehicleRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:H${rowNum - 1}`);
  vehicleRow.getCell(1).value = `${vehicleInfo.vehicleNumber} - ${vehicleInfo.vehicleType}`;
  vehicleRow.getCell(1).font = { size: 12, bold: true };
  vehicleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const driverRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:H${rowNum - 1}`);
  driverRow.getCell(1).value = `Driver: ${vehicleInfo.driverName}`;
  driverRow.getCell(1).font = { size: 11 };
  driverRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const periodRow = sheet.getRow(rowNum++);
  sheet.mergeCells(`A${rowNum - 1}:H${rowNum - 1}`);
  periodRow.getCell(1).value = `${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`;
  periodRow.getCell(1).font = { size: 10 };
  periodRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  rowNum++; // Empty row

  // Summary
  const summaryRow1 = sheet.getRow(rowNum++);
  summaryRow1.getCell(1).value = 'Total KM:';
  summaryRow1.getCell(1).font = { bold: true };
  summaryRow1.getCell(2).value = formatIndianNumber(summary.totalKm);

  summaryRow1.getCell(4).value = 'Total Litres:';
  summaryRow1.getCell(4).font = { bold: true };
  summaryRow1.getCell(5).value = `${formatIndianNumber(summary.totalLitres, { decimals: 1 })} L`;

  const summaryRow2 = sheet.getRow(rowNum++);
  summaryRow2.getCell(1).value = 'Total Amount:';
  summaryRow2.getCell(1).font = { bold: true };
  summaryRow2.getCell(2).value = `₹${formatIndianNumber(summary.totalAmount, { decimals: 2 })}`;

  summaryRow2.getCell(4).value = 'Avg Mileage:';
  summaryRow2.getCell(4).font = { bold: true };
  summaryRow2.getCell(5).value = `${summary.averageMileage.toFixed(2)} km/L`;

  rowNum++; // Empty row

  // Table Header
  const tableHeaderRow = sheet.getRow(rowNum++);
  const headers = ['S.No', 'Date', 'Litres', 'Amount (₹)', 'Rate/L (₹)', 'Odometer', 'Since Last', 'Mileage'];

  headers.forEach((header, index) => {
    const cell = tableHeaderRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Entry Data Rows
  entries.forEach((entry, index) => {
    const row = sheet.getRow(rowNum++);
    row.height = 18;

    row.getCell(1).value = index + 1;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(2).value = formatDate(entry.date);
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(3).value = `${entry.litres.toFixed(1)} L`;
    row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(4).value = `₹${formatIndianNumber(entry.amount, { decimals: 2 })}`;
    row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(5).value = `₹${entry.ratePerLitre.toFixed(2)}`;
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(6).value = formatIndianNumber(entry.odometer);
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(7).value = entry.kmSinceLast ? `${formatIndianNumber(entry.kmSinceLast)} km` : '-';
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(8).value = entry.mileage ? `${entry.mileage.toFixed(2)}` : '-';
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };

    // Borders
    for (let i = 1; i <= 8; i++) {
      row.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any;
}
