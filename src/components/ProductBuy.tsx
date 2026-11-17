// Product page: choose the size, see its price, ask for it in one tap.
import { useEffect, useState } from 'preact/hooks';
import { euro } from '../lib/format.ts';
import { contactHref, contactLabel, requestText, type ContactConfig } from '../lib/contact.ts';
import type { Product } from '../lib/types.ts';
import { t as dict, type Locale } from '../i18n.ts';
import { KEYS, toast, useFavs, useStored } from '../lib/client/store.ts';
import { Icon } from './Icon.tsx';

interface Props {
  p: Product;
  contact: ContactConfig;
  priceNote: string;
  lowStock: number;
  /** https://… of this site, for the link in the message. */
  origin: string;
  locale: Locale;
}

export default function ProductBuy({ p, contact, priceNote, lowStock, origin, locale }: Props) {
  const t = dict(locale);
  const [mySize] = useStored<string | null>(KEYS.size, null);
  const [system, setSystem] = useStored<'eu' | 'us'>(KEYS.system, 'eu');
  const [eu, setEu] = useState<string | null>(null);
  const { has, toggle, setSize } = useFavs();
  const fav = has(p.sku);

  // preselect the visitor's size when this model has it
  useEffect(() => {
    if (eu === null && mySize && p.sizes.some((s) => s.eu === mySize && s.qty > 0)) setEu(mySize);
  }, [mySize]);

  const chosen = p.sizes.find((s) => s.eu === eu);
  const inStock = p.sizes.filter((s) => s.qty > 0);
  const samePrice = new Set(inStock.map((s) => s.price)).size <= 1;
  const href = contactHref(contact, requestText([{ p, eu: chosen?.eu }], origin, locale), locale);

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t.linkCopied);
      }
    } catch {
      /* closed by the visitor */
    }
  };

  return (
    <div class="buy">
      <div class="buy-price">
        <span class="price">
          {!chosen && !samePrice && <small>{t.from}</small>}
          {euro(chosen ? chosen.price : p.from, locale)}
        </span>
        <span class="note">
          {chosen ? `${t.sizeLabel(chosen.eu)} · ` : ''}
          {priceNote}
        </span>
      </div>

      {inStock.length > 0 ? (
        <div>
          <div class="size-head">
            <h2>{t.pickSize}</h2>
            <div class="seg" role="group" aria-label={t.sizeSystem}>
              <button type="button" aria-pressed={system === 'eu'} onClick={() => setSystem('eu')}>
                EU
              </button>
              <button type="button" aria-pressed={system === 'us'} onClick={() => setSystem('us')}>
                US
              </button>
            </div>
          </div>
          <div class="pdp-sizes">
            {p.sizes.map((s) => (
              <button
                type="button"
                class="pdp-size"
                disabled={s.qty <= 0}
                aria-pressed={eu === s.eu}
                onClick={() => {
                  setEu(eu === s.eu ? null : s.eu);
                  if (fav) setSize(p.sku, eu === s.eu ? undefined : s.eu);
                }}
                aria-label={`${t.sizeLabel(s.eu)}${s.us ? `, US ${s.us}` : ''}, ${s.qty > 0 ? euro(s.price, locale) : t.soldOutSize}`}
              >
                <b>{system === 'us' && s.us ? s.us : s.eu}</b>
                <span>{s.qty > 0 ? (samePrice ? (system === 'us' ? `EU ${s.eu}` : s.us ? `US ${s.us}` : '') : euro(s.price, locale)) : t.soldOutSize}</span>
                {s.qty > 0 && s.qty <= lowStock && <em>{s.qty === 1 ? t.lastOne : t.lastN(s.qty)}</em>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p class="buy-hint">{t.allSoldOut}</p>
      )}

      <div class="buy-actions">
        {href ? (
          <a class="btn btn-accent" href={href} target="_blank" rel="noopener">
            <Icon name={contact.whatsapp ? 'chat' : 'mail'} />
            {chosen ? t.requestSize(chosen.eu, contactLabel(contact)) : t.askChannel(contactLabel(contact))}
          </a>
        ) : (
          <span />
        )}
        <button
          type="button"
          class="btn fav-btn"
          aria-pressed={fav}
          aria-label={fav ? t.favRemoveShort : t.favAddShort}
          onClick={() => {
            toggle(p.sku, eu ?? undefined);
            toast(fav ? t.favRemoved : t.favAdded);
          }}
        >
          <Icon name="heart" />
        </button>
        <button type="button" class="btn" aria-label={t.share} onClick={share}>
          <Icon name="share" />
        </button>
      </div>
      {href && !chosen && inStock.length > 1 && <p class="buy-hint">{t.pickHint}</p>}
    </div>
  );
}
