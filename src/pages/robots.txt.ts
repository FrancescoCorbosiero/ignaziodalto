import type { APIRoute } from 'astro';

// noindex by choice: nothing to crawl.
export const GET: APIRoute = () =>
  new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
