// Filters, sorting and facets of the catalog. The same code runs on the
// server (first render, no-JS) and in the browser (instant filtering).
import { CATEGORIES, type Category, type Product } from './types.ts';
import { bySize, fold } from './format.ts';

export type Sort = 'rilevanza' | 'novita' | 'prezzo_asc' | 'prezzo_desc' | 'nome';

export const SORTS: { value: Sort; label: string }[] = [
  { value: 'rilevanza', label: 'In evidenza' },
  { value: 'novita', label: 'Novità' },
  { value: 'prezzo_asc', label: 'Prezzo crescente' },
  { value: 'prezzo_desc', label: 'Prezzo decrescente' },
  { value: 'nome', label: 'Nome A–Z' },
];

export interface Filters {
  q: string;
  brands: string[];
  cats: Category[];
  /** EU sizes: a product matches when one of them is in stock. */
  sizes: string[];
  /** Euro, inclusive. */
  min: number | null;
  max: number | null;
  /** Show sold-out products too. */
  all: boolean;
  sort: Sort;
}

export const EMPTY: Filters = {
  q: '',
  brands: [],
  cats: [],
  sizes: [],
  min: null,
  max: null,
  all: false,
  sort: 'rilevanza',
};

const num = (v: string | null): number | null => {
  if (v === null || v.trim() === '') return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function parseFilters(sp: URLSearchParams): Filters {
  const sort = sp.get('ordina') as Sort | null;
  return {
    q: (sp.get('q') ?? '').slice(0, 80),
    brands: sp.getAll('brand').filter(Boolean).slice(0, 30),
    cats: sp.getAll('cat').filter((c): c is Category => (CATEGORIES as string[]).includes(c)),
    sizes: sp.getAll('taglia').filter(Boolean).slice(0, 30),
    min: num(sp.get('min')),
    max: num(sp.get('max')),
    all: sp.get('esauriti') === '1',
    sort: SORTS.some((s) => s.value === sort) ? (sort as Sort) : 'rilevanza',
  };
}

export function toSearchParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  f.brands.forEach((b) => sp.append('brand', b));
  f.cats.forEach((c) => sp.append('cat', c));
  f.sizes.forEach((s) => sp.append('taglia', s));
  if (f.min !== null) sp.set('min', String(f.min));
  if (f.max !== null) sp.set('max', String(f.max));
  if (f.all) sp.set('esauriti', '1');
  if (f.sort !== 'rilevanza') sp.set('ordina', f.sort);
  return sp;
}

export function isFiltered(f: Filters): boolean {
  return (
    f.q !== '' || f.brands.length > 0 || f.cats.length > 0 || f.sizes.length > 0 || f.min !== null || f.max !== null
  );
}

/**
 * The price that matters for this search: with sizes chosen, the lowest
 * price among THOSE sizes in stock; otherwise the product's "from" price.
 */
export function priceFor(p: Product, f: Pick<Filters, 'sizes'>): number {
  if (f.sizes.length > 0) {
    const prices = p.sizes.filter((s) => s.qty > 0 && f.sizes.includes(s.eu)).map((s) => s.price);
    if (prices.length > 0) return Math.min(...prices);
  }
  return p.from;
}

type Facet = 'brand' | 'cat' | 'size' | 'price' | 'q' | 'stock';

function matches(p: Product, f: Filters, skip: Facet | null, terms: string[]): boolean {
  if (skip !== 'stock' && !f.all && p.qty <= 0) return false;
  if (skip !== 'q' && terms.length > 0) {
    const hay = fold(`${p.brand} ${p.name} ${p.sku}`);
    if (!terms.every((t) => hay.includes(t))) return false;
  }
  if (skip !== 'brand' && f.brands.length > 0 && !f.brands.includes(p.brand)) return false;
  if (skip !== 'cat' && f.cats.length > 0 && !f.cats.includes(p.category)) return false;
  if (skip !== 'size' && f.sizes.length > 0 && !p.sizes.some((s) => s.qty > 0 && f.sizes.includes(s.eu))) return false;
  if (skip !== 'price' && (f.min !== null || f.max !== null)) {
    const euros = priceFor(p, f) / 100;
    if (f.min !== null && euros < f.min) return false;
    if (f.max !== null && euros > f.max) return false;
  }
  return true;
}

const termsOf = (q: string) => fold(q).split(/\s+/).filter(Boolean);

export function apply(products: Product[], f: Filters): Product[] {
  const terms = termsOf(f.q);
  const out = products.filter((p) => matches(p, f, null, terms));
  const name = (a: Product, b: Product) => a.name.localeCompare(b.name, 'it');
  // sold-out always last, whatever the order
  const stock = (a: Product, b: Product) => Number(b.qty > 0) - Number(a.qty > 0);
  const cmp: Record<Sort, (a: Product, b: Product) => number> = {
    rilevanza: (a, b) => stock(a, b) || Number(b.isNew) - Number(a.isNew) || b.qty - a.qty || name(a, b),
    novita: (a, b) => stock(a, b) || b.firstSeen.localeCompare(a.firstSeen) || b.qty - a.qty || name(a, b),
    prezzo_asc: (a, b) => stock(a, b) || priceFor(a, f) - priceFor(b, f) || name(a, b),
    prezzo_desc: (a, b) => stock(a, b) || priceFor(b, f) - priceFor(a, f) || name(a, b),
    nome: (a, b) => stock(a, b) || name(a, b),
  };
  return out.sort(cmp[f.sort]);
}

export interface Facets {
  brands: { value: string; count: number }[];
  cats: { value: Category; count: number }[];
  sizes: { value: string; count: number }[];
  /** Price bounds of the products matching everything but the price, euro. */
  price: { min: number; max: number } | null;
}

/**
 * Disjunctive facets: each group counts the products matching every OTHER
 * filter, so choosing a brand doesn't hide the other brands.
 */
export function facets(products: Product[], f: Filters): Facets {
  const terms = termsOf(f.q);
  const brands = new Map<string, number>();
  const cats = new Map<Category, number>();
  const sizes = new Map<string, number>();
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of products) {
    if (matches(p, f, 'brand', terms)) brands.set(p.brand, (brands.get(p.brand) ?? 0) + 1);
    if (matches(p, f, 'cat', terms)) cats.set(p.category, (cats.get(p.category) ?? 0) + 1);
    if (matches(p, f, 'size', terms)) {
      for (const s of p.sizes) if (s.qty > 0) sizes.set(s.eu, (sizes.get(s.eu) ?? 0) + 1);
    }
    if (matches(p, f, 'price', terms)) {
      const e = priceFor(p, f) / 100;
      lo = Math.min(lo, e);
      hi = Math.max(hi, e);
    }
  }
  // keep chosen values visible even when nothing matches them any more
  f.brands.forEach((b) => brands.has(b) || brands.set(b, 0));
  f.sizes.forEach((s) => sizes.has(s) || sizes.set(s, 0));
  return {
    brands: [...brands].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
    cats: CATEGORIES.filter((c) => cats.has(c) || f.cats.includes(c)).map((value) => ({ value, count: cats.get(value) ?? 0 })),
    sizes: [...sizes].map(([value, count]) => ({ value, count })).sort((a, b) => bySize(a.value, b.value)),
    price: Number.isFinite(lo) ? { min: Math.floor(lo), max: Math.ceil(hi) } : null,
  };
}
