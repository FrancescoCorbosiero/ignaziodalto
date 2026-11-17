import { useFavs, toast } from '../lib/client/store.ts';
import type { Product } from '../lib/types.ts';
import { ProductCard } from './ProductCard.tsx';

/** "More from this brand": cards with a working heart. */
export default function Rail({ items }: { items: Product[] }) {
  const { has, toggle } = useFavs();
  return (
    <div class="grid">
      {items.map((p) => (
        <ProductCard
          key={p.sku}
          p={p}
          price={p.from}
          fav={has(p.sku)}
          onFav={() => {
            toast(has(p.sku) ? 'Tolto dai preferiti' : 'Aggiunto ai preferiti');
            toggle(p.sku);
          }}
        />
      ))}
    </div>
  );
}
