import { format } from 'date-fns';

/**
 * Format number to Indian currency format
 * @param num - Number to format
 * @returns Formatted currency (e.g., "₹1,20,270.00")
 */
export function formatIndianCurrency(num: number): string {
  const formatted = num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatted;
}

/**
 * Format date to Indian format
 * @param date - Date object
 * @returns Formatted date (e.g., "01-Sep-25")
 */
export function formatDate(date: Date): string {
  return format(date, 'dd-MMM-yy');
}

/**
 * Get month name from month number
 * @param month - Month number (1-12)
 * @returns Month name (e.g., "September")
 */
export function getMonthName(month: number): string {
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

  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12');
  }

  return months[month - 1];
}

/**
 * Generate serial number with prefix
 * @param prefix - Prefix (e.g., "TS", "BILL")
 * @param year - Year (e.g., 2025)
 * @param sequence - Sequence number (e.g., 1)
 * @returns Serial number (e.g., "TS-2025-0001")
 */
export function generateSerialNumber(
  prefix: string,
  year: number,
  sequence: number
): string {
  const paddedSequence = String(sequence).padStart(4, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Calculate days between two dates (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(
    (endDate.getTime() - startDate.getTime()) / oneDay
  );
  return diffDays + 1; // Inclusive
}

/**
 * Get date range for a month
 * @param month - Month number (1-12)
 * @param year - Year
 * @returns Array of dates for the month
 */
export function getMonthDateRange(month: number, year: number): Date[] {
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month - 1, day));
  }

  return dates;
}

/**
 * Validate vehicle number format
 * @param vehicleNumber - Vehicle number
 * @returns Boolean indicating if valid
 */
export function isValidVehicleNumber(vehicleNumber: string): boolean {
  // Indian vehicle number format: XX 00X 0000
  const regex = /^[A-Z]{2}\s?\d{1,2}[A-Z]{0,2}\s?\d{4}$/;
  return regex.test(vehicleNumber.toUpperCase());
}

/**
 * Format vehicle number to standard format
 * @param vehicleNumber - Vehicle number
 * @returns Formatted vehicle number (e.g., "TN 11U 0474")
 */
export function formatVehicleNumber(vehicleNumber: string): string {
  const cleaned = vehicleNumber.replace(/\s/g, '').toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})(\d{1,2})([A-Z]{0,2})(\d{4})$/);

  if (!match) {
    return vehicleNumber.toUpperCase();
  }

  const [, state, district, series, number] = match;
  return `${state} ${district}${series} ${number}`;
}
