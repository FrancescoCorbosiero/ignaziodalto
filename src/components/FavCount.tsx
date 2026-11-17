import { useFavs } from '../lib/client/store.ts';
import { t as dict, type Locale } from '../i18n.ts';
import { Icon } from './Icon.tsx';

/** Header link to /preferiti, with the live count. */
export default function FavCount({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const { favs } = useFavs();
  return (
    <a class="btn btn-ghost icon-btn" href="/preferiti" aria-label={`${t.favorites} (${favs.length})`}>
      <Icon name="heart" />
      <span class="label-wide">{t.favorites}</span>
      <span class="count-pill" hidden={favs.length === 0}>
        {favs.length}
      </span>
    </a>
  );
}
