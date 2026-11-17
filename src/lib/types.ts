// Shapes shared by the server and the browser.

/** Size category, as scs-b2b derives it from the feed. */
export type Category = 'adult' | 'gs' | 'ps';

export const CATEGORIES: Category[] = ['adult', 'gs', 'ps'];

export const CATEGORY_LABEL: Record<Category, string> = {
  adult: 'Adulto',
  gs: 'Ragazzo · GS',
  ps: 'Bambino · PS',
};

export interface Size {
  /** EU size, always a string ("36 2/3"). */
  eu: string;
  us: string;
  qty: number;
  /** Price shown on this site, in euro cents (scs-b2b list price + markup). */
  price: number;
}

export interface Product {
  sku: string;
  name: string;
  brand: string;
  category: Category;
  /** Our own image path (/img/…), never the supplier's URL. */
  image: string | null;
  /** Pairs in stock, all sizes. */
  qty: number;
  /** Lowest price among the sizes in stock (all sizes when none is), cents. */
  from: number;
  sizes: Size[];
  /** First time this site saw the product (ISO date). */
  firstSeen: string;
  /** Seen for the first time in the last NEW_DAYS days. */
  isNew: boolean;
}

/** What the browser downloads to filter instantly (/api/catalogo.json). */
export interface CatalogIndex {
  syncedAt: string | null;
  products: Product[];
}
