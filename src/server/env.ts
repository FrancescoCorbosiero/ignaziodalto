// Runtime configuration, read from the environment (documented in .env.example).
import path from 'node:path';

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

const vatBasisPoints = Math.round(Math.min(100, Math.max(0, Number(str('VAT_RATE', '22').replace(',', '.')) || 0)) * 100);

export const env = {
  /** scs-b2b catalog API (docs/10 of scs-b2b). Empty = use the fixture. */
  apiUrl: str('CATALOG_API_URL'),
  apiToken: str('CATALOG_API_TOKEN'),
  fixture: path.resolve(str('CATALOG_FIXTURE', 'fixtures/catalog.json')),
  refreshSeconds: Math.max(60, int('CATALOG_REFRESH_SECONDS', 300)),
  /** Added to every size's scs-b2b list price. */
  markupCents: parseEuroCents(str('PRICE_MARKUP_EUR', '3.50')),
  /** VAT added after the markup, in basis points: "22" -> 2200. 0 = net prices. */
  vatBasisPoints: vatBasisPoints,
  priceNote: str('PRICE_NOTE', vatBasisPoints > 0 ? 'Prezzi IVA inclusa' : 'Prezzi IVA esclusa'),
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
  tagline: str('SITE_TAGLINE', 'Sneakers originali, disponibilità aggiornata'),
  whatsapp: str('CONTACT_WHATSAPP').replace(/[^\d]/g, ''),
  email: str('CONTACT_EMAIL'),
  instagram: str('CONTACT_INSTAGRAM').replace(/^@/, ''),
};

export type PublicConfig = {
  siteName: string;
  priceNote: string;
  whatsapp: string;
  email: string;
  lowStock: number;
};

/** What the browser may know about the configuration. */
export function publicConfig(): PublicConfig {
  return {
    siteName: env.siteName,
    priceNote: env.priceNote,
    whatsapp: env.whatsapp,
    email: env.email,
    lowStock: env.lowStock,
  };
}
