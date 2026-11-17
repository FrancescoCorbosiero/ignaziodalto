// Product images, served from this site: resized to WebP, cached on disk.
// Customers never see the supplier's URLs, and only the images listed in
// the catalog can be fetched (no open proxy).
//
// Making a picture (download + resize) is slow and CPU-heavy, so:
// - it happens in a separate process at the lowest CPU priority
//   (image-worker.mjs): pages are never starved;
// - only two sizes exist (cards, product page), whatever the browser asks;
// - at most IMAGE_CONCURRENCY pictures are made at once, visitors first;
// - after every catalog update the card size of every product is prepared
//   in the background, so visitors almost always hit the disk cache;
// - a picture that fails is not retried for a while, and a visitor never
//   waits more than IMAGE_WAIT_MS: they get the drawn placeholder instead.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fork, type ChildProcess } from 'node:child_process';
import { env } from './env.ts';

/** The sizes that exist: cards, product page. */
export const WIDTHS = [480, 1080] as const;
export type Width = (typeof WIDTHS)[number];

/** Any requested width -> the closest size we make (old URLs keep working). */
export function widthFor(requested: number): Width {
  return requested > 720 ? 1080 : 480;
}

const FAIL_TTL_MS = 15 * 60_000;
const failed = new Map<string, number>();
const inflight = new Map<string, Promise<Buffer | null>>();
const stats = { made: 0, failed: 0, cacheHits: 0 };

type Job = { run: () => Promise<void>; urgent: boolean };
const queue: Job[] = [];
let running = 0;

function pump(): void {
  while (running < env.imageConcurrency && queue.length > 0) {
    const i = queue.findIndex((j) => j.urgent);
    const [job] = queue.splice(i >= 0 ? i : 0, 1);
    running++;
    job.run().finally(() => {
      running--;
      pump();
    });
  }
}

function schedule<T>(work: () => Promise<T>, urgent: boolean): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ urgent, run: () => work().then(resolve, reject) });
    pump();
  });
}

const safe = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '_');
const target = (sku: string, key: string, width: Width) =>
  path.join(env.dataDir, 'img', `${safe(sku)}-${safe(key)}-${width}.webp`);

// ── The worker process (image-worker.mjs), at the lowest CPU priority ──

let worker: ChildProcess | null = null;
let seq = 0;
const waiting = new Map<number, { resolve: () => void; reject: (e: Error) => void }>();

function getWorker(): ChildProcess {
  if (worker && worker.connected) return worker;
  const w = fork(path.resolve(process.env.IMAGE_WORKER ?? 'image-worker.mjs'), [], { stdio: 'inherit' });
  w.on('message', (m: { id: number; ok: boolean; error?: string }) => {
    const p = waiting.get(m.id);
    if (!p) return;
    waiting.delete(m.id);
    if (m.ok) p.resolve();
    else p.reject(new Error(m.error ?? 'errore'));
  });
  w.on('exit', () => {
    if (worker === w) worker = null;
    for (const [id, p] of waiting) {
      waiting.delete(id);
      p.reject(new Error('processo immagini terminato'));
    }
  });
  worker = w;
  return w;
}

async function produce(source: string, width: Width, file: string): Promise<Buffer> {
  const id = ++seq;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      waiting.delete(id);
      reject(new Error('tempo scaduto'));
    }, 60_000);
    waiting.set(id, {
      resolve: () => (clearTimeout(timer), resolve()),
      reject: (e) => (clearTimeout(timer), reject(e)),
    });
    getWorker().send({ id, source, width, file });
  });
  return fs.readFile(file);
}

/** The picture from disk, or made now (queued). null = not available. */
function make(sku: string, key: string, source: string, width: Width, urgent: boolean): Promise<Buffer | null> {
  const file = target(sku, key, width);
  const until = failed.get(file);
  if (until && until > Date.now()) return Promise.resolve(null);

  let job = inflight.get(file);
  if (!job) {
    job = fs
      .readFile(file)
      .then((b) => {
        stats.cacheHits++;
        return b;
      })
      .catch(() =>
        schedule(() => produce(source, width, file), urgent).then(
          (b) => {
            stats.made++;
            failed.delete(file);
            return b;
          },
          (err: unknown) => {
            stats.failed++;
            failed.set(file, Date.now() + FAIL_TTL_MS);
            console.error(`[img] ${sku}: ${err instanceof Error ? err.message : String(err)}`);
            return null;
          },
        ),
      )
      .finally(() => inflight.delete(file));
    inflight.set(file, job);
  }
  return job;
}

/**
 * For a visitor: the picture, or null if it isn't ready within
 * IMAGE_WAIT_MS (it keeps being made: the next view will find it).
 */
export async function image(sku: string, key: string, source: string, width: Width): Promise<Buffer | null> {
  // a long line already: don't hold the visitor's connection, answer now
  // (the picture is still queued and will be ready for the next view)
  const busy = queue.filter((j) => j.urgent).length >= env.imageConcurrency * 3;
  const job = make(sku, key, source, width, true);
  if (busy) return cached(sku, key, width);
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), env.imageWaitMs).unref());
  return Promise.race([job, timeout]);
}

type WarmItem = { sku: string; key: string; source: string };
/** Already on disk? (no download, no wait) */
export function cached(sku: string, key: string, width: Width): Promise<Buffer | null> {
  return fs.readFile(target(sku, key, width)).catch(() => null);
}

/** Make it in the background, no one waiting for it. */
export function prepare(sku: string, key: string, source: string, width: Width): void {
  void make(sku, key, source, width, false);
}

let warming = false;
let pending: WarmItem[] | null = null;

/** Background: the card picture of every product, one by one. */
export async function warm(list: WarmItem[]): Promise<void> {
  if (warming) {
    pending = list; // a newer catalog: walk it when this pass ends
    return;
  }
  warming = true;
  try {
    let next = 0;
    const lane = async () => {
      while (next < list.length) {
        const item = list[next++];
        // visitors first: wait while their pictures are queued
        while (queue.some((j) => j.urgent)) await new Promise((r) => setTimeout(r, 250));
        await make(item.sku, item.key, item.source, 480, false);
      }
    };
    await Promise.all(Array.from({ length: env.imageConcurrency }, lane));
  } finally {
    warming = false;
  }
  if (pending) {
    const next = pending;
    pending = null;
    await warm(next);
  }
}

export function imageStats() {
  return { ...stats, queued: queue.length, running, warming, failing: failed.size };
}
