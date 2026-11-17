// Starts the Astro server, then loads the catalog at once (Astro loads the
// server code on the first request: without this, the first visitor would
// wait for scs-b2b and the pictures would start being prepared only then).
await import('./dist/server/entry.mjs');

const port = process.env.PORT || 4321;
for (let i = 0; i < 30; i++) {
  try {
    await fetch(`http://127.0.0.1:${port}/healthz`, { signal: AbortSignal.timeout(60_000) });
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 1000));
  }
}
