import { useFavs } from '../lib/client/store.ts';
import { Icon } from './Icon.tsx';

/** Header link to /preferiti, with the live count. */
export default function FavCount() {
  const { favs } = useFavs();
  return (
    <a class="btn btn-ghost" href="/preferiti" aria-label={`Preferiti (${favs.length})`}>
      <Icon name="heart" />
      <span class="label-wide">Preferiti</span>
      <span class="count-pill" hidden={favs.length === 0}>
        {favs.length}
      </span>
    </a>
  );
}
