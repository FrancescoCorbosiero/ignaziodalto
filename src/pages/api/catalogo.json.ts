import type { APIRoute } from 'astro';
import { indexBody, meta } from '../../server/catalog.ts';

// The browser's copy of the catalog (prices of THIS site, already marked
// up), for instant search and filters. Revalidated with the ETag.
export const GET: APIRoute = ({ request }) => {
  const tag = `"r${meta().revision}"`;
  const headers = { ETag: tag, 'Cache-Control': 'public, max-age=60, must-revalidate' };
  if (request.headers.get('if-none-match') === tag) return new Response(null, { status: 304, headers });
  return new Response(indexBody(), { headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
};
