import { IDriverSalaryCalculation, ITripsheetSummary } from '../types';

/**
 * Constants for salary calculation
 */
export const SALARY_CONSTANTS = {
  BASE_SALARY: 20000,
  BASE_DAYS: 22,
  EXTRA_DAY_RATE: 909,
  BASE_HOURS_PER_DAY: 12,
  EXTRA_HOUR_RATE: 80,
};

/**
 * Convert number to Indian words format
 * @param num - The number to convert
 * @returns Number in Indian words
 */
export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function convertLessThanHundred(n: number): string {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 100) return convertLessThanHundred(n);
    return (
      ones[Math.floor(n / 100)] +
      ' Hundred' +
      (n % 100 ? ' ' + convertLessThanHundred(n % 100) : '')
    );
  }

  let result = '';
  let n = Math.floor(num);

  // Crores (10,000,000)
  if (n >= 10000000) {
    result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }

  // Lakhs (100,000)
  if (n >= 100000) {
    result += convertLessThanHundred(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }

  // Thousands (1,000)
  if (n >= 1000) {
    result += convertLessThanHundred(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }

  // Hundreds
  if (n > 0) {
    result += convertLessThanThousand(n);
  }

  return result.trim() + ' Rupees Only';
}

/**
 * Calculate driver salary based on tripsheet summary
 * @param summary - Tripsheet summary with working days and hours
 * @returns Salary calculation breakdown
 */
export function calculateDriverSalary(
  summary: ITripsheetSummary
): IDriverSalaryCalculation {
  const { totalWorkingDays, totalHours, totalDriverExtraHours } = summary;

  // Calculate extra days
  const extraDays = Math.max(0, totalWorkingDays - SALARY_CONSTANTS.BASE_DAYS);
  const extraDaysAmount = extraDays * SALARY_CONSTANTS.EXTRA_DAY_RATE;

  // Calculate extra hours amount
  const extraHoursAmount =
    totalDriverExtraHours * SALARY_CONSTANTS.EXTRA_HOUR_RATE;

  // Calculate total salary
  const totalSalary =
    SALARY_CONSTANTS.BASE_SALARY + extraDaysAmount + extraHoursAmount;

  // Convert to words
  const amountInWords = numberToIndianWords(totalSalary);

  return {
    totalWorkingDays,
    baseDays: SALARY_CONSTANTS.BASE_DAYS,
    extraDays,
    baseSalary: SALARY_CONSTANTS.BASE_SALARY,
    extraDayRate: SALARY_CONSTANTS.EXTRA_DAY_RATE,
    extraDaysAmount,
    totalHours,
    totalDriverExtraHours,
    extraHourRate: SALARY_CONSTANTS.EXTRA_HOUR_RATE,
    extraHoursAmount,
    totalSalary,
    amountInWords,
  };
}

/**
 * Format amount to Indian currency format
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number to Indian number system (with lakhs, crores)
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}
