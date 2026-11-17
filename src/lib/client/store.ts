// The visitor's own things, kept in this browser only: favourites, their
// size, EU/US. Every read/write is guarded (private mode, blocked storage).
import { useCallback, useEffect, useState } from 'preact/hooks';

export interface Fav {
  sku: string;
  eu?: string;
}

const EVENT = 'id:store';

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep it for this page only */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

/** A value in localStorage, shared live between every island of the page. */
export function useStored<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setValue(read(key, fallback));
    setLoaded(true);
    const sync = (e: Event) => {
      if ((e as CustomEvent).detail === key) setValue(read(key, fallback));
    };
    const fromOtherTab = (e: StorageEvent) => e.key === key && setValue(read(key, fallback));
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', fromOtherTab);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', fromOtherTab);
    };
  }, [key]);
  const set = useCallback((v: T) => write(key, v), [key]);
  return [value, set, loaded];
}

export const KEYS = {
  favs: 'id:favs',
  size: 'id:size',
  system: 'id:sizes',
} as const;

export function useFavs() {
  const [favs, setFavs, loaded] = useStored<Fav[]>(KEYS.favs, []);
  const has = (sku: string) => favs.some((f) => f.sku === sku);
  const toggle = (sku: string, eu?: string) =>
    setFavs(has(sku) ? favs.filter((f) => f.sku !== sku) : [...favs, { sku, eu }]);
  const setSize = (sku: string, eu?: string) =>
    setFavs(favs.some((f) => f.sku === sku) ? favs.map((f) => (f.sku === sku ? { sku, eu } : f)) : [...favs, { sku, eu }]);
  const remove = (sku: string) => setFavs(favs.filter((f) => f.sku !== sku));
  const clear = () => setFavs([]);
  return { favs, loaded, has, toggle, setSize, remove, clear };
}

let indexPromise: Promise<import('../types.ts').CatalogIndex> | null = null;

/** The whole catalog for instant filtering, fetched once per page. */
export function loadIndex() {
  indexPromise ??= fetch('/api/catalogo.json').then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });
  indexPromise.catch(() => (indexPromise = null));
  return indexPromise;
}

export function toast(message: string): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
