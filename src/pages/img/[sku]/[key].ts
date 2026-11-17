import type { APIRoute } from 'astro';
import { cached, image, prepare, widthFor } from '../../../server/images.ts';
import { imageUrl } from '../../../server/catalog.ts';

const PLACEHOLDER =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -30 240 220" fill="none" stroke="#b9b4a8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M30 104c0-14 6-30 14-36 9 8 24 12 40 10l20 14c18 10 40 12 58 14 10 1 16 8 16 16v4H30v-22Z"/><path d="M30 120h148M84 78l8-10M98 86l8-10M112 94l8-10"/></svg>';

// /img/<sku>/<key>?w=480 -> WebP from the supplier's picture, cached.
export const GET: APIRoute = async ({ params, url }) => {
  const sku = params.sku ?? '';
  const key = params.key ?? '';
  const source = imageUrl(sku, key);
  const width = widthFor(Number(url.searchParams.get('w') ?? 480));
  if (source && width === 1080 && !(await cached(sku, key, 1080))) {
    // the large one isn't ready: the card size (prepared in advance) right
    // away, not cached, while the large one is made for the next view
    const small = await cached(sku, key, 480);
    if (small) {
      prepare(sku, key, source, 1080);
      return new Response(new Uint8Array(small), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' } });
    }
  }
  const body = source ? await image(sku, key, source, width) : null;
  if (!body) {
    // missing, failing or still being made: a drawn shoe, not cached
    return new Response(PLACEHOLDER, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' } });
  }
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=604800, immutable' },
  });
};
