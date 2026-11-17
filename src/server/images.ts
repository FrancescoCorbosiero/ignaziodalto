// Product images, served from this site: resized to WebP, cached on disk.
// Customers never see the supplier's URLs, and only the images listed in
// the catalog can be fetched (no open proxy).
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { env } from './env.ts';
import { imageUrl } from './catalog.ts';

export const WIDTHS = [320, 480, 720, 1080] as const;

const inflight = new Map<string, Promise<Buffer | null>>();

const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '_');

async function produce(source: string, width: number, target: string): Promise<Buffer | null> {
  const res = await fetch(source, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return null;
  const input = Buffer.from(await res.arrayBuffer());
  const out = await sharp(input)
    .rotate()
    // the supplier's shots sit on white: trim it so every shoe fills its frame alike
    .trim({ background: '#ffffff', threshold: 12 })
    .resize({ width, height: Math.round(width * 0.8), fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .webp({ quality: 80 })
    .toBuffer();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, out);
  return out;
}

export async function image(sku: string, key: string, width: number): Promise<Buffer | null> {
  const source = imageUrl(sku, key);
  if (!source || !(WIDTHS as readonly number[]).includes(width)) return null;
  const target = path.join(env.dataDir, 'img', `${safe(sku)}-${safe(key)}-${width}.webp`);
  try {
    return await fs.readFile(target);
  } catch {
    /* not cached yet */
  }
  let job = inflight.get(target);
  if (!job) {
    job = produce(source, width, target)
      .catch((err) => {
        console.error(`[img] ${sku}: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      })
      .finally(() => inflight.delete(target));
    inflight.set(target, job);
  }
  return job;
}
