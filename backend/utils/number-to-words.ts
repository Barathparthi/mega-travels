/**
 * Convert number to Indian English words
 * Supports: Ones, Tens, Hundreds, Thousands, Lakhs, Crores
 * @param num - Number to convert
 * @returns Words representation ending with "Only"
 */
export function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Only';

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

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';

    if (n < 10) {
      return ones[n];
    } else if (n < 20) {
      return teens[n - 10];
    } else if (n < 100) {
      const tenPart = tens[Math.floor(n / 10)];
      const onePart = ones[n % 10];
      return `${tenPart}${onePart ? ' ' + onePart : ''}`;
    } else {
      const hundredPart = ones[Math.floor(n / 100)] + ' Hundred';
      const remainder = n % 100;
      return `${hundredPart}${
        remainder ? ' ' + convertLessThanThousand(remainder) : ''
      }`;
    }
  }

  function convertIndian(n: number): string {
    if (n === 0) return '';

    // Crores (10,000,000)
    if (n >= 10000000) {
      const crores = Math.floor(n / 10000000);
      const remainder = n % 10000000;
      return `${convertLessThanThousand(crores)} Crore${
        remainder ? ' ' + convertIndian(remainder) : ''
      }`;
    }

    // Lakhs (100,000)
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000);
      const remainder = n % 100000;
      return `${convertLessThanThousand(lakhs)} Lakh${
        remainder ? ' ' + convertIndian(remainder) : ''
      }`;
    }

    // Thousands
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      return `${convertLessThanThousand(thousands)} Thousand${
        remainder ? ' ' + convertLessThanThousand(remainder) : ''
      }`;
    }

    return convertLessThanThousand(n);
  }

  const integerPart = Math.floor(num);
  const words = convertIndian(integerPart);

  return `${words} Only`;
}
