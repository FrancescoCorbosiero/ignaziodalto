// Every UI string, in Italian (the source, the default) and English.
// Components take a `locale` and read `t(locale)`; product names stay as the feed has them.
import type { Category } from './lib/types.ts';
import type { Sort } from './lib/filter.ts';

export type Locale = 'it' | 'en';
export const LOCALES: Locale[] = ['it', 'en'];
export const LOCALE_TAG: Record<Locale, string> = { it: 'it-IT', en: 'en-IE' };

export function isLocale(v: unknown): v is Locale {
  return v === 'it' || v === 'en';
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const it = {
  locale: 'it' as Locale,
  // chrome
  catalog: 'Catalogo',
  writeUs: 'Scrivici',
  favorites: 'Preferiti',
  language: 'Lingua',
  themeToggle: 'Cambia tema chiaro/scuro',
  greeting: (site: string) => `Ciao! Ti scrivo dal catalogo ${site}.`,
  tagline: 'Sneakers originali, disponibilità aggiornata',
  priceNote: (vatIncluded: boolean): string => (vatIncluded ? 'Prezzi IVA inclusa' : 'Prezzi IVA esclusa'),
  vatTag: '+ IVA',
  footerNote: 'Disponibilità e prezzi possono cambiare: la conferma arriva quando ci scrivi.',

  // home cover and sections
  coverKicker: 'Catalogo sneakers',
  coverTitle: ['Sneakers', 'disponibili'],
  coverLead: (models: number, brands: number) =>
    `${models} modelli di ${brands} brand, con le taglie e i prezzi di ogni paio. Scegli, e ce lo chiedi in un messaggio.`,
  browse: 'Sfoglia il catalogo',
  askOn: (channel: string) => `Scrivici su ${channel}`,
  statModels: 'modelli',
  statBrands: 'brand',
  statPairs: 'paia disponibili',
  updated: (when: string) => `Disponibilità aggiornata ${when}`,
  newTitle: 'Appena arrivate',
  featuredTitle: 'In evidenza',
  newLead: 'Gli ultimi modelli entrati in catalogo.',
  featuredLead: 'I modelli con più taglie disponibili.',
  seeAll: 'Vedi tutto',
  howTitle: 'Come funziona',
  how: [
    ['Scegli', 'Filtra per brand, taglia e prezzo. Imposta la tua taglia una volta: il catalogo ti mostra solo quello che c’è.'],
    ['Chiedi', 'Tocca “Richiedi”: il messaggio parte già scritto con modello, codice, taglia e prezzo. Più paia? Mettile nei preferiti e mandale tutte insieme.'],
    ['Ricevi conferma', 'Ti rispondiamo noi con la conferma di disponibilità e prezzo, e ci accordiamo sul resto.'],
  ] as [string, string][],
  catalogTitle: 'Tutto il catalogo',
  ctaTitle: 'Una domanda su un modello o una taglia?',
  ctaLead: 'Scrivici: rispondiamo noi, senza moduli e senza registrazioni.',
  prev: 'Precedenti',
  next: 'Successivi',

  // catalog
  search: 'Cerca',
  searchPlaceholder: 'Cerca modello, brand o codice…',
  clearSearch: 'Cancella la ricerca',
  yourSize: 'La tua taglia',
  nSizes: (n: number) => `${n} taglie`,
  sort: 'Ordina',
  sorts: {
    rilevanza: 'In evidenza',
    novita: 'Novità',
    prezzo_asc: 'Prezzo crescente',
    prezzo_desc: 'Prezzo decrescente',
    nome: 'Nome A–Z',
  } as Record<Sort, string>,
  filters: 'Filtri',
  closeFilters: 'Chiudi i filtri',
  category: 'Categoria',
  categories: { adult: 'Adulto', gs: 'Ragazzo · GS', ps: 'Bambino · PS' } as Record<Category, string>,
  sizeEu: 'Taglia EU',
  brand: 'Brand',
  price: 'Prezzo',
  priceFrom: 'Da €',
  priceTo: 'A €',
  showSoldOut: 'Mostra anche gli esauriti',
  apply: 'Applica i filtri',
  reset: 'Azzera',
  resetAll: 'Azzera tutto',
  showN: (n: number) => `Mostra ${n} ${plural(n, 'modello', 'modelli')}`,
  models: (n: number) => plural(n, 'modello', 'modelli'),
  inYourSize: ' nella tua taglia',
  removeFilter: (l: string) => `Togli il filtro ${l}`,
  chipFrom: (n: number) => `da ${n} €`,
  chipTo: (n: number) => `fino a ${n} €`,
  emptyTitle: 'Nessun paio',
  emptySize: 'In questa taglia non c’è nulla che corrisponda. Prova a togliere qualche filtro o a cercare in un’altra taglia.',
  emptyAny: 'Nessun modello corrisponde alla ricerca. Prova con meno parole o togli qualche filtro.',
  seeCatalog: 'Vedi tutto il catalogo',
  more: 'Mostra altri',
  offline: 'Connessione assente: i filtri si aggiornano ricaricando la pagina',

  // card
  from: 'da',
  sizesCount: (n: number) => (n === 0 ? 'Esaurito' : plural(n, '1 taglia', `${n} taglie`)),
  sizesAvailable: 'Taglie disponibili (EU)',
  soldOut: 'Esaurito',
  isNew: 'Novità',
  lastPairs: 'Ultimi pezzi',
  favAdd: (name: string) => `Aggiungi ${name} ai preferiti`,
  favRemove: (name: string) => `Togli ${name} dai preferiti`,
  favAdded: 'Aggiunto ai preferiti',
  favRemoved: 'Tolto dai preferiti',

  // product page
  code: 'Codice',
  pickSize: 'Scegli la taglia',
  sizeSystem: 'Sistema taglie',
  sizeLabel: (eu: string) => `Taglia EU ${eu}`,
  soldOutSize: 'esaurita',
  lastOne: 'Ultimo',
  lastN: (n: number) => `Ultimi ${n}`,
  allSoldOut: 'Al momento è esaurito in tutte le taglie. Aggiungilo ai preferiti e chiedici quando torna.',
  requestSize: (eu: string, channel: string) => `Richiedi la ${eu} su ${channel}`,
  askChannel: (channel: string) => `Chiedi su ${channel}`,
  favAddShort: 'Aggiungi ai preferiti',
  favRemoveShort: 'Togli dai preferiti',
  share: 'Condividi',
  linkCopied: 'Link copiato',
  pickHint: 'Scegli la taglia: la scriviamo noi nel messaggio, insieme a modello e prezzo.',
  sizesInStock: 'Taglie disponibili',
  ofTotal: (a: number, b: number) => `${a} su ${b}`,
  availability: 'Disponibilità',
  updatedShort: (when: string) => `aggiornata ${when}`,
  moreFrom: (brand: string) => `Altre ${brand}`,
  youMayLike: 'Potrebbero piacerti',
  path: 'Percorso',
  goneTitle: 'Non c’è più',
  goneText: 'Questo modello non è più a catalogo: il fornitore lo ha esaurito o ritirato. Dai un’occhiata a quelli disponibili.',
  goToCatalog: 'Vai al catalogo',

  // favourites
  favTitle: 'I tuoi preferiti',
  favLoading: 'Carico i preferiti…',
  favEmptyTitle: 'Ancora niente',
  favEmptyText: 'Tocca il cuore su un modello per metterlo qui. Poi scegli le taglie e mandaci la lista in un solo messaggio.',
  favGone: (n: number) =>
    n === 1 ? 'Un modello che avevi salvato non è più a catalogo.' : `${n} modelli che avevi salvato non sono più a catalogo.`,
  favSizeFor: (name: string) => `Taglia per ${name}`,
  soldOutAll: 'Esaurito in tutte le taglie',
  remove: 'Togli',
  favTotal: (pairs: number) => ` per ${pairs} ${plural(pairs, 'paio', 'paia')} con taglia`,
  clearList: 'Svuota la lista',
  clearConfirm: 'Svuotare la lista dei preferiti?',
  sendList: (channel: string) => `Invia la lista su ${channel}`,

  // the message the customer sends
  msgOne: 'Ciao! Vorrei questo paio:',
  msgMany: (n: number) => `Ciao! Vorrei questi ${n} paia:`,
  msgSize: (eu: string) => `taglia EU ${eu}`,
  msgNoSize: 'taglia da definire',
  msgEnd: 'È disponibile?',
  mailSubject: (site: string) => `Richiesta dal catalogo ${site}`,

  // dates
  today: (t: string) => `oggi alle ${t}`,
  yesterday: (t: string) => `ieri alle ${t}`,
  onDay: (d: string, t: string) => `${d} alle ${t}`,

  notFoundTitle: 'Fuori misura',
  notFoundText: 'Questa pagina non esiste. Il catalogo invece sì.',
  pageNotFound: 'Pagina non trovata',
  modelNotFound: 'Modello non trovato',
};

export type Dict = typeof it;

const en: Dict = {
  locale: 'en',
  catalog: 'Catalogue',
  writeUs: 'Message us',
  favorites: 'Favourites',
  language: 'Language',
  themeToggle: 'Switch light/dark theme',
  greeting: (site) => `Hi! I'm writing from the ${site} catalogue.`,
  tagline: 'Authentic sneakers, live availability',
  priceNote: (vatIncluded) => (vatIncluded ? 'Prices include VAT' : 'Prices exclude VAT'),
  vatTag: '+ VAT',
  footerNote: 'Availability and prices may change: you get the confirmation when you message us.',

  coverKicker: 'Sneakers catalogue',
  coverTitle: ['Sneakers', 'in stock'],
  coverLead: (models, brands) =>
    `${models} models from ${brands} brands, with the sizes and price of every pair. Pick one and ask us in a message.`,
  browse: 'Browse the catalogue',
  askOn: (channel) => `Message us on ${channel}`,
  statModels: 'models',
  statBrands: 'brands',
  statPairs: 'pairs in stock',
  updated: (when) => `Availability updated ${when}`,
  newTitle: 'Just landed',
  featuredTitle: 'Featured',
  newLead: 'The latest models in the catalogue.',
  featuredLead: 'The models with the most sizes in stock.',
  seeAll: 'See all',
  howTitle: 'How it works',
  how: [
    ['Choose', 'Filter by brand, size and price. Set your size once: the catalogue only shows what’s there.'],
    ['Ask', 'Tap “Request”: the message is already written with model, code, size and price. More pairs? Save them to favourites and send them all at once.'],
    ['Get confirmation', 'We reply with availability and price confirmed, and we sort out the rest together.'],
  ],
  catalogTitle: 'The whole catalogue',
  ctaTitle: 'A question about a model or a size?',
  ctaLead: 'Message us: we answer ourselves, no forms, no sign-up.',
  prev: 'Previous',
  next: 'Next',

  search: 'Search',
  searchPlaceholder: 'Search model, brand or code…',
  clearSearch: 'Clear search',
  yourSize: 'Your size',
  nSizes: (n) => `${n} sizes`,
  sort: 'Sort',
  sorts: {
    rilevanza: 'Featured',
    novita: 'Newest',
    prezzo_asc: 'Price: low to high',
    prezzo_desc: 'Price: high to low',
    nome: 'Name A–Z',
  },
  filters: 'Filters',
  closeFilters: 'Close filters',
  category: 'Category',
  categories: { adult: 'Adult', gs: 'Grade school · GS', ps: 'Pre-school · PS' },
  sizeEu: 'EU size',
  brand: 'Brand',
  price: 'Price',
  priceFrom: 'From €',
  priceTo: 'To €',
  showSoldOut: 'Show sold-out too',
  apply: 'Apply filters',
  reset: 'Reset',
  resetAll: 'Clear all',
  showN: (n) => `Show ${n} ${plural(n, 'model', 'models')}`,
  models: (n) => plural(n, 'model', 'models'),
  inYourSize: ' in your size',
  removeFilter: (l) => `Remove filter ${l}`,
  chipFrom: (n) => `from €${n}`,
  chipTo: (n) => `up to €${n}`,
  emptyTitle: 'No pairs',
  emptySize: 'Nothing matches in this size. Try removing a filter or another size.',
  emptyAny: 'No model matches your search. Try fewer words or remove a filter.',
  seeCatalog: 'See the whole catalogue',
  more: 'Show more',
  offline: 'You’re offline: filters update when you reload the page',

  from: 'from',
  sizesCount: (n) => (n === 0 ? 'Sold out' : plural(n, '1 size', `${n} sizes`)),
  sizesAvailable: 'Sizes in stock (EU)',
  soldOut: 'Sold out',
  isNew: 'New',
  lastPairs: 'Last pairs',
  favAdd: (name) => `Add ${name} to favourites`,
  favRemove: (name) => `Remove ${name} from favourites`,
  favAdded: 'Added to favourites',
  favRemoved: 'Removed from favourites',

  code: 'Code',
  pickSize: 'Choose your size',
  sizeSystem: 'Size system',
  sizeLabel: (eu) => `EU size ${eu}`,
  soldOutSize: 'sold out',
  lastOne: 'Last one',
  lastN: (n) => `Last ${n}`,
  allSoldOut: 'Sold out in every size right now. Save it to favourites and ask us when it’s back.',
  requestSize: (eu, channel) => `Request size ${eu} on ${channel}`,
  askChannel: (channel) => `Ask on ${channel}`,
  favAddShort: 'Add to favourites',
  favRemoveShort: 'Remove from favourites',
  share: 'Share',
  linkCopied: 'Link copied',
  pickHint: 'Choose your size: we write it in the message, with model and price.',
  sizesInStock: 'Sizes in stock',
  ofTotal: (a, b) => `${a} of ${b}`,
  availability: 'Availability',
  updatedShort: (when) => `updated ${when}`,
  moreFrom: (brand) => `More ${brand}`,
  youMayLike: 'You may also like',
  path: 'Breadcrumb',
  goneTitle: 'Gone',
  goneText: 'This model is no longer in the catalogue: sold out or withdrawn by the supplier. Have a look at what’s in stock.',
  goToCatalog: 'Go to the catalogue',

  favTitle: 'Your favourites',
  favLoading: 'Loading your favourites…',
  favEmptyTitle: 'Nothing yet',
  favEmptyText: 'Tap the heart on a model to keep it here. Then pick the sizes and send us the list in one message.',
  favGone: (n) => (n === 1 ? 'A model you saved is no longer in the catalogue.' : `${n} models you saved are no longer in the catalogue.`),
  favSizeFor: (name) => `Size for ${name}`,
  soldOutAll: 'Sold out in every size',
  remove: 'Remove',
  favTotal: (pairs) => ` for ${pairs} ${plural(pairs, 'pair', 'pairs')} with a size`,
  clearList: 'Clear the list',
  clearConfirm: 'Clear your favourites?',
  sendList: (channel) => `Send the list on ${channel}`,

  msgOne: 'Hi! I’d like this pair:',
  msgMany: (n) => `Hi! I’d like these ${n} pairs:`,
  msgSize: (eu) => `EU size ${eu}`,
  msgNoSize: 'size to be decided',
  msgEnd: 'Is it available?',
  mailSubject: (site) => `Request from the ${site} catalogue`,

  today: (t) => `today at ${t}`,
  yesterday: (t) => `yesterday at ${t}`,
  onDay: (d, t) => `${d} at ${t}`,

  notFoundTitle: 'Wrong size',
  notFoundText: 'This page doesn’t exist. The catalogue does.',
  pageNotFound: 'Page not found',
  modelNotFound: 'Model not found',
};

const DICTS: Record<Locale, Dict> = { it, en };

export function t(locale: Locale): Dict {
  return DICTS[locale] ?? it;
}

/** The visitor's language: their choice (cookie), else the browser's first one. */
export function detectLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const first = (acceptLanguage ?? '').split(',')[0]?.trim().toLowerCase() ?? '';
  return first === '' || first.startsWith('it') ? 'it' : 'en';
}
