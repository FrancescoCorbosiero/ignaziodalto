// Makes the product pictures in its own process, at the lowest CPU priority:
// on a small server the pages always come first. Driven by
// src/server/images.ts over IPC: { id, source, width, file } -> { id, ok, error? }.
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';

// before sharp starts its threads: they inherit the priority
try {
  os.setPriority(19);
} catch {
  /* not allowed: run at normal priority */
}

const { default: sharp } = await import('sharp');
sharp.cache(false);
sharp.concurrency(1);

async function produce(source, width, file) {
  const res = await fetch(source, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; catalog-images)', Accept: 'image/*' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const out = await sharp(input, { limitInputPixels: 40_000_000, failOn: 'none' })
    .rotate()
    // shrink first: trimming a 4K screenshot is what costs
    .resize({ width: width * 2, height: width * 2, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    // the supplier's shots sit on white: trim it so every shoe fills its frame alike
    .trim({ background: '#ffffff', threshold: 12 })
    .resize({ width, height: Math.round(width * 0.8), fit: 'contain', background: '#ffffff' })
    .webp({ quality: 78, effort: 3 })
    .toBuffer();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, out);
  await fs.rename(tmp, file);
}

process.on('message', async ({ id, source, width, file }) => {
  try {
    await produce(source, width, file);
    process.send({ id, ok: true });
  } catch (err) {
    process.send({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
});
process.on('disconnect', () => process.exit(0));
