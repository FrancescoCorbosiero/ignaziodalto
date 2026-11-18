// From the scs-b2b API payload to the products this site shows.
// Pure functions: tested in tests/normalize.test.ts.
import { createHash } from 'node:crypto';
import { CATEGORIES, type Category, type Product, type Size } from '../lib/types.ts';
import { bySize } from '../lib/format.ts';

export interface ApiSize {
  size_eu: string;
  size_us: string;
  barcode?: string;
  quantity: number;
  price: string;
}

export interface ApiProduct {
  sku: string;
  name: string;
  brand: string;
  size_category: string;
  image_url: string | null;
  total_quantity: number;
  sizes: ApiSize[];
}

export interface ApiCatalog {
  version: number;
  synced_at: string | null;
  vat_included: boolean;
  products: ApiProduct[];
}

/** First-seen dates, persisted so "Novità" survives restarts. */
export interface Seen {
  /** When the site first loaded a catalog: products seen then are not "new". */
  baseline: string;
  skus: Record<string, string>;
}

export function assertCatalog(data: unknown): ApiCatalog {
  const c = data as ApiCatalog;
  if (!c || typeof c !== 'object' || !Array.isArray(c.products)) {
    throw new Error('Risposta API non valida: manca "products"');
  }
  if (c.version !== 1) throw new Error(`Versione API non supportata: ${String(c.version)}`);
  return c;
}

/** How this site prices a size: taxable amount + markup, then VAT. */
export interface Pricing {
  /** Added to the taxable amount of scs-b2b's list price, cents. */
  markupCents: number;
  /** VAT on top, in basis points (2200 = 22%); 0 = prices shown net. */
  vatBasisPoints: number;
  /** VAT already inside scs-b2b's list price, stripped first; 0 = the list is net. */
  listVatBasisPoints?: number;
}

/** a x num / den, rounded to the cent (half up), integers only. */
const scale = (cents: number, num: number, den: number): number => Math.floor((cents * num * 2 + den) / (den * 2));

/**
 * ("75.00", +300, 22%) -> (7500 + 300) x 1.22 = 9516 cents.
 * A list price that includes VAT is brought back to its taxable amount
 * first ("91.50" incl. 22% -> 75.00). The markup goes on the taxable
 * amount; VAT is applied last, rounded to the cent (half up). Integer
 * cents, never float sums.
 */
export function priceCents(listPrice: string, { markupCents, vatBasisPoints, listVatBasisPoints = 0 }: Pricing): number {
  const m = String(listPrice).trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!m) throw new Error(`Prezzo non valido: "${listPrice}"`);
  const list = Number(m[1]) * 100 + Number((m[2] ?? '0').padEnd(2, '0'));
  const taxable = scale(list, 10_000, 10_000 + listVatBasisPoints) + markupCents;
  return scale(taxable, 10_000 + vatBasisPoints, 10_000);
}

/** Stable key of the supplier image: changes when the feed changes the picture. */
export function imageKey(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 10);
}

export function normalize(
  api: ApiCatalog,
  pricing: Pricing,
  seen: Seen,
  newDays: number,
  now = new Date(),
): { products: Product[]; images: Map<string, string> } {
  const nowIso = now.toISOString();
  const newSince = now.getTime() - newDays * 86_400_000;
  const images = new Map<string, string>();
  const products: Product[] = [];
  // the very first catalog sets the baseline: nothing in it counts as "new"
  if (Object.keys(seen.skus).length === 0) seen.baseline = nowIso;

  for (const p of api.products) {
    if (!p.sku) continue;
    const sizes: Size[] = p.sizes
      .map((s) => ({
        eu: String(s.size_eu),
        us: String(s.size_us ?? ''),
        qty: Math.max(0, Math.trunc(Number(s.quantity) || 0)),
        price: priceCents(s.price, pricing),
      }))
      .sort((a, b) => bySize(a.eu, b.eu));
    if (sizes.length === 0) continue;

    const inStock = sizes.filter((s) => s.qty > 0);
    const from = Math.min(...(inStock.length > 0 ? inStock : sizes).map((s) => s.price));
    const qty = inStock.reduce((n, s) => n + s.qty, 0);

    seen.skus[p.sku] ??= nowIso;
    const firstSeen = seen.skus[p.sku];
    const isNew = firstSeen > seen.baseline && new Date(firstSeen).getTime() >= newSince;

    let image: string | null = null;
    if (p.image_url && /^https:\/\//.test(p.image_url)) {
      const key = imageKey(p.image_url);
      images.set(`${p.sku}|${key}`, p.image_url);
      image = `/img/${encodeURIComponent(p.sku)}/${key}`;
    }

    products.push({
      sku: p.sku,
      name: p.name.trim(),
      brand: p.brand.trim(),
      category: (CATEGORIES as string[]).includes(p.size_category) ? (p.size_category as Category) : 'adult',
      image,
      qty,
      from,
      sizes,
      firstSeen,
      isNew,
    });
  }
  return { products, images };
}
