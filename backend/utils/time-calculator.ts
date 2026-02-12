import { DayType } from '../types';

/**
 * Calculate total hours between two times
 * Handles times that cross midnight
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
 * Calculate extra hours beyond base hours
 * @param totalHours - Total hours worked
 * @param baseHours - Base hours per day (default 10)
 * @returns Extra hours (minimum 0)
 */
export function calculateExtraHours(
  totalHours: number,
  baseHours: number = 10
): number {
  const extra = totalHours - baseHours;
  return Math.max(0, Math.round(extra * 10) / 10);
}

/**
 * Format time string to HH:mm format
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
 * Get day type based on date
 * @param date - Date object
 * @returns Day type: "working" | "sunday" | "saturday"
 */
export function getDayType(date: Date): DayType {
  const day = date.getDay();

  if (day === 0) return DayType.SUNDAY;
  if (day === 6) return DayType.SATURDAY;
  return DayType.WORKING;
}

/**
 * Get day name from date
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
 * Validate time format HH:mm
 * @param time - Time string
 * @returns Boolean indicating if valid
 */
export function isValidTime(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Calculate driver extra hours beyond 12 hours (for salary)
 * @param totalHours - Total hours worked
 * @returns Extra hours above 12 (minimum 0)
 */
export function calculateDriverExtraHours(totalHours: number): number {
  const extra = totalHours - 12;
  return Math.max(0, Math.round(extra * 10) / 10);
}
