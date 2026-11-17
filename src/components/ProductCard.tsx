import { euro, productPath } from '../lib/format.ts';
import type { Product } from '../lib/types.ts';
import { t as dict, type Locale } from '../i18n.ts';
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
  locale: Locale;
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

export function Badges({ p, locale }: { p: Product; locale: Locale }) {
  const t = dict(locale);
  const soldOut = p.qty <= 0;
  if (!soldOut && !p.isNew && p.qty > LOW_TOTAL) return null;
  return (
    <span class="badges">
      {soldOut && <span class="badge badge-out">{t.soldOut}</span>}
      {!soldOut && p.isNew && <span class="badge badge-new">{t.isNew}</span>}
      {!soldOut && p.qty <= LOW_TOTAL && <span class="badge badge-low">{t.lastPairs}</span>}
    </span>
  );
}

export function ProductCard({ p, price, hits = [], fav = false, onFav, eager, locale }: Props) {
  const t = dict(locale);
  const inStock = p.sizes.filter((s) => s.qty > 0);
  const exact = hits.length > 0 && inStock.some((s) => hits.includes(s.eu));
  return (
    <article class={`card${p.qty <= 0 ? ' is-soldout' : ''}`}>
      <a class="card-media" href={productPath(p.sku)} tabIndex={-1} aria-hidden="true">
        <Picture p={p} eager={eager} sizes="(max-width: 560px) 50vw, (max-width: 1023px) 33vw, 280px" />
        <Badges p={p} locale={locale} />
      </a>
      <button
        type="button"
        class="fav"
        aria-pressed={fav}
        aria-label={fav ? t.favRemove(p.name) : t.favAdd(p.name)}
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
            {!exact && inStock.length > 1 && <small>{t.from}</small>}
            {euro(price, locale)}
          </span>
          <span class="card-sizes">
            {t.sizesCount(inStock.length)}
          </span>
        </div>
        {inStock.length > 0 && (
          <div class="size-dots" aria-label={t.sizesAvailable}>
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
