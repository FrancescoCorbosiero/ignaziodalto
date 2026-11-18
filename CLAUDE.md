# ignaziodalto.alpacode.it — catalogo sneakers

Catalogo vetrina pubblico (senza login, senza carrello, senza admin) che
mostra il listino di **scs-b2b** (`FrancescoCorbosiero/scs-b2b`,
b2b.shoesclothingstore.com) **maggiorato di 3,00 € a taglia, prezzi imponibili
(IVA esclusa)**. Il cliente
finale sceglie modello e taglia e invia la richiesta su WhatsApp (o e-mail).

## Da dove arrivano i dati

- **Unica fonte: l'API catalogo di scs-b2b** (`GET /api/v1/catalogo`, token
  Bearer, docs/10 di scs-b2b). Mai GoldenSneakers direttamente: il listino
  netto lo calcola scs-b2b con le sue regole margine; qui si aggiunge solo
  `PRICE_MARKUP_EUR`.
- Il server tiene il catalogo in memoria (`src/server/catalog.ts`), lo
  richiede ogni `CATALOG_REFRESH_SECONDS` con ETag (304 se invariato) e ne
  salva l'ultima copia buona in `DATA_DIR`: se scs-b2b è giù il sito resta su.
- Senza `CATALOG_API_URL`/`CATALOG_API_TOKEN` usa `fixtures/catalog.json`
  (una risposta reale dell'API, per lo sviluppo).

## Regole

1. **Prezzi**: `(imponibile scs-b2b + PRICE_MARKUP_EUR) × (1 + VAT_RATE)`: se
   il listino include l'IVA (`vat_included` dell'API, o
   `LIST_PRICES_INCLUDE_VAT`) la si scorpora prima (`LIST_VAT_RATE`); il
   margine va sull'imponibile, l'IVA per ultima, arrotondata al centesimo, in
   centesimi interi (`priceCents` in `src/server/normalize.ts`, testata;
   `/healthz` mostra le regole in uso).
   Scelta del titolare: solo prezzi imponibili (`VAT_RATE=0`, default), con
   «Prezzi IVA esclusa» in scheda e nel piè di pagina e «+ IVA» accanto ai
   prezzi delle card (`vatTagFor`). `VAT_RATE=22` li riporta IVA inclusa.
2. **Noindex ovunque**: meta robots, `X-Robots-Tag` (middleware) e
   `robots.txt` con `Disallow: /`. Scelta del titolare.
3. **Il fornitore non si vede**: le immagini passano da `/img/<sku>/<key>`
   (ridimensionate in WebP e messe in cache); gli URL di GoldenSneakers non
   arrivano mai al browser. Il proxy serve solo immagini presenti nel catalogo.
4. **Le foto non rallentano le pagine** (`src/server/images.ts`): due sole
   misure (480 card, 1080 scheda); si preparano in un processo a parte a
   priorità CPU minima (`image-worker.mjs`), al massimo `IMAGE_CONCURRENCY`
   insieme, prima quelle dei visitatori; dopo ogni aggiornamento del catalogo
   si preparano in background tutte le 480 nell'ordine del catalogo. Un
   visitatore non aspetta mai più di `IMAGE_WAIT_MS` (poi la sagoma), le foto
   che falliscono non si riprovano per 15 minuti. Il catalogo si carica
   all'avvio (`start.mjs`), non alla prima visita. L'indice JSON esce già
   compresso (brotli/gzip); Caddy comprime il resto (`caddy.encode`).
5. Il token di scs-b2b vive solo nel `.env` del server: mai nel browser.
6. **Testi IT/EN** tutti in `src/i18n.ts` (italiano fonte e default, inglese
   stesse chiavi); la lingua viene dal cookie `lang` (`/lingua/<it|en>`) o dal
   browser, in `Astro.locals.locale`. Codice e commenti in inglese.
7. **Tema chiaro/scuro**: token in `global.css` (`:root`, `prefers-color-scheme`,
   `[data-theme]`); i riquadri prodotto restano chiari anche nel tema scuro.

## Struttura

- `src/server/` — env, store del catalogo, normalizzazione (+markup, "Novità"), immagini
- `src/lib/filter.ts` — filtri/ordinamenti/faccette, condivisi server e browser
- `src/components/` — isole Preact: `Catalog` (griglia + filtri istantanei),
  `ProductBuy` (taglia → prezzo → WhatsApp), `Favorites`, `FavCount`, `Rail`
- `src/pages/` — `/` (copertina, novità, come funziona, catalogo, CTA), `/p/[sku]`, `/preferiti`, `/api/catalogo.json`
  (indice per i filtri istantanei), `/img/…`, `/healthz` (catalogo + coda
  immagini), `/robots.txt`
- `docs/features.md` — funzionalità proposte al cliente

## Comandi

```bash
npm run dev       # sviluppo (fixture se manca l'API)
npm run check     # astro check (tipi)
npm test          # test unitari (node:test)
npm run build && npm start
docker compose up -d --build   # produzione, dietro caddy-docker-proxy
```

Verifica prima del push: `npm run check && npm test && npm run build`, poi
avvio e un giro con Playwright (Chromium preinstallato) a 1440×900 e 390×844.
