/**
 * Indian Number Formatting Utilities
 */

/**
 * Format number with Indian numbering system (lakhs, crores)
 * @param num - Number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatIndianNumber(
  num: number,
  options?: {
    decimals?: number;
    compact?: boolean;
  }
): string {
  const { decimals = 0, compact = false } = options || {};

  if (compact) {
    return formatIndianCompact(num);
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format currency with Indian Rupee symbol
 * @param amount - Amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatIndianCurrency(
  amount: number,
  options?: {
    decimals?: number;
    compact?: boolean;
    showSymbol?: boolean;
  }
): string {
  const { decimals = 0, compact = false, showSymbol = true } = options || {};

  if (compact) {
    const formatted = formatIndianCompact(amount);
    return showSymbol ? `₹${formatted}` : formatted;
  }

  return new Intl.NumberFormat('en-IN', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Format number in compact form (K, L, Cr)
 * @param num - Number to format
 * @returns Compact formatted string
 */
export function formatIndianCompact(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 10000000) {
    // Crores
    return `${sign}${(absNum / 10000000).toFixed(2)}Cr`;
  } else if (absNum >= 100000) {
    // Lakhs
    return `${sign}${(absNum / 100000).toFixed(2)}L`;
  } else if (absNum >= 1000) {
    // Thousands
    return `${sign}${(absNum / 1000).toFixed(2)}K`;
  }

  return `${sign}${absNum.toFixed(0)}`;
}

/**
 * Convert number to Indian words
 * @param num - Number to convert
 * @param includePaisa - Include decimal part as paisa
 * @returns Number in words
 */
export function numberToIndianWords(
  num: number,
  includePaisa: boolean = false
): string {
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
  let rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);

  // Crores (10,000,000)
  if (rupees >= 10000000) {
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + ' Crore ';
    rupees %= 10000000;
  }

  // Lakhs (100,000)
  if (rupees >= 100000) {
    result += convertLessThanHundred(Math.floor(rupees / 100000)) + ' Lakh ';
    rupees %= 100000;
  }

  // Thousands (1,000)
  if (rupees >= 1000) {
    result += convertLessThanHundred(Math.floor(rupees / 1000)) + ' Thousand ';
    rupees %= 1000;
  }

  // Hundreds
  if (rupees > 0) {
    result += convertLessThanThousand(rupees);
  }

  result = result.trim() + ' Rupees';

  if (includePaisa && paisa > 0) {
    result += ' and ' + convertLessThanHundred(paisa) + ' Paisa';
  }

  return result + ' Only';
}

/**
 * Parse Indian formatted number string to number
 * @param str - Formatted number string (e.g., "1,23,456")
 * @returns Parsed number
 */
export function parseIndianNumber(str: string): number {
  if (!str) return 0;
  // Remove currency symbols, commas, and spaces
  const cleaned = str.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Abbreviate large numbers (for compact display)
 * @param num - Number to abbreviate
 * @returns Abbreviated string
 */
export function abbreviateNumber(num: number): string {
  return formatIndianCompact(num);
}
