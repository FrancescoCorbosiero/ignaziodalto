import { LOCALE_TAG, t, type Locale } from '../i18n.ts';

const EUR: Record<Locale, Intl.NumberFormat> = {
  it: new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }),
  en: new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }),
};

/** 7850 -> "78,50 €" (it) / "€78.50" (en) */
export function euro(cents: number, locale: Locale = 'it'): string {
  return EUR[locale].format(cents / 100);
}

/** "36 2/3" -> 36.667, for sorting sizes. */
export function sizeValue(eu: string): number {
  const m = eu.trim().match(/^(\d+(?:[.,]\d+)?)(?:\s+(\d)\/(\d))?/);
  if (!m) return Number.POSITIVE_INFINITY;
  const base = parseFloat(m[1].replace(',', '.'));
  return m[2] ? base + Number(m[2]) / Number(m[3]) : base;
}

export function bySize(a: string, b: string): number {
  return sizeValue(a) - sizeValue(b) || a.localeCompare(b);
}

/** Lowercase, no accents: for search. */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function productPath(sku: string): string {
  return `/p/${encodeURIComponent(sku)}`;
}

/** "oggi alle 14:05", "ieri alle 09:10", "12 nov alle 18:00" (Europe/Rome). */
export function when(iso: string | null, locale: Locale = 'it', now = new Date()): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tz = 'Europe/Rome';
  const tag = LOCALE_TAG[locale];
  const day = (x: Date) => x.toLocaleDateString('it-IT', { timeZone: tz });
  const time = d.toLocaleTimeString(tag, { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now.getTime() - 86_400_000);
  const tr = t(locale);
  if (day(d) === day(now)) return tr.today(time);
  if (day(d) === day(yesterday)) return tr.yesterday(time);
  return tr.onDay(d.toLocaleDateString(tag, { timeZone: tz, day: 'numeric', month: 'short' }), time);
}
