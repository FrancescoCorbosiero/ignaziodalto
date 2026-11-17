const EUR = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

/** 7850 -> "78,50 €" */
export function euro(cents: number): string {
  return EUR.format(cents / 100);
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
export function when(iso: string | null, now = new Date()): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const tz = 'Europe/Rome';
  const day = (x: Date) => x.toLocaleDateString('it-IT', { timeZone: tz });
  const time = d.toLocaleTimeString('it-IT', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (day(d) === day(now)) return `oggi alle ${time}`;
  if (day(d) === day(yesterday)) return `ieri alle ${time}`;
  return `${d.toLocaleDateString('it-IT', { timeZone: tz, day: 'numeric', month: 'short' })} alle ${time}`;
}
