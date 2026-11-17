import { euro } from './format.ts';
import { t, type Locale } from '../i18n.ts';
import type { Product } from './types.ts';

export interface ContactConfig {
  siteName: string;
  whatsapp: string;
  email: string;
}

/** WhatsApp first, e-mail as a fallback, nothing if neither is set. */
export function contactHref(c: ContactConfig, text: string, locale: Locale = 'it'): string | null {
  if (c.whatsapp) return `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}`;
  if (c.email) return `mailto:${c.email}?subject=${encodeURIComponent(t(locale).mailSubject(c.siteName))}&body=${encodeURIComponent(text)}`;
  return null;
}

export function contactLabel(c: ContactConfig): string {
  return c.whatsapp ? 'WhatsApp' : 'e-mail';
}

export interface Line {
  p: Product;
  eu?: string;
}

/** The message a customer sends: one line per pair, with size and price. */
export function requestText(lines: Line[], origin: string, locale: Locale = 'it'): string {
  const tr = t(locale);
  const rows = lines.map(({ p, eu }) => {
    const size = eu ? p.sizes.find((s) => s.eu === eu) : undefined;
    const price = size ? euro(size.price, locale) : `${tr.from} ${euro(p.from, locale)}`;
    return `• ${p.name} (${p.sku}) — ${size ? tr.msgSize(size.eu) : tr.msgNoSize} — ${price}\n  ${origin}/p/${encodeURIComponent(p.sku)}`;
  });
  const intro = lines.length === 1 ? tr.msgOne : tr.msgMany(lines.length);
  return `${intro}\n\n${rows.join('\n')}\n\n${tr.msgEnd}`;
}
