// Product page: choose the size, see its price, ask for it in one tap.
import { useEffect, useState } from 'preact/hooks';
import { euro } from '../lib/format.ts';
import { contactHref, contactLabel, requestText, type ContactConfig } from '../lib/contact.ts';
import type { Product } from '../lib/types.ts';
import { KEYS, toast, useFavs, useStored } from '../lib/client/store.ts';
import { Icon } from './Icon.tsx';

interface Props {
  p: Product;
  contact: ContactConfig;
  priceNote: string;
  lowStock: number;
  /** https://… of this site, for the link in the message. */
  origin: string;
}

export default function ProductBuy({ p, contact, priceNote, lowStock, origin }: Props) {
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
  const href = contactHref(contact, requestText([{ p, eu: chosen?.eu }], origin));

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copiato');
      }
    } catch {
      /* closed by the visitor */
    }
  };

  return (
    <div class="buy">
      <div class="buy-price">
        <span class="price">
          {!chosen && !samePrice && <small>da</small>}
          {euro(chosen ? chosen.price : p.from)}
        </span>
        <span class="note">
          {chosen ? `Taglia EU ${chosen.eu} · ` : ''}
          {priceNote}
        </span>
      </div>

      {inStock.length > 0 ? (
        <div>
          <div class="size-head">
            <h2>Scegli la taglia</h2>
            <div class="seg" role="group" aria-label="Sistema taglie">
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
                aria-label={`Taglia EU ${s.eu}${s.us ? `, US ${s.us}` : ''}, ${s.qty > 0 ? euro(s.price) : 'esaurita'}`}
              >
                <b>{system === 'us' && s.us ? s.us : s.eu}</b>
                <span>{s.qty > 0 ? (samePrice ? (system === 'us' ? `EU ${s.eu}` : s.us ? `US ${s.us}` : '') : euro(s.price)) : 'esaurita'}</span>
                {s.qty > 0 && s.qty <= lowStock && <em>{s.qty === 1 ? 'Ultimo' : `Ultimi ${s.qty}`}</em>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p class="buy-hint">Al momento è esaurito in tutte le taglie. Aggiungilo ai preferiti e chiedici quando torna.</p>
      )}

      <div class="buy-actions">
        {href ? (
          <a class="btn btn-accent" href={href} target="_blank" rel="noopener">
            <Icon name={contact.whatsapp ? 'chat' : 'mail'} />
            {chosen ? `Richiedi la ${chosen.eu} su ${contactLabel(contact)}` : `Chiedi su ${contactLabel(contact)}`}
          </a>
        ) : (
          <span />
        )}
        <button
          type="button"
          class="btn fav-btn"
          aria-pressed={fav}
          aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
          onClick={() => {
            toggle(p.sku, eu ?? undefined);
            toast(fav ? 'Tolto dai preferiti' : 'Aggiunto ai preferiti');
          }}
        >
          <Icon name="heart" />
        </button>
        <button type="button" class="btn" aria-label="Condividi" onClick={share}>
          <Icon name="share" />
        </button>
      </div>
      {href && !chosen && inStock.length > 1 && <p class="buy-hint">Scegli la taglia: la scriviamo noi nel messaggio, insieme a modello e prezzo.</p>}
    </div>
  );
}
