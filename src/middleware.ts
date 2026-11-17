import { defineMiddleware } from 'astro:middleware';
import { ready } from './server/catalog.ts';

// Every response: out of search engines (the site is a private-ish showcase,
// noindex by the owner's choice), plus the usual hardening headers.
export const onRequest = defineMiddleware(async (_ctx, next) => {
  await ready();
  const res = await next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noimageindex');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
});
