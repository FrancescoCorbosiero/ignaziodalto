import type { APIRoute } from 'astro';
import { meta } from '../server/catalog.ts';

// For monitoring: is the catalog loaded, and how fresh is it?
export const GET: APIRoute = () => {
  const m = meta();
  return Response.json(m, { status: m.count > 0 ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
};
