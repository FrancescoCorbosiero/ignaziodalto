import type { APIRoute } from 'astro';
import { meta } from '../server/catalog.ts';
import { imageStats } from '../server/images.ts';

// For monitoring: is the catalog loaded, and how fresh is it?
export const GET: APIRoute = () => {
  const m = meta();
  return Response.json({ ...m, images: imageStats() }, { status: m.count > 0 ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
};
