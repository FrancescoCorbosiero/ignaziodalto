import { useRef } from 'preact/hooks';
import { useFavs, toast } from '../lib/client/store.ts';
import type { Product } from '../lib/types.ts';
import { t as dict, type Locale } from '../i18n.ts';
import { ProductCard } from './ProductCard.tsx';
import { Icon } from './Icon.tsx';

/**
 * A row of cards with a working heart. `scroll`: one line that slides
 * sideways (snap, arrows on large screens); otherwise a grid.
 */
export default function Rail({ items, locale, vat, scroll = false }: { items: Product[]; locale: Locale; vat?: string; scroll?: boolean }) {
  const t = dict(locale);
  const { has, toggle } = useFavs();
  const track = useRef<HTMLDivElement>(null);
  const move = (dir: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  const cards = items.map((p) => (
    <ProductCard
      key={p.sku}
      p={p}
      price={p.from}
      locale={locale}
      vat={vat}
      fav={has(p.sku)}
      onFav={() => {
        toast(has(p.sku) ? t.favRemoved : t.favAdded);
        toggle(p.sku);
      }}
    />
  ));
  if (!scroll) return <div class="grid">{cards}</div>;
  return (
    <div class="slider">
      <div class="slider-track" ref={track}>
        {cards}
      </div>
      <div class="slider-nav">
        <button type="button" class="btn icon-btn" aria-label={t.prev} onClick={() => move(-1)}>
          <span style="display:inline-flex;transform:scaleX(-1)">
            <Icon name="arrow" />
          </span>
        </button>
        <button type="button" class="btn icon-btn" aria-label={t.next} onClick={() => move(1)}>
          <Icon name="arrow" />
        </button>
      </div>
    </div>
  );
}
