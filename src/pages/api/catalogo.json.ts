import type { APIRoute } from 'astro';
import { indexBodies } from '../../server/catalog.ts';

// The browser's copy of the catalog (prices of THIS site, already marked
// up), for instant search and filters. Precompressed, revalidated with the ETag.
export const GET: APIRoute = async ({ request }) => {
  const body = await indexBodies();
  const tag = `"r${body.revision}"`;
  const headers: Record<string, string> = {
    ETag: tag,
    'Cache-Control': 'public, max-age=60, must-revalidate',
    Vary: 'Accept-Encoding',
  };
  if (request.headers.get('if-none-match') === tag) return new Response(null, { status: 304, headers });
  const accept = request.headers.get('accept-encoding') ?? '';
  const [data, encoding] = /\bbr\b/.test(accept) ? [body.br, 'br'] : /\bgzip\b/.test(accept) ? [body.gzip, 'gzip'] : [body.raw, null];
  if (encoding) headers['Content-Encoding'] = encoding;
  return new Response(new Uint8Array(data), { headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
};
