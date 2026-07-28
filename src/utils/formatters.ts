import { Currency } from '../types';

/**
 * Convert Kurdish/Arabic Eastern digits (٠١٢٣٤٥٦٧٨٩) to standard English digits (0123456789)
 */
export function normalizeDigits(str: string): string {
  if (!str) return '';
  const easternDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  return str
    .split('')
    .map((ch) => {
      const eIdx = easternDigits.indexOf(ch);
      if (eIdx !== -1) return String(eIdx);
      const pIdx = persianDigits.indexOf(ch);
      if (pIdx !== -1) return String(pIdx);
      return ch;
    })
    .join('');
}

/**
 * Format currency amount based on currency type (IQD or USD) and exchange rate.
 * Amounts are internally stored in IQD.
 */
export function formatCurrency(
  amountInIqd: number,
  currency: Currency,
  exchangeRate: number = 1530 // 153,000 IQD per 100 USD = 1530 per 1 USD
): string {
  if (currency === 'USD') {
    const usdAmount = amountInIqd / (exchangeRate || 1530);
    return `$${usdAmount.toFixed(2)}`;
  }

  // IQD formatting
  return `${Math.round(amountInIqd).toLocaleString('en-US')} د.ع`;
}

/**
 * Format a raw date string to localized format
 */
export function formatDate(isoString: string, lang: 'ku' | 'en'): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  if (lang === 'ku') {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert USD to IQD
 */
export function usdToIqd(usdAmount: number, exchangeRate: number = 1530): number {
  return Math.round(usdAmount * (exchangeRate || 1530));
}

/**
 * Generate unique random barcode if user doesn't specify one
 */
export function generateBarcode(): string {
  const prefix = '86900';
  const random = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${random}`;
}
