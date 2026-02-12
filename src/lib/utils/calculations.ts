import { VehicleTypeCode } from '@/backend/types';

/**
 * Calculate total hours from time strings
 * Handles midnight crossing
 * @param startTime - Format: "HH:mm" (e.g., "08:00")
 * @param endTime - Format: "HH:mm" (e.g., "23:00")
 * @returns Total hours (e.g., 15.0)
 */
export function calculateTotalHours(
  startTime: string,
  endTime: string
): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  let endMinutes = endHour * 60 + endMin;

  // Handle crossing midnight
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const totalMinutes = endMinutes - startMinutes;
  const totalHours = totalMinutes / 60;

  return Math.round(totalHours * 10) / 10; // Round to 1 decimal
}

/**
 * Extra hours for CLIENT BILLING (above 10)
 * @param totalHours - Total hours worked
 * @returns Extra hours above 10
 */
export function calculateExtraHours(totalHours: number): number {
  return Math.max(0, totalHours - 10);
}

/**
 * Extra hours for DRIVER SALARY (above 12)
 * @param totalHours - Total hours worked
 * @returns Extra hours above 12
 */
export function calculateDriverExtraHours(totalHours: number): number {
  return Math.max(0, totalHours - 12);
}

/**
 * Calculate extra hours billing amount based on vehicle type
 * @param extraHours - Extra hours above 10
 * @param vehicleTypeCode - Vehicle type code (DZIRE, BOLERO, CRYSTA)
 * @returns Billing amount
 */
export function calculateExtraHoursBilling(
  extraHours: number,
  vehicleTypeCode: VehicleTypeCode
): number {
  const rates: Record<VehicleTypeCode, number> = {
    [VehicleTypeCode.DZIRE]: 250,
    [VehicleTypeCode.BOLERO]: 275,
    [VehicleTypeCode.CRYSTA]: 300,
  };
  return extraHours * rates[vehicleTypeCode];
}

/**
 * Get extra hour rate for a vehicle type
 * @param vehicleTypeCode - Vehicle type code
 * @returns Rate per hour
 */
export function getExtraHourRate(vehicleTypeCode: VehicleTypeCode): number {
  const rates: Record<VehicleTypeCode, number> = {
    [VehicleTypeCode.DZIRE]: 250,
    [VehicleTypeCode.BOLERO]: 275,
    [VehicleTypeCode.CRYSTA]: 300,
  };
  return rates[vehicleTypeCode];
}

/**
 * Calculate driver salary
 * @param totalWorkingDays - Total working days in month
 * @param totalDriverExtraHours - Sum of hours above 12 per day
 * @returns Salary breakdown
 */
export function calculateDriverSalary(
  totalWorkingDays: number,
  totalDriverExtraHours: number
) {
  const BASE_SALARY = 20000;
  const BASE_DAYS = 22;
  const EXTRA_DAY_RATE = 909;
  const EXTRA_HOUR_RATE = 80;

  const extraDays = Math.max(0, totalWorkingDays - BASE_DAYS);
  const extraDaysAmount = extraDays * EXTRA_DAY_RATE;
  const extraHoursAmount = totalDriverExtraHours * EXTRA_HOUR_RATE;
  const totalSalary = BASE_SALARY + extraDaysAmount + extraHoursAmount;

  return {
    baseSalary: BASE_SALARY,
    baseDays: BASE_DAYS,
    totalWorkingDays,
    extraDays,
    extraDayRate: EXTRA_DAY_RATE,
    extraDaysAmount,
    totalDriverExtraHours,
    extraHourRate: EXTRA_HOUR_RATE,
    extraHoursAmount,
    totalSalary,
  };
}

/**
 * Get greeting based on time of day
 * @returns Greeting string
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Format number with Indian number system
 * @param num - Number to format
 * @returns Formatted string (e.g., "1,23,456")
 */
export function formatIndianNumber(num: number): string {
  return num.toLocaleString('en-IN');
}

/**
 * Format currency in Indian Rupees
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "₹1,23,456")
 */
export function formatCurrency(amount: number): string {
  return '₹' + formatIndianNumber(Math.round(amount));
}

/**
 * Format hours with 1 decimal place
 * @param hours - Hours to format
 * @returns Formatted string (e.g., "15.5 hrs")
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Format kilometers
 * @param km - Kilometers to format
 * @returns Formatted string (e.g., "1,234 km")
 */
export function formatKilometers(km: number): string {
  return `${formatIndianNumber(km)} km`;
}

/**
 * Format fuel litres
 * @param litres - Litres to format
 * @returns Formatted string (e.g., "45.5 L")
 */
export function formatFuel(litres: number): string {
  return `${litres.toFixed(1)} L`;
}

/**
 * Parse time string and ensure HH:mm format
 * @param time - Time string
 * @returns Formatted time "HH:mm"
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map((v) => v.trim());
  const h = hours.padStart(2, '0');
  const m = (minutes || '00').padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Validate time format HH:mm
 * @param time - Time string
 * @returns Boolean indicating if valid
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Get all dates in a month
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Array of Date objects
 */
export function getDatesInMonth(month: number, year: number): Date[] {
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month - 1, day));
  }

  return dates;
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns Boolean
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns Boolean
 */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date > today;
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns Formatted string (e.g., "Thu, December 11, 2025")
 */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date short
 * @param date - Date to format
 * @returns Formatted string (e.g., "11 Dec")
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Get day name
 * @param date - Date object
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(date: Date): string {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[date.getDay()];
}

/**
 * Get short day name
 * @param date - Date object
 * @returns Short day name (e.g., "Mon")
 */
export function getShortDayName(date: Date): string {
  return getDayName(date).slice(0, 3);
}

/**
 * Check if date is Sunday
 * @param date - Date to check
 * @returns Boolean
 */
export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

/**
 * Check if date is Saturday
 * @param date - Date to check
 * @returns Boolean
 */
export function isSaturday(date: Date): boolean {
  return date.getDay() === 6;
}
