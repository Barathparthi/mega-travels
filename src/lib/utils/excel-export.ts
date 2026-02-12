import ExcelJS from 'exceljs';
import type { IVehicle, IUser, IVehicleType, ITripsheet, IBillingCalculation } from '@/backend/types';
import { calculateBilling, numberToIndianWords, formatIndianNumber } from './billing';
import { EntryStatus } from '@/backend/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const monthShort = MONTH_NAMES[d.getMonth()].substring(0, 3);
  const year = String(d.getFullYear()).substring(2);
  return `${day}-${monthShort}-${year}`;
}

function getDayName(date: Date): string {
  return DAY_NAMES[new Date(date).getDay()];
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate Excel tripsheet in EXACT format matching the provided image
 */
export async function generateTripsheetExcel(
  tripsheet: ITripsheet,
  vehicle: IVehicle,
  driver: IUser,
  vehicleType: IVehicleType
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Tripsheet');

  // Set column widths
  sheet.columns = [
    { width: 6 },   // A: S.No
    { width: 12 },  // B: Date
    { width: 14 },  // C: Vehicle No
    { width: 12 },  // D: Starting KM
    { width: 12 },  // E: Closing KM
    { width: 10 },  // F: Total KM
    { width: 12 },  // G: Starting Time
    { width: 12 },  // H: Closing Time
    { width: 10 },  // I: Total Hrs
    { width: 10 },  // J: Extra Hrs
  ];

  let rowNum = 1;

  // ROW 1: Header with title and username
  sheet.mergeCells(`A${rowNum}:F${rowNum}`);
  const titleCell = sheet.getCell(`A${rowNum}`);
  const vehicleTypeDisplayName = vehicleType?.name || vehicleType?.code || 'Vehicle';
  titleCell.value = `Summary Of ${vehicle.description || vehicleTypeDisplayName}`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  sheet.mergeCells(`G${rowNum}:J${rowNum}`);
  const userCell = sheet.getCell(`G${rowNum}`);
  userCell.value = `USER NAME : ${driver.name}`;
  userCell.alignment = { vertical: 'middle', horizontal: 'right' };
  userCell.font = { size: 11 };

  rowNum++;

  // ROW 2: Route info
  sheet.mergeCells(`A${rowNum}:J${rowNum}`);
  const routeCell = sheet.getCell(`A${rowNum}`);
  const vehicleTypeName = vehicleType?.name || vehicleType?.code || 'VEHICLE';
  routeCell.value = `${vehicle.routeName || 'ROUTE'}  ROUTE NO -  ${vehicle.vehicleNumber} -  ${vehicleTypeName.toUpperCase()}`;
  routeCell.font = { bold: true, size: 11 };
  routeCell.alignment = { vertical: 'middle', horizontal: 'left' };

  rowNum++;

  // ROW 3: Empty row
  rowNum++;

  // ROW 4: Column headers
  const headerRow = sheet.getRow(rowNum);
  headerRow.height = 20;
  headerRow.values = [
    'S.No',
    'Date',
    'Vehicle No',
    'Starting KM',
    'Closing KM',
    'Total KM',
    'Stating Time',
    'Closing Time',
    'Total Hrs',
    'Extra Hrs'
  ];
  headerRow.font = { bold: true, size: 10 };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });

  rowNum++;

  // DATA ROWS
  let sNo = 1;
  let totalKm = 0;
  let totalExtraHours = 0;

  // Sort entries by date
  const sortedEntries = [...tripsheet.entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const entry of sortedEntries) {
    const row = sheet.getRow(rowNum);
    row.height = 18;

    if (entry.status === EntryStatus.WORKING) {
      // Working day entry
      row.values = [
        sNo,
        formatDate(entry.date),
        vehicle.vehicleNumber,
        entry.startingKm || 0,
        entry.closingKm || 0,
        entry.totalKm || 0,
        entry.startingTime || '',
        entry.closingTime || '',
        entry.totalHours ? formatHours(entry.totalHours) : '',
        entry.extraHours && entry.extraHours > 0 ? entry.extraHours.toFixed(1) : '-'
      ];

      totalKm += entry.totalKm || 0;
      totalExtraHours += entry.extraHours || 0;
      sNo++;

      row.alignment = { horizontal: 'center', vertical: 'middle' };
    } else if (entry.status === EntryStatus.OFF) {
      // Off day entry
      const dayName = getDayName(entry.date).toUpperCase();
      row.values = [
        '',
        formatDate(entry.date),
        vehicle.vehicleNumber,
        dayName,
        '-',
        '-',
        '-',
        '-',
        '-',
        '-'
      ];

      // Gray background for off days
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }
        };
      });

      row.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // Add borders to all cells
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    rowNum++;
  }

  // TOTAL ROW
  const totalRow = sheet.getRow(rowNum);
  totalRow.height = 20;

  sheet.mergeCells(`A${rowNum}:C${rowNum}`);
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = 'TOTAL KM';
  totalLabelCell.font = { bold: true, size: 11 };
  totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };

  totalRow.getCell(6).value = totalKm;
  totalRow.getCell(6).font = { bold: true, size: 11 };
  totalRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.getCell(10).value = totalExtraHours.toFixed(1);
  totalRow.getCell(10).font = { bold: true, size: 11 };
  totalRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  rowNum += 2;

  // BILLING SECTION
  // Ensure vehicleType is a valid object with billingRules before calculating billing
  let safeVehicleType = vehicleType;
  if (!safeVehicleType || typeof safeVehicleType !== 'object' || Array.isArray(safeVehicleType)) {
    // Create a default vehicle type if invalid
    safeVehicleType = {
      name: 'Vehicle',
      code: 'VEH',
      billingRules: {
        baseAmount: 55000,
        baseDays: 22,
        extraDayRate: 2500,
        extraKmRate: 10,
        baseHoursPerDay: 10,
        extraHourRate: 100,
      }
    };
  } else if (!safeVehicleType.billingRules || typeof safeVehicleType.billingRules !== 'object' || Array.isArray(safeVehicleType.billingRules)) {
    // Provide default billing rules if missing
    safeVehicleType = {
      ...safeVehicleType,
      billingRules: {
        baseAmount: 55000,
        baseDays: 22,
        extraDayRate: 2500,
        extraKmRate: 10,
        baseHoursPerDay: 10,
        extraHourRate: 100,
      }
    };
  }
  const billing = calculateBilling(tripsheet as any, safeVehicleType as any);

  // Monthly Rental
  const rentalRow = sheet.getRow(rowNum);
  sheet.mergeCells(`A${rowNum}:H${rowNum}`);
  rentalRow.getCell(1).value = `Monthly Rental ( ${billing.baseDays} Days Per Month)`;
  rentalRow.getCell(1).font = { size: 10 };

  sheet.mergeCells(`I${rowNum}:J${rowNum}`);
  rentalRow.getCell(9).value = billing.baseAmount;
  rentalRow.getCell(9).numFmt = '#,##,##0.00';
  rentalRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
  rowNum++;

  // Extra Days
  if (billing.extraDays > 0) {
    const extraDaysRow = sheet.getRow(rowNum);
    sheet.mergeCells(`A${rowNum}:H${rowNum}`);
    extraDaysRow.getCell(1).value = `Extra Days ${String(billing.extraDays).padStart(2, '0')} Days @ Rs.${billing.extraDayRate}`;
    extraDaysRow.getCell(1).font = { size: 10 };

    sheet.mergeCells(`I${rowNum}:J${rowNum}`);
    extraDaysRow.getCell(9).value = billing.extraDaysAmount;
    extraDaysRow.getCell(9).numFmt = '#,##,##0.00';
    extraDaysRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    rowNum++;
  }

  // Extra Hours
  if (billing.totalExtraHours > 0) {
    const extraHoursRow = sheet.getRow(rowNum);
    sheet.mergeCells(`A${rowNum}:H${rowNum}`);
    extraHoursRow.getCell(1).value = `Extra ${billing.totalExtraHours.toFixed(1)} Hours @ Rs.${billing.extraHourRate}.00 Per Hour`;
    extraHoursRow.getCell(1).font = { size: 10 };

    sheet.mergeCells(`I${rowNum}:J${rowNum}`);
    extraHoursRow.getCell(9).value = billing.extraHoursAmount;
    extraHoursRow.getCell(9).numFmt = '#,##,##0.00';
    extraHoursRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    rowNum++;
  }

  // Extra KMs
  if (billing.extraKms > 0) {
    const extraKmsRow = sheet.getRow(rowNum);
    sheet.mergeCells(`A${rowNum}:H${rowNum}`);
    extraKmsRow.getCell(1).value = `Extra ${billing.extraKms} Kms @ Rs.${billing.extraKmRate} Per Km`;
    extraKmsRow.getCell(1).font = { size: 10 };

    sheet.mergeCells(`I${rowNum}:J${rowNum}`);
    extraKmsRow.getCell(9).value = billing.extraKmsAmount;
    extraKmsRow.getCell(9).numFmt = '#,##,##0.00';
    extraKmsRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    rowNum++;
  }

  rowNum++;

  // Sub Total
  const subTotalRow = sheet.getRow(rowNum);
  sheet.mergeCells(`A${rowNum}:H${rowNum}`);
  subTotalRow.getCell(1).value = 'Sub Total';
  subTotalRow.getCell(1).font = { bold: true, size: 11 };

  sheet.mergeCells(`I${rowNum}:J${rowNum}`);
  subTotalRow.getCell(9).value = billing.totalAmount;
  subTotalRow.getCell(9).numFmt = '#,##,##0.00';
  subTotalRow.getCell(9).font = { bold: true, size: 11 };
  subTotalRow.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
  rowNum += 2;

  // Amount in Words
  const wordsRow = sheet.getRow(rowNum);
  sheet.mergeCells(`A${rowNum}:J${rowNum}`);
  wordsRow.getCell(1).value = `Rupees : ${billing.amountInWords} Only`;
  wordsRow.getCell(1).font = { italic: true, size: 10 };
  wordsRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as any;
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || 'Unknown';
}
