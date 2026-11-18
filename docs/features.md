# Funzionalità: cosa c'è e cosa proporre al cliente

## Già nella prima versione

**Per chi compra**
- **Filtri istantanei**: brand, taglia EU, categoria (adulto / GS / PS),
  prezzo, esauriti. I conteggi si aggiornano mentre si sceglie. La ricerca
  ignora maiuscole e accenti e cerca anche il codice. Il link resta
  condivisibile (i filtri sono nell'URL) e tutto funziona anche senza JavaScript.
- **"La tua taglia"**: si sceglie una volta e resta ricordata. Il catalogo
  mostra solo i modelli disponibili in quella taglia, con il prezzo di quella
  taglia, che è poi preselezionata nella scheda prodotto.
- **Scheda prodotto**: prezzo per ogni taglia, switch EU/US, badge
  "Ultimo"/"Ultimi 2" sulla taglia, condivisione (menu nativo del telefono,
  altrimenti copia del link) e "Altri dello stesso brand".
- **Richiesta in un tocco**: WhatsApp precompilato con modello, codice,
  taglia, prezzo e link. In alternativa e-mail.
- **Preferiti**: cuore su ogni modello e pagina `/preferiti`. Ogni modello ha
  la sua taglia e il totale si calcola da solo; si invia **tutta la lista in
  un unico messaggio**.
- **Badge**: "Novità" (modelli comparsi negli ultimi 14 giorni), "Ultimi
  pezzi", "Esaurito". Gli esauriti stanno sempre in fondo.
- **"Disponibilità aggiornata oggi alle 14:05"**: l'orario vero dell'ultimo
  sync di scs-b2b.

**Per il titolare**
- Le immagini passano dal nostro server: il fornitore non compare da nessuna
  parte nella pagina.
- Se scs-b2b è giù, il sito continua a funzionare con l'ultima copia.
  `/healthz` dice quanto è fresco il catalogo.
- Non c'è nulla da amministrare: markup, contatti e soglie dei badge stanno
  nel `.env`.

## Proposte

Effort: S = mezza giornata, M = 1–2 giorni, L = 3+ giorni.

### Quelle che consiglio subito

| # | Funzione | Per chi | Effort | Perché |
|---|---|---|---|---|
| 1 | **Avvisami quando torna** (o quando arriva la mia taglia) | cliente | M | Trasforma un "esaurito" in un contatto. Il cliente lascia e-mail o WhatsApp; quando la taglia rientra nel feed parte l'avviso. Serve un piccolo database (SQLite) e l'invio e-mail. |
| 2 | **Statistiche per il titolare**: modelli più visti e più salvati, taglie più cercate, **ricerche senza risultati** | titolare | S | Dice cosa spingere e cosa manca. Analytics senza cookie (Umami/Plausible) con eventi personalizzati, quindi niente banner cookie. |
| 3 | **"Scelti da Ignazio"**: selezione in evidenza in testa al catalogo | titolare | S | Il titolare decide cosa mettere in vetrina, senza admin: basta un elenco di codici in un file. |
| 4 | **Prezzo in calo**: badge "−5 €" quando il prezzo di un modello scende | cliente | S | Conserviamo la storia dei prezzi a ogni aggiornamento. Fa tornare chi aveva messo il modello nei preferiti. |
| 5 | **Card per le storie Instagram** di ogni modello (1080×1920, foto, prezzo, QR) | entrambi | M | Il titolare pubblica un modello in due tocchi; anche il cliente la condivide. Le genera il server, come le immagini. |

### Altre idee

**Per chi compra**
- **App installabile (PWA)** con il catalogo consultabile anche offline o con
  poco segnale (S).
- **Guida taglie per brand**: EU/US/UK/cm e note "veste piccola" per Nike,
  Adidas, New Balance… Il dubbio sulla taglia frena l'acquisto (S).
- **Visti di recente** e **confronta 2–3 modelli** affiancati (S).
- **Lista condivisibile**: i preferiti diventano un link da girare a un amico
  o al gruppo (S).
- **Scanner del codice a barre** della scatola: in negozio o in fiera si
  inquadra l'EAN e si apre la scheda. L'API di scs-b2b espone già i barcode;
  qui oggi non li mandiamo al browser (M).
- **"Appena arrivati" della settimana**: una striscia in home con le novità.
  Volendo, anche un riepilogo settimanale via e-mail o broadcast WhatsApp (S/M).

**Per il titolare**
- **Markup differenziato** (per brand o fascia di prezzo), oggi fisso a
  3,00 €: una regola in configurazione, senza admin (S).
- **Brand o modelli nascosti**: un elenco di esclusioni (S).
- **QR code per prodotto**, da stampare per esposizione o eventi (S).
- **Fonte della richiesta nel messaggio WhatsApp** (Instagram, campagna,
  QR…): così si sa da dove arrivano gli ordini (S).
- **Lookbook PDF** del catalogo o di una selezione, da mandare ai clienti (M).
- **Avviso al titolare** se il catalogo non si aggiorna da più di N ore (S).

## Da decidere con il cliente

- **IVA**: deciso. Si mostrano solo prezzi imponibili, margine incluso
  (`imponibile + 3,00`, IVA del listino scorporata se c'è), con la dicitura «IVA esclusa» / «+ IVA» accanto. Con
  `VAT_RATE=22` si torna ai prezzi IVA inclusa.
- **Contatti**: numero WhatsApp, e-mail e Instagram ancora da avere.
- **Logo / identità**: oggi il nome è scritto con il carattere del sito.
