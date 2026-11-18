// Runtime configuration, read from the environment (documented in .env.example).
import path from 'node:path';
import { t, type Locale } from '../i18n.ts';

const str = (k: string, d = ''): string => {
  const v = process.env[k];
  return v !== undefined && v.trim() !== '' ? v.trim() : d;
};
const int = (k: string, d: number): number => {
  const n = Number(str(k));
  return Number.isFinite(n) && str(k) !== '' ? n : d;
};

/** "3.50" or "3,50" -> 350 cents. */
export function parseEuroCents(v: string): number {
  const n = Number(v.replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error(`Importo non valido: "${v}"`);
  return Math.round(n * 100);
}

/** "22" -> 2200 basis points, clamped to 0..100%. */
const rate = (k: string, d: string): number => Math.round(Math.min(100, Math.max(0, Number(str(k, d).replace(',', '.')) || 0)) * 100);
const vatBasisPoints = rate('VAT_RATE', '0');
const listVat = str('LIST_PRICES_INCLUDE_VAT', 'auto').toLowerCase();

export const env = {
  /** scs-b2b catalog API (docs/10 of scs-b2b). Empty = use the fixture. */
  apiUrl: str('CATALOG_API_URL'),
  apiToken: str('CATALOG_API_TOKEN'),
  fixture: path.resolve(str('CATALOG_FIXTURE', 'fixtures/catalog.json')),
  refreshSeconds: Math.max(60, int('CATALOG_REFRESH_SECONDS', 300)),
  /** Added to the taxable amount of every size's scs-b2b list price. */
  markupCents: parseEuroCents(str('PRICE_MARKUP_EUR', '3.00')),
  /** VAT added after the markup, in basis points: "22" -> 2200. 0 = net prices. */
  vatBasisPoints: vatBasisPoints,
  /** Does scs-b2b's list price include VAT? "auto" = trust the API's `vat_included`. */
  listIncludesVat: (listVat === 'true' || listVat === 'yes' || listVat === '1' ? true : listVat === 'false' || listVat === 'no' || listVat === '0' ? false : 'auto') as boolean | 'auto',
  /** The VAT rate inside scs-b2b's list price when it includes VAT, basis points. */
  listVatBasisPoints: rate('LIST_VAT_RATE', '22'),
  /** Fixed note next to prices (any language); empty = the dictionary's, per language. */
  priceNote: str('PRICE_NOTE'),
  dataDir: path.resolve(str('DATA_DIR', 'data')),
  newDays: Math.max(1, int('NEW_DAYS', 14)),
  /** Pictures made at once (download + resize): keep it low on a small VPS. */
  imageConcurrency: Math.max(1, int('IMAGE_CONCURRENCY', 2)),
  /** A visitor waits at most this long for a picture, then gets the placeholder. */
  imageWaitMs: Math.max(500, int('IMAGE_WAIT_MS', 2500)),
  /** At or below this many pairs a size is "ultimi pezzi". */
  lowStock: Math.max(0, int('LOW_STOCK_MAX', 2)),

  /** Public address, for the links inside the messages customers send. */
  siteUrl: str('SITE_URL', 'https://ignaziodalto.alpacode.it').replace(/\/+$/, ''),
  siteName: str('SITE_NAME', 'Ignazio Dalto'),
  /** Fixed tagline (any language); empty = the dictionary's, per language. */
  tagline: str('SITE_TAGLINE'),
  whatsapp: str('CONTACT_WHATSAPP').replace(/[^\d]/g, ''),
  email: str('CONTACT_EMAIL'),
  instagram: str('CONTACT_INSTAGRAM').replace(/^@/, ''),
};

/** The short tag next to every card price ("+ IVA"), empty when prices include VAT. */
export function vatTagFor(locale: Locale): string {
  return env.vatBasisPoints > 0 ? '' : t(locale).vatTag;
}

export function priceNoteFor(locale: Locale): string {
  return env.priceNote || t(locale).priceNote(env.vatBasisPoints > 0);
}

export function taglineFor(locale: Locale): string {
  return env.tagline || t(locale).tagline;
}
