// The catalog: search, filters, the grid. Rendered on the server with the
// first page (works without JavaScript: the filters are a GET form), then
// it downloads the whole catalog once and filters instantly in the browser.
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { apply, EMPTY, facets as facetsOf, isFiltered, priceFor, SORTS, toSearchParams, type Facets, type Filters } from '../lib/filter.ts';
import { CATEGORY_LABEL, type Category, type Product } from '../lib/types.ts';
import { KEYS, loadIndex, toast, useFavs, useStored } from '../lib/client/store.ts';
import { ProductCard } from './ProductCard.tsx';
import { Icon } from './Icon.tsx';

interface Props {
  items: Product[];
  total: number;
  facets: Facets;
  filters: Filters;
  pageSize: number;
  shown: number;
  /** Every EU size of the catalog: the "your size" picker. */
  allSizes: string[];
}

export default function Catalog(props: Props) {
  const [filters, setFilters] = useState<Filters>(props.filters);
  const [all, setAll] = useState<Product[] | null>(null);
  const [shown, setShown] = useState(props.shown);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(props.filters.q);
  const [mySize, setMySize] = useStored<string | null>(KEYS.size, null);
  const { has, toggle } = useFavs();
  const first = useRef(true);
  const sentinel = useRef<HTMLDivElement>(null);

  // the whole catalog, once: from then on every filter is instant
  useEffect(() => {
    document.documentElement.classList.add('has-js');
    // after the first paint and the first pictures: the page comes first
    const go = () =>
      loadIndex()
        .then((idx) => setAll(idx.products))
        .catch(() => toast('Connessione assente: i filtri si aggiornano ricaricando la pagina'));
    const idle = (window as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(go, { timeout: 1500 });
    else setTimeout(go, 300);
  }, []);

  // a returning visitor finds the catalog already in their size
  useEffect(() => {
    if (!first.current) return;
    if (mySize && props.filters.sizes.length === 0 && !new URLSearchParams(location.search).has('taglia')) {
      setFilters((f) => ({ ...f, sizes: [mySize] }));
    }
  }, [mySize]);

  // the URL always says what's on screen: shareable, back-button safe
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const qs = toSearchParams(filters).toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
    setShown(props.pageSize);
  }, [filters]);

  // search as you type, a beat behind the keys
  useEffect(() => {
    if (q === filters.q) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, q })), 140);
    return () => clearTimeout(t);
  }, [q]);

  const live = all !== null;
  const results = useMemo(() => (live ? apply(all, filters) : null), [all, filters]);
  const facets = useMemo(() => (live ? facetsOf(all, filters) : props.facets), [all, filters]);
  const total = results ? results.length : props.total;
  const items = results ? results.slice(0, shown) : props.items;
  const stale = !live && JSON.stringify(filters) !== JSON.stringify(props.filters);

  // endless grid: the next page arrives before the visitor reaches the end
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !live) return;
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setShown((n) => n + props.pageSize),
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [live, items.length < total]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const flip = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const reset = () => {
    setQ('');
    setFilters({ ...EMPTY, sort: filters.sort });
  };
  const chooseMySize = (v: string) => {
    setMySize(v || null);
    set({ sizes: v ? [v] : [] });
  };

  const chips: { label: string; off: () => void }[] = [
    ...(filters.q ? [{ label: `“${filters.q}”`, off: () => (setQ(''), set({ q: '' })) }] : []),
    ...filters.brands.map((b) => ({ label: b, off: () => set({ brands: filters.brands.filter((x) => x !== b) }) })),
    ...filters.cats.map((c) => ({ label: CATEGORY_LABEL[c], off: () => set({ cats: filters.cats.filter((x) => x !== c) }) })),
    ...filters.sizes.map((s) => ({ label: `EU ${s}`, off: () => set({ sizes: filters.sizes.filter((x) => x !== s) }) })),
    ...(filters.min !== null ? [{ label: `da ${filters.min} €`, off: () => set({ min: null }) }] : []),
    ...(filters.max !== null ? [{ label: `fino a ${filters.max} €`, off: () => set({ max: null }) }] : []),
  ];

  const submit = (e: Event) => live && e.preventDefault();
  const sizeValue = filters.sizes.length === 1 ? filters.sizes[0] : '';

  return (
    <form method="get" action="/" onSubmit={submit} class="catalog-form">
      <nav class="brand-rail" aria-label="Brand">
        {facets.brands.map((b) => (
          <a
            class="brand-chip"
            href={`/?brand=${encodeURIComponent(b.value)}`}
            aria-pressed={filters.brands.includes(b.value)}
            onClick={(e) => {
              if (!live) return;
              e.preventDefault();
              set({ brands: flip(filters.brands, b.value) });
            }}
          >
            {b.value} <small>{b.count}</small>
          </a>
        ))}
      </nav>

      <div class="toolbar">
        <label class="search">
          <span class="sr-only">Cerca</span>
          <Icon name="search" />
          <input
            type="search"
            name="q"
            value={q}
            placeholder="Cerca modello, brand o codice…"
            autocomplete="off"
            enterkeyhint="search"
            onInput={(e) => setQ(e.currentTarget.value)}
          />
          {q && (
            <button type="button" class="clear" aria-label="Cancella la ricerca" onClick={() => (setQ(''), set({ q: '' }))}>
              <Icon name="x" />
            </button>
          )}
        </label>
        <label class="js-only">
          <span class="sr-only">La tua taglia</span>
          <select class={`select${filters.sizes.length ? ' is-set' : ''}`} value={sizeValue} onChange={(e) => chooseMySize(e.currentTarget.value)}>
            <option value="">{filters.sizes.length > 1 ? `${filters.sizes.length} taglie` : 'La tua taglia'}</option>
            {props.allSizes.map((s) => (
              <option value={s}>EU {s}</option>
            ))}
          </select>
        </label>
        <label class="sort-select">
          <span class="sr-only">Ordina</span>
          <select name="ordina" class="select" value={filters.sort} onChange={(e) => set({ sort: e.currentTarget.value as Filters['sort'] })}>
            {SORTS.map((s) => (
              <option value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <button type="button" class="btn filters-toggle" aria-expanded={open} aria-controls="filters" onClick={() => setOpen(true)}>
          <Icon name="sliders" /> Filtri
          {chips.length > 0 && <span class="count-pill">{chips.length}</span>}
        </button>
      </div>

      <div class="catalog">
        <aside id="filters" class={`panel${open ? ' is-open' : ''}`} aria-label="Filtri">
          <div class="panel-head">
            <h2>Filtri</h2>
            <button type="button" class="btn btn-ghost" aria-label="Chiudi i filtri" onClick={() => setOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          <div class="panel-body">
            {facets.cats.length > 1 && (
              <fieldset class="group" style="border-inline:0;border-top:0;margin:0;padding-inline:0">
                <h3>Categoria</h3>
                <ul class="checks">
                  {facets.cats.map((c) => (
                    <li>
                      <label class={`check${c.count === 0 ? ' is-empty' : ''}`}>
                        <input type="checkbox" name="cat" value={c.value} checked={filters.cats.includes(c.value)} onChange={() => set({ cats: flip<Category>(filters.cats, c.value) })} />
                        {CATEGORY_LABEL[c.value]}
                        <span class="n">{c.count}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}

            <div class="group">
              <h3>Taglia EU</h3>
              <div class="size-grid">
                {facets.sizes.map((s) => (
                  <label class="size-btn" data-on={filters.sizes.includes(s.value)} data-empty={s.count === 0}>
                    <input
                      type="checkbox"
                      class="sr-only"
                      name="taglia"
                      value={s.value}
                      checked={filters.sizes.includes(s.value)}
                      onChange={() => set({ sizes: flip(filters.sizes, s.value) })}
                    />
                    {s.value}
                  </label>
                ))}
              </div>
            </div>

            <div class="group">
              <h3>Brand</h3>
              <ul class="checks">
                {facets.brands.map((b) => (
                  <li>
                    <label class={`check${b.count === 0 ? ' is-empty' : ''}`}>
                      <input type="checkbox" name="brand" value={b.value} checked={filters.brands.includes(b.value)} onChange={() => set({ brands: flip(filters.brands, b.value) })} />
                      {b.value}
                      <span class="n">{b.count}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div class="group">
              <h3>Prezzo</h3>
              <div class="price-inputs">
                <label>
                  Da €
                  <input type="number" name="min" inputMode="numeric" min={0} step={1} placeholder={facets.price ? String(facets.price.min) : ''} value={filters.min ?? ''} onChange={(e) => set({ min: e.currentTarget.value === '' ? null : Math.max(0, Number(e.currentTarget.value)) })} />
                </label>
                <label>
                  A €
                  <input type="number" name="max" inputMode="numeric" min={0} step={1} placeholder={facets.price ? String(facets.price.max) : ''} value={filters.max ?? ''} onChange={(e) => set({ max: e.currentTarget.value === '' ? null : Math.max(0, Number(e.currentTarget.value)) })} />
                </label>
              </div>
            </div>

            <div class="group">
              <label class="toggle">
                Mostra anche gli esauriti
                <input type="checkbox" name="esauriti" value="1" checked={filters.all} onChange={(e) => set({ all: e.currentTarget.checked })} />
              </label>
            </div>

            <div class="group no-js">
              <button type="submit" class="btn btn-solid" style="width:100%">
                Applica i filtri
              </button>
            </div>
          </div>
          <div class="panel-foot">
            <button type="button" class="btn" onClick={reset}>
              Azzera
            </button>
            <button type="button" class="btn btn-solid" onClick={() => setOpen(false)}>
              Mostra {total} {total === 1 ? 'modello' : 'modelli'}
            </button>
          </div>
        </aside>
        <div class={`scrim${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} />

        <section aria-live="polite" aria-busy={stale}>
          <div class="results-head">
            <p class="results-count">
              <strong>{total}</strong> {total === 1 ? 'modello' : 'modelli'}
              {filters.sizes.length > 0 && <> nella tua taglia</>}
            </p>
            {chips.map((c) => (
              <button type="button" class="chip" onClick={c.off} aria-label={`Togli il filtro ${c.label}`}>
                {c.label} <Icon name="x" />
              </button>
            ))}
            {chips.length > 1 && (
              <button type="button" class="link-btn" onClick={reset}>
                Azzera tutto
              </button>
            )}
          </div>

          {total === 0 && !stale ? (
            <div class="empty">
              <h2>Nessun paio</h2>
              <p>
                {filters.sizes.length > 0
                  ? 'In questa taglia non c’è nulla che corrisponda. Prova a togliere qualche filtro o a cercare in un’altra taglia.'
                  : 'Nessun modello corrisponde alla ricerca. Prova con meno parole o togli qualche filtro.'}
              </p>
              {isFiltered(filters) && (
                <button type="button" class="btn btn-solid" onClick={reset}>
                  Vedi tutto il catalogo
                </button>
              )}
            </div>
          ) : (
            <div class={`grid${stale ? ' skeleton' : ''}`}>
              {items.map((p, i) => (
                <ProductCard
                  key={p.sku}
                  p={p}
                  price={priceFor(p, filters)}
                  hits={filters.sizes}
                  eager={i < 4}
                  fav={has(p.sku)}
                  onFav={() => {
                    const adding = !has(p.sku);
                    toggle(p.sku, filters.sizes.length === 1 ? filters.sizes[0] : undefined);
                    toast(adding ? 'Aggiunto ai preferiti' : 'Tolto dai preferiti');
                  }}
                />
              ))}
            </div>
          )}

          {items.length < total && (
            <div class="more" ref={sentinel}>
              <a
                class="btn"
                href={`?${new URLSearchParams([...toSearchParams(filters), ['pagina', String(Math.ceil(shown / props.pageSize) + 1)]])}`}
                onClick={(e) => {
                  if (!live) return;
                  e.preventDefault();
                  setShown((n) => n + props.pageSize);
                }}
              >
                Mostra altri
              </a>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}
