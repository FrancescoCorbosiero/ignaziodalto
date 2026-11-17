# ignaziodalto.alpacode.it — catalogo sneakers

Catalogo vetrina pubblico (senza login, senza carrello, senza admin) che
mostra il listino di **scs-b2b** (`FrancescoCorbosiero/scs-b2b`,
b2b.shoesclothingstore.com) **maggiorato di 3,50 € a taglia sull'imponibile,
IVA 22% inclusa**. Il cliente
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

1. **Prezzi**: `(netto scs-b2b + PRICE_MARKUP_EUR) × (1 + VAT_RATE)`: il
   margine va sull'imponibile, l'IVA per ultima, arrotondata al centesimo, in
   centesimi interi (`priceCents` in `src/server/normalize.ts`, testata).
   Si mostrano IVA inclusa (`PRICE_NOTE`); `VAT_RATE=0` torna ai prezzi netti.
2. **Noindex ovunque**: meta robots, `X-Robots-Tag` (middleware) e
   `robots.txt` con `Disallow: /`. Scelta del titolare.
3. **Il fornitore non si vede**: le immagini passano da `/img/<sku>/<key>`
   (ridimensionate in WebP e messe in cache); gli URL di GoldenSneakers non
   arrivano mai al browser. Il proxy serve solo immagini presenti nel catalogo.
4. Il token di scs-b2b vive solo nel `.env` del server: mai nel browser.
5. Testi in italiano; codice e commenti in inglese.

## Struttura

- `src/server/` — env, store del catalogo, normalizzazione (+markup, "Novità"), immagini
- `src/lib/filter.ts` — filtri/ordinamenti/faccette, condivisi server e browser
- `src/components/` — isole Preact: `Catalog` (griglia + filtri istantanei),
  `ProductBuy` (taglia → prezzo → WhatsApp), `Favorites`, `FavCount`, `Rail`
- `src/pages/` — `/`, `/p/[sku]`, `/preferiti`, `/api/catalogo.json`
  (indice per i filtri istantanei), `/img/…`, `/healthz`, `/robots.txt`
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
