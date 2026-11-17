import { euro, productPath } from '../lib/format.ts';
import type { Product } from '../lib/types.ts';
import { Icon, ShoeMark } from './Icon.tsx';

/** A product's total pairs at or below this: "Ultimi pezzi". */
export const LOW_TOTAL = 3;

interface Props {
  p: Product;
  /** Price to show (cents): the "from" price, or the chosen sizes' price. */
  price: number;
  /** Sizes the visitor is looking for: highlighted. */
  hits?: string[];
  fav?: boolean;
  onFav?: () => void;
  /** First cards of the page: load their pictures at once. */
  eager?: boolean;
}

/**
 * Two sizes exist (src/server/images.ts): 480 for cards, prepared in advance
 * for every product, and 1080 for the product page on large screens.
 */
export function Picture({ p, eager, large, sizes }: { p: Product; eager?: boolean; large?: boolean; sizes: string }) {
  if (!p.image) return <ShoeMark />;
  return (
    <img
      src={`${p.image}?w=480`}
      srcset={large ? `${p.image}?w=480 480w, ${p.image}?w=1080 1080w` : undefined}
      sizes={large ? sizes : undefined}
      alt={p.name}
      width={480}
      height={384}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={eager ? 'high' : undefined}
    />
  );
}

export function Badges({ p }: { p: Product }) {
  const soldOut = p.qty <= 0;
  if (!soldOut && !p.isNew && p.qty > LOW_TOTAL) return null;
  return (
    <span class="badges">
      {soldOut && <span class="badge badge-out">Esaurito</span>}
      {!soldOut && p.isNew && <span class="badge badge-new">Novità</span>}
      {!soldOut && p.qty <= LOW_TOTAL && <span class="badge badge-low">Ultimi pezzi</span>}
    </span>
  );
}

export function ProductCard({ p, price, hits = [], fav = false, onFav, eager }: Props) {
  const inStock = p.sizes.filter((s) => s.qty > 0);
  const exact = hits.length > 0 && inStock.some((s) => hits.includes(s.eu));
  return (
    <article class={`card${p.qty <= 0 ? ' is-soldout' : ''}`}>
      <a class="card-media" href={productPath(p.sku)} tabIndex={-1} aria-hidden="true">
        <Picture p={p} eager={eager} sizes="(max-width: 560px) 50vw, (max-width: 1023px) 33vw, 280px" />
        <Badges p={p} />
      </a>
      <button
        type="button"
        class="fav"
        aria-pressed={fav}
        aria-label={fav ? `Togli ${p.name} dai preferiti` : `Aggiungi ${p.name} ai preferiti`}
        onClick={onFav}
      >
        <Icon name="heart" />
      </button>
      <div class="card-body">
        <p class="card-brand">{p.brand}</p>
        <h3 class="card-name">
          <a href={productPath(p.sku)}>{p.name}</a>
        </h3>
        <div class="card-foot">
          <span class="price">
            {!exact && inStock.length > 1 && <small>da</small>}
            {euro(price)}
          </span>
          <span class="card-sizes">
            {inStock.length === 0 ? 'Esaurito' : inStock.length === 1 ? '1 taglia' : `${inStock.length} taglie`}
          </span>
        </div>
        {inStock.length > 0 && (
          <div class="size-dots" aria-label="Taglie disponibili (EU)">
            {inStock.slice(0, 9).map((s) => (
              <span class={hits.includes(s.eu) ? 'is-hit' : undefined}>{s.eu}</span>
            ))}
            {inStock.length > 9 && <span>+{inStock.length - 9}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
