import type { APIRoute } from 'astro';
import { isLocale } from '../../i18n.ts';

// /lingua/en?to=/p/NK1001 -> remembers the language, back to the same page.
export const GET: APIRoute = ({ params, url, cookies, redirect }) => {
  if (isLocale(params.locale)) {
    cookies.set('lang', params.locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', httpOnly: true });
  }
  const to = url.searchParams.get('to') ?? '/';
  // only our own pages: never an open redirect
  return redirect(/^\/(?!\/)/.test(to) ? to : '/', 303);
};
