# ignaziodalto.alpacode.it

Catalogo sneakers vetrina: il listino di scs-b2b (imponibile) + 3,00 € a taglia
(prezzi imponibili, IVA esclusa), filtri
istantanei, scheda prodotto con taglie e prezzi, preferiti e richiesta su
WhatsApp. Astro 5 (Node standalone) + Preact, nessun database.

## Avvio in locale

```bash
npm install
npm run dev            # http://localhost:4321, con la fixture
```

Per leggere il catalogo vero copia `.env.example` in `.env` e compila
`CATALOG_API_URL` + `CATALOG_API_TOKEN` (lo stesso token del `.env` di scs-b2b).

## Produzione

1. Record DNS `ignaziodalto.alpacode.it` verso la VPS (fatto).
2. Su scs-b2b: `CATALOG_API_TOKEN=<openssl rand -hex 32>` nel `.env` e deploy.
3. Qui: `cp .env.example .env`, stesso token, contatti WhatsApp/e-mail.
4. `docker compose up -d --build` (rete esterna `caddy` già presente).

Stato e freschezza del catalogo: `https://ignaziodalto.alpacode.it/healthz`.

Dettagli in `CLAUDE.md`; funzionalità proposte in `docs/features.md`.
