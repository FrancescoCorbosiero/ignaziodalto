// The catalog in memory: loaded from scs-b2b's API (or the fixture in
// development), refreshed every CATALOG_REFRESH_SECONDS, cached on disk so
// a restart or an scs-b2b outage never leaves the site empty.
import fs from 'node:fs/promises';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { env } from './env.ts';
import { assertCatalog, normalize, type ApiCatalog, type Pricing, type Seen } from './normalize.ts';
import { warm } from './images.ts';
import { apply as applyFilters, EMPTY } from '../lib/filter.ts';
import type { CatalogIndex, Product } from '../lib/types.ts';

interface State {
  products: Product[];
  bySku: Map<string, Product>;
  /** `${sku}|${imageKey}` -> supplier image URL (server-side only). */
  images: Map<string, string>;
  /** When scs-b2b last synced the feed. */
  syncedAt: string | null;
  /** When this site last heard from scs-b2b (200 or 304). */
  checkedAt: string | null;
  source: 'api' | 'fixture' | 'cache' | 'none';
  lastError: string | null;
  /** Bumps on every change: ETag of /api/catalogo.json. */
  revision: number;
}

const state: State = {
  products: [],
  bySku: new Map(),
  images: new Map(),
  syncedAt: null,
  checkedAt: null,
  source: 'none',
  lastError: null,
  revision: 0,
};

let raw: ApiCatalog | null = null;
let pricing: Pricing | null = null;
let etag: string | null = null;
let seen: Seen | null = null;
let started: Promise<void> | null = null;
interface IndexBodies {
  revision: number;
  raw: Buffer;
  br: Buffer;
  gzip: Buffer;
}
let index: Promise<IndexBodies> | null = null;
const brotli = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);

const file = (name: string) => path.join(env.dataDir, name);

async function readJson<T>(name: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file(name), 'utf8')) as T;
  } catch {
    return null;
  }
}

async function writeJson(name: string, data: unknown): Promise<void> {
  await fs.mkdir(env.dataDir, { recursive: true });
  const tmp = file(`${name}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(tmp, file(name));
}

/** The site always starts from the taxable amount: VAT inside the list price is stripped first. */
function pricingFor(api: ApiCatalog): Pricing {
  const included = env.listIncludesVat === 'auto' ? api.vat_included === true : env.listIncludesVat;
  pricing = {
    markupCents: env.markupCents,
    vatBasisPoints: env.vatBasisPoints,
    listVatBasisPoints: included ? env.listVatBasisPoints : 0,
  };
  return pricing;
}

async function apply(api: ApiCatalog, source: State['source']): Promise<void> {
  seen ??= (await readJson<Seen>('seen.json')) ?? { baseline: new Date().toISOString(), skus: {} };
  const { products, images } = normalize(api, pricingFor(api), seen, env.newDays);
  raw = api;
  state.products = products;
  state.bySku = new Map(products.map((p) => [p.sku, p]));
  state.images = images;
  state.syncedAt = api.synced_at;
  state.source = source;
  state.revision++;
  index = null;
  await writeJson('seen.json', seen).catch(() => undefined);
  // prepare every card picture in the background: visitors hit the cache
  // in the order the catalog shows them (sold-out last): the first page first
  const shown = applyFilters(products, { ...EMPTY, all: true });
  void warm(
    shown.flatMap((p) => {
      const key = p.image?.split('/')[3];
      const source = key ? images.get(`${p.sku}|${key}`) : undefined;
      return key && source ? [{ sku: p.sku, key, source }] : [];
    }),
  );
}

async function fetchApi(): Promise<void> {
  const headers: Record<string, string> = { Authorization: `Bearer ${env.apiToken}`, Accept: 'application/json' };
  if (etag && raw) headers['If-None-Match'] = etag;
  const res = await fetch(env.apiUrl, { headers, signal: AbortSignal.timeout(30_000) });
  if (res.status === 304) return;
  if (!res.ok) throw new Error(`scs-b2b ha risposto ${res.status}`);
  const api = assertCatalog(await res.json());
  etag = res.headers.get('etag');
  await apply(api, 'api');
  await writeJson('catalog.json', { etag, api });
}

export async function refresh(): Promise<void> {
  try {
    if (env.apiUrl && env.apiToken) {
      await fetchApi();
    } else {
      const api = assertCatalog(JSON.parse(await fs.readFile(env.fixture, 'utf8')));
      // the fixture is a frozen copy: report it as synced now
      await apply({ ...api, synced_at: new Date().toISOString() }, 'fixture');
    }
    state.checkedAt = new Date().toISOString();
    state.lastError = null;
  } catch (err) {
    state.lastError = err instanceof Error ? err.message : String(err);
    console.error(`[catalog] aggiornamento fallito: ${state.lastError}`);
  }
}

async function boot(): Promise<void> {
  // last good copy first: the site answers at once, even with scs-b2b down
  const cached = await readJson<{ etag: string | null; api: ApiCatalog }>('catalog.json');
  if (cached && env.apiUrl) {
    try {
      await apply(assertCatalog(cached.api), 'cache');
      etag = cached.etag;
    } catch {
      /* corrupt cache: ignore */
    }
  }
  await refresh();
  const timer = setInterval(() => void refresh(), env.refreshSeconds * 1000);
  timer.unref();
}

/** Loads the catalog once per process and starts the refresh loop. */
export function ready(): Promise<void> {
  started ??= boot();
  return started;
}

export function products(): Product[] {
  return state.products;
}

export function product(sku: string): Product | undefined {
  return state.bySku.get(sku);
}

export function imageUrl(sku: string, key: string): string | undefined {
  return state.images.get(`${sku}|${key}`);
}

export function meta() {
  return {
    count: state.products.length,
    syncedAt: state.syncedAt,
    checkedAt: state.checkedAt,
    source: state.source,
    lastError: state.lastError,
    revision: state.revision,
    /** How prices are computed now: list VAT stripped, markup, VAT added (basis points / cents). */
    pricing,
  };
}

/**
 * The browser's copy for instant filtering: serialized and compressed once
 * per revision (1.4 MB of JSON for 1500 models -> ~30 KB with brotli).
 */
export function indexBodies(): Promise<IndexBodies> {
  const revision = state.revision;
  if (!index) {
    const raw = Buffer.from(JSON.stringify({ syncedAt: state.syncedAt, products: state.products } satisfies CatalogIndex));
    index = Promise.all([
      brotli(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }),
      gzip(raw, { level: 9 }),
    ]).then(([br, gz]) => ({ revision, raw, br, gzip: gz }));
  }
  return index;
}
