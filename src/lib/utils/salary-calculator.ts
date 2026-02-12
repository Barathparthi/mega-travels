/**
 * Frontend Salary Calculator Utilities
 * Mirrors the backend calculation logic for client-side use
 */

export const SALARY_CONSTANTS = {
  BASE_SALARY: 20000,
  BASE_DAYS: 22,
  EXTRA_DAY_RATE: 909,
  BASE_HOURS_PER_DAY: 12,
  EXTRA_HOUR_RATE: 80,
};

export interface SalaryCalculation {
  totalWorkingDays: number;
  baseDays: number;
  extraDays: number;
  baseSalary: number;
  extraDayRate: number;
  extraDaysAmount: number;
  totalHours: number;
  totalDriverExtraHours: number;
  extraHourRate: number;
  extraHoursAmount: number;
  totalSalary: number;
  amountInWords: string;
}

/**
 * Convert number to Indian words format
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
 * Calculate driver salary preview (client-side)
 */
export function calculateSalaryPreview(
  totalWorkingDays: number,
  totalDriverExtraHours: number,
  totalHours: number = 0
): SalaryCalculation {
  const extraDays = Math.max(0, totalWorkingDays - SALARY_CONSTANTS.BASE_DAYS);
  const extraDaysAmount = extraDays * SALARY_CONSTANTS.EXTRA_DAY_RATE;
  const extraHoursAmount =
    totalDriverExtraHours * SALARY_CONSTANTS.EXTRA_HOUR_RATE;
  const totalSalary =
    SALARY_CONSTANTS.BASE_SALARY + extraDaysAmount + extraHoursAmount;

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
    amountInWords: numberToIndianWords(totalSalary),
  };
}

/**
 * Format amount to Indian currency format
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number to Indian number system
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Get month name from number
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
  return months[month - 1] || '';
}

/**
 * Format month-year string
 */
export function formatMonthYear(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`;
}
