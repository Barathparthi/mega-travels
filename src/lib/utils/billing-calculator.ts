import { ITripsheet, IVehicleType, IBillingCalculation } from '@/backend/types';

/**
 * Number to Indian words converter
 * Supports up to crores (10,000,000)
 */
export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const tenDigit = Math.floor(n / 10);
      const oneDigit = n % 10;
      return tens[tenDigit] + (oneDigit > 0 ? ' ' + ones[oneDigit] : '');
    }
    const hundredDigit = Math.floor(n / 100);
    const remainder = n % 100;
    return (
      ones[hundredDigit] +
      ' Hundred' +
      (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '')
    );
  }

  let result = '';
  let crore = Math.floor(num / 10000000);
  num %= 10000000;

  let lakh = Math.floor(num / 100000);
  num %= 100000;

  let thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) {
    result += convertLessThanThousand(crore) + ' Crore ';
  }

  if (lakh > 0) {
    result += convertLessThanThousand(lakh) + ' Lakh ';
  }

  if (thousand > 0) {
    result += convertLessThanThousand(thousand) + ' Thousand ';
  }

  if (num > 0) {
    result += convertLessThanThousand(num);
  }

  return result.trim() + ' Only';
}

/**
 * Calculate client billing based on tripsheet data and vehicle type
 * This is for CLIENT billing, not driver salary
 */
export function calculateBilling(
  tripsheet: any,
  vehicleType: any
): IBillingCalculation {
  // Ensure vehicleType is an object and has billingRules
  if (!vehicleType || typeof vehicleType !== 'object' || Array.isArray(vehicleType)) {
    throw new Error(`Invalid vehicleType: expected object, got ${typeof vehicleType}`);
  }
  
  const rules = vehicleType.billingRules || {};
  const summary = tripsheet.summary || {};

  // Days calculation
  const totalWorkingDays = summary.totalWorkingDays;
  const baseDays = rules.baseDays || 20;
  const extraDays = Math.max(0, totalWorkingDays - baseDays);
  const baseAmount = rules.baseAmount;
  const extraDayRate = rules.extraDayRate;
  const extraDaysAmount = extraDays * extraDayRate;

  // KMs calculation
  // Each working day includes 100 kms in the base price (2500 per day includes 10 hours + 100 kms)
  // Extra KMs = Total KMs - (Number of working days × 100)
  const totalKms = summary.totalKms;
  const baseKmsForWorkingDays = totalWorkingDays * 100;
  const extraKms = Math.max(0, totalKms - baseKmsForWorkingDays);
  const extraKmRate = rules.extraKmRate;
  const extraKmsAmount = extraKms * extraKmRate;

  // Hours calculation
  // Use the pre-calculated totalExtraHours from tripsheet summary
  const totalHours = summary.totalHours;
  const baseHoursPerDay = rules.baseHoursPerDay || 10;
  const totalBaseHours = totalWorkingDays * baseHoursPerDay;
  const totalExtraHours = summary.totalExtraHours; // Already calculated as sum of (daily - base)
  const extraHourRate = rules.extraHourRate;
  const extraHoursAmount = totalExtraHours * extraHourRate;

  // Totals
  const subTotal = baseAmount + extraDaysAmount + extraKmsAmount + extraHoursAmount;
  const adjustments = 0; // Default, can be modified later
  const totalAmount = subTotal + adjustments;
  const amountInWords = numberToIndianWords(totalAmount);

  return {
    totalWorkingDays,
    baseDays,
    extraDays,
    baseAmount,
    extraDayRate,
    extraDaysAmount,

    totalKms,
    baseKms: baseKmsForWorkingDays, // Base KMs = working days × 100
    extraKms,
    extraKmRate,
    extraKmsAmount,

    totalHours,
    baseHoursPerDay,
    totalBaseHours,
    totalExtraHours,
    extraHourRate,
    extraHoursAmount,

    subTotal,
    adjustments,
    totalAmount,
    amountInWords,
  };
}

/**
 * Format currency in Indian format (₹1,00,000)
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get month name from number
 */
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}
