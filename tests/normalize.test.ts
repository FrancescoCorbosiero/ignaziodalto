import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, priceCents, assertCatalog, type ApiCatalog, type Seen } from '../src/server/normalize.ts';
import { apply, facets, parseFilters, priceFor, toSearchParams, EMPTY } from '../src/lib/filter.ts';

const api = (products: ApiCatalog['products']): ApiCatalog => ({ version: 1, synced_at: null, vat_included: false, products });
const shoe = (sku: string, brand: string, sizes: [string, number, string][], extra = {}) => ({
  sku,
  name: `${brand} ${sku}`,
  brand,
  size_category: 'adult',
  image_url: `https://www.goldensneakers.net/images/${sku}/main.png`,
  total_quantity: sizes.reduce((n, s) => n + s[1], 0),
  sizes: sizes.map(([eu, quantity, price]) => ({ size_eu: eu, size_us: '', quantity, price })),
  ...extra,
});

test('the markup is added to every size, in integer cents', () => {
  assert.equal(priceCents('75.00', 350), 7850);
  assert.equal(priceCents('129.9', 350), 13340);
  assert.equal(priceCents('0.10', 350), 360);
  assert.throws(() => priceCents('abc', 350));
  const seen: Seen = { baseline: '', skus: {} };
  const { products } = normalize(api([shoe('A1', 'Nike', [['42', 2, '100.00'], ['43', 0, '90.00'], ['41', 1, '110.00']])]), 350, seen, 14);
  const p = products[0];
  assert.deepEqual(p.sizes.map((s) => [s.eu, s.price]), [['41', 11350], ['42', 10350], ['43', 9350]]);
  assert.equal(p.from, 10350, '"from" ignores sold-out sizes');
  assert.equal(p.qty, 3);
});

test('supplier image URLs never reach the page', () => {
  const { products, images } = normalize(api([shoe('A1', 'Nike', [['42', 1, '10.00']])]), 0, { baseline: '', skus: {} }, 14);
  assert.match(products[0].image ?? '', /^\/img\/A1\/[0-9a-f]{10}$/);
  assert.ok(!JSON.stringify(products).includes('goldensneakers'));
  assert.equal(images.size, 1);
});

test('"Novità": nothing on the first load, then products that appear later', () => {
  const seen: Seen = { baseline: '', skus: {} };
  const t0 = new Date('2026-11-01T10:00:00Z');
  const first = normalize(api([shoe('A1', 'Nike', [['42', 1, '10.00']])]), 0, seen, 14, t0);
  assert.equal(first.products[0].isNew, false);
  const t1 = new Date('2026-11-05T10:00:00Z');
  const second = normalize(api([shoe('A1', 'Nike', [['42', 1, '10.00']]), shoe('B2', 'Puma', [['40', 1, '10.00']])]), 0, seen, 14, t1);
  assert.deepEqual(second.products.map((p) => [p.sku, p.isNew]), [['A1', false], ['B2', true]]);
  const later = normalize(api([shoe('B2', 'Puma', [['40', 1, '10.00']])]), 0, seen, 14, new Date('2026-11-25T10:00:00Z'));
  assert.equal(later.products[0].isNew, false, 'no longer new after NEW_DAYS');
});

test('the API version is checked', () => {
  assert.throws(() => assertCatalog({ version: 2, products: [] }));
  assert.throws(() => assertCatalog({ version: 1 }));
});

const catalog = normalize(
  api([
    shoe('N1', 'Nike', [['42', 3, '100.00'], ['43', 1, '120.00']]),
    shoe('N2', 'Nike', [['40', 2, '80.00']]),
    shoe('A1', 'Adidas', [['42', 1, '60.00']], { name: 'adidas Sàmba OG' }),
    shoe('X0', 'Adidas', [['42', 0, '50.00']]),
  ]),
  0,
  { baseline: '', skus: {} },
  14,
).products;

test('filters: size, brand, search without accents, sold-out last and hidden by default', () => {
  const f = parseFilters(new URLSearchParams('taglia=42'));
  assert.deepEqual(apply(catalog, f).map((p) => p.sku), ['N1', 'A1']);
  assert.equal(priceFor(catalog[0], f), 10000, 'price of the chosen size');
  assert.deepEqual(apply(catalog, { ...EMPTY, q: 'samba' }).map((p) => p.sku), ['A1']);
  assert.deepEqual(apply(catalog, { ...EMPTY, all: true, sort: 'prezzo_asc' }).map((p) => p.sku), ['A1', 'N2', 'N1', 'X0']);
  assert.deepEqual(apply(catalog, { ...EMPTY, brands: ['Nike'], max: 90 }).map((p) => p.sku), ['N2']);
});

test('facets are disjunctive and the URL round-trips', () => {
  const f = { ...EMPTY, brands: ['Nike'] };
  const fc = facets(catalog, f);
  assert.deepEqual(fc.brands, [{ value: 'Adidas', count: 1 }, { value: 'Nike', count: 2 }]);
  assert.deepEqual(fc.sizes.map((s) => s.value), ['40', '42', '43']);
  const g = { ...EMPTY, q: 'dunk low', brands: ['Nike', 'New Balance'], sizes: ['36 2/3'], min: 50, all: true, sort: 'novita' as const };
  assert.deepEqual(parseFilters(toSearchParams(g)), g);
});
