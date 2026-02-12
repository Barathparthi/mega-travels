import type { IVehicleType, ITripsheet, IBillingCalculation } from '@/backend/types';

/**
 * Calculate billing for a tripsheet based on vehicle type billing rules
 */
export function calculateBilling(
  tripsheet: ITripsheet,
  vehicleType: IVehicleType
): IBillingCalculation {
  // Get billing rules with defaults if missing
  const billingRules = vehicleType?.billingRules || {};
  const summary = tripsheet?.summary || {
    totalWorkingDays: 0,
    totalKms: 0,
    totalHours: 0,
    totalExtraHours: 0,
  };

  // Base amount (fixed monthly rental) - default to 55000 if not set
  const baseAmount = billingRules.baseAmount || 55000;
  const baseDays = billingRules.baseDays || 22;

  // Calculate extra days
  const extraDays = Math.max(0, summary.totalWorkingDays - baseDays);
  const extraDayRate = billingRules.extraDayRate || 2500;
  const extraDaysAmount = extraDays * extraDayRate;

  // Calculate extra KMs
  // Each working day includes 100 kms in the base price (2500 per day includes 10 hours + 100 kms)
  // Extra KMs = Total KMs - (Number of working days × 100)
  const baseKmsForWorkingDays = summary.totalWorkingDays * 100;
  const extraKms = Math.max(0, summary.totalKms - baseKmsForWorkingDays);
  const extraKmRate = billingRules.extraKmRate || 10;
  const extraKmsAmount = extraKms * extraKmRate;

  // Calculate extra hours (hours above base hours per day)
  const baseHoursPerDay = billingRules.baseHoursPerDay || 10;
  const totalHours = summary.totalHours || 0;
  const totalBaseHours = summary.totalWorkingDays * baseHoursPerDay;
  const totalExtraHours = summary.totalExtraHours || 0;
  const extraHourRate = billingRules.extraHourRate || 100;
  const extraHoursAmount = totalExtraHours * extraHourRate;

  // Calculate totals
  const subTotal = baseAmount + extraDaysAmount + extraKmsAmount + extraHoursAmount;
  const adjustments = 0; // Default, can be modified later
  const totalAmount = subTotal + adjustments;

  // Convert amount to words
  const amountInWords = numberToIndianWords(totalAmount);

  return {
    totalWorkingDays: summary.totalWorkingDays || 0,
    baseDays,
    extraDays,
    baseAmount,
    extraDayRate,
    extraDaysAmount,
    totalKms: summary.totalKms || 0,
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
 * Convert number to Indian words (Rupees)
 */
export function numberToIndianWords(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  let words = '';

  if (crore > 0) {
    words += convertTwoDigit(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigit(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigit(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (num > 0) {
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += ' ' + ones[num % 10];
      }
    }
  }

  return words.trim();
}

function convertTwoDigit(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  if (num < 20) {
    return ones[num];
  }

  const ten = Math.floor(num / 10);
  const one = num % 10;

  return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
}

/**
 * Format number with Indian number system (lakhs, crores)
 */
export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian number system (no currency symbol)
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
