import type { APIRoute } from 'astro';
import { image, WIDTHS } from '../../../server/images.ts';

const PLACEHOLDER =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -30 240 220" fill="none" stroke="#b9b4a8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M30 104c0-14 6-30 14-36 9 8 24 12 40 10l20 14c18 10 40 12 58 14 10 1 16 8 16 16v4H30v-22Z"/><path d="M30 120h148M84 78l8-10M98 86l8-10M112 94l8-10"/></svg>';

// /img/<sku>/<key>?w=480 -> WebP from the supplier's picture, cached.
export const GET: APIRoute = async ({ params, url }) => {
  const w = Number(url.searchParams.get('w') ?? 480);
  const width = (WIDTHS as readonly number[]).includes(w) ? w : 480;
  const body = await image(params.sku ?? '', params.key ?? '', width);
  if (!body) {
    // the supplier's picture is missing or unreachable: a drawn shoe, retried soon
    return new Response(PLACEHOLDER, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    });
  }
  return new Response(new Uint8Array(body), {
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=604800, immutable' },
  });
};
