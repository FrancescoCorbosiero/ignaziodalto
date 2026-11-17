// /preferiti: the visitor's shortlist, each with its size, sent in one message.
import { useEffect, useState } from 'preact/hooks';
import { euro, productPath } from '../lib/format.ts';
import { contactHref, contactLabel, requestText, type ContactConfig } from '../lib/contact.ts';
import type { Product } from '../lib/types.ts';
import { t as dict, type Locale } from '../i18n.ts';
import { loadIndex, useFavs } from '../lib/client/store.ts';
import { Badges, Picture } from './ProductCard.tsx';
import { Icon } from './Icon.tsx';

export default function Favorites({ contact, origin, locale }: { contact: ContactConfig; origin: string; locale: Locale }) {
  const t = dict(locale);
  const { favs, loaded, setSize, remove, clear } = useFavs();
  const [bySku, setBySku] = useState<Map<string, Product> | null>(null);

  useEffect(() => {
    loadIndex().then((idx) => setBySku(new Map(idx.products.map((p) => [p.sku, p]))));
  }, []);

  if (!loaded || !bySku) return <p class="results-count">{t.favLoading}</p>;

  const lines = favs.flatMap((f) => {
    const p = bySku.get(f.sku);
    return p ? [{ p, eu: f.eu }] : [];
  });
  const gone = favs.length - lines.length;

  if (lines.length === 0) {
    return (
      <div class="empty">
        <h2>{t.favEmptyTitle}</h2>
        <p>{t.favEmptyText}</p>
        <a class="btn btn-solid" href="/">
          {t.browse} <Icon name="arrow" />
        </a>
      </div>
    );
  }

  const priced = lines.filter((l) => l.eu && l.p.sizes.some((s) => s.eu === l.eu && s.qty > 0));
  const total = priced.reduce((n, l) => n + (l.p.sizes.find((s) => s.eu === l.eu)?.price ?? 0), 0);
  const href = contactHref(contact, requestText(lines, origin, locale), locale);

  return (
    <>
      {gone > 0 && (
        <p class="buy-hint" style="margin:0 0 12px">
          {t.favGone(gone)}
        </p>
      )}
      <ul class="fav-list">
        {lines.map(({ p, eu }) => {
          const available = p.sizes.filter((s) => s.qty > 0);
          const size = p.sizes.find((s) => s.eu === eu);
          return (
            <li class="fav-row" key={p.sku}>
              <a class="card-media" href={productPath(p.sku)} aria-hidden="true" tabIndex={-1}>
                <Picture p={p} sizes="120px" />
                <Badges p={p} locale={locale} />
              </a>
              <div>
                <p class="card-brand">{p.brand}</p>
                <h3>
                  <a href={productPath(p.sku)}>{p.name}</a>
                </h3>
                {available.length > 0 ? (
                  <select class={`select${eu ? ' is-set' : ''}`} value={eu ?? ''} onChange={(e) => setSize(p.sku, e.currentTarget.value || undefined)} aria-label={t.favSizeFor(p.name)}>
                    <option value="">{t.pickSize}</option>
                    {available.map((s) => (
                      <option value={s.eu}>
                        EU {s.eu} — {euro(s.price, locale)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span class="card-sizes">{t.soldOutAll}</span>
                )}
              </div>
              <div>
                <span class="price">{euro(size && size.qty > 0 ? size.price : p.from, locale)}</span>
                <button type="button" class="link-btn" onClick={() => remove(p.sku)}>
                  {t.remove}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div class="send-bar">
        <div>
          <span class="results-count">
            {lines.length} {t.models(lines.length)}
            {priced.length > 0 && (
              <>
                {' · '}
                <strong>{euro(total, locale)}</strong>
                {t.favTotal(priced.length)}
              </>
            )}
          </span>
          <br />
          <button type="button" class="link-btn" onClick={() => confirm(t.clearConfirm) && clear()}>
            {t.clearList}
          </button>
        </div>
        {href && (
          <a class="btn btn-accent" href={href} target="_blank" rel="noopener">
            <Icon name={contact.whatsapp ? 'chat' : 'mail'} /> {t.sendList(contactLabel(contact))}
          </a>
        )}
      </div>
    </>
  );
}
