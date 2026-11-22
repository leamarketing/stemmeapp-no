# Språk på StemmeApp og VoteApp: plan

Utkast 21.11.2026. Språk: engelsk, portugisisk, spansk og kinesisk. Norsk er alltid originalen.
Samisk og kvensk lages ikke med KI: de må skrives av folk som har språket.

## Kort fortalt

- Knapper, menyer og forklaringer oversettes direkte, med en tydelig stripe øverst:
  «Oversatt fra norsk med hjelp av KI. Den norske teksten er originalen.» med en knapp «Vis på norsk».
- Selve sakene (spørsmålet, svaralternativene, kildene, argumentene, Deep Dive-teksten) byttes aldri ut stille.
  De står på norsk til en oversettelse er laget, merket og helst lest av et menneske.
- Første steg er gjort: språkmeny og engelsk forside på stemmeapp.no (egen PR, ikke slått sammen).

## Hva som oversettes, og hva som ikke gjør det

| Del | Oversettes? | Hvordan |
|---|---|---|
| Meny, knapper, bunntekst, hjelpetekst | Ja | Direkte, ordliste per språk |
| Forklarende sider (forside, Tillit og metode, Slik arbeider vi, Tilbakemelding) | Ja | Direkte, med stripen øverst |
| Saksnavn i lister og menyer | Nei, foreløpig | Står på norsk, med en linje som sier det |
| Spørsmålet folk stemmer på og svaralternativene | Bare merket | Se «Merking av saksinnhold» under |
| Kilder, sitater, dokumenter fra kommunen | Nei | Originalspråket er selve kilden |
| Argumenter og innlegg fra folk i forumet | Bare merket, og bare på forespørsel | Den som leser trykker «Oversett», originalen står ved siden av |
| KI-instruksene i Deep Dive (koden bak Klara, Sofia og de andre) | Nei | Dette er ikke tekst folk ser |
| Admin og saksbehandling (dashboard) | Nei, foreløpig | De som bruker det, er norske |
| E-post (innloggingslenke, varsler) | Ja, senere | Etter at appen har språkvalg |

## Merking av saksinnhold

En demokratiplattform kan ikke la en maskin endre ordene i et spørsmål uten at det synes. Forslag:

1. **Norsk er alltid den gjeldende versjonen.** Stemmen gjelder det norske spørsmålet, slik det ble fryst og godkjent.
2. **Oversatt saksinnhold får en egen merkelapp** rett over teksten, på leserens språk og på norsk:
   «Maskinoversatt. Originalen er på norsk.» med knappen «Vis originalen».
   Er oversettelsen lest av et menneske: «Oversatt og kontrollert av [navn/rolle], [dato]. Originalen er på norsk.»
3. **Originalen er alltid ett trykk unna**, og trykket bytter bare den ene teksten, ikke hele siden.
4. **Svaralternativene vises med norsk original under** den oversatte teksten, i liten skrift, så ingen er i tvil om hva de svarer på.
5. **Oversettelsen fryses sammen med spørsmålet.** Endres det norske spørsmålet, merkes oversettelsen som utdatert til den er laget på nytt.
6. **Kinesisk og andre språk vi ikke leser selv** merkes alltid «maskinoversatt» til en med morsmålet har lest det.

I koden er dette allerede forberedt: alt som står inne i et element med klassen `sakstekst` (eller `data-ikke-oversett`)
blir aldri byttet ut av språkmotoren. Saksnavnene i menyen «Nye saker» er merket slik nå.

## stemmeapp.no (statiske sider)

Teknikk: samme språkmotor som Min dag på test.voteapp.eu, i en slankere utgave (`lib/sprak.js`, `lib/sprakmeny.js`,
ordlister i `lib/sprak/<del>/<språk>.js`). På norsk gjør den ingenting, så siden bruker ikke mer strøm enn før.
Valget huskes i nettleseren, og `?lang=en` i adressen virker også.

Omfang, målt 21.11.2026:

| Side | Tekstbiter | Ord (omtrent) |
|---|---|---|
| Forsiden | 143 | 1 000 (**engelsk ferdig i første PR**) |
| Deep Dive-eksempel | 149 | 900 |
| Saksoversikten (`/saker/`) | 74 | 850 (mye er saksnavn) |
| Tillit og metode | 69 | 620 |
| Slik arbeider vi | 68 | 610 |
| Tilbakemelding (skjema) | 35 | 190 |
| Forum (side + forum.js) | 35 + det koden lager | 200 + ? |
| Påvirk nå | 19 | 130 |
| 41 sakssider | | ca. 100 000 (saksinnhold, se over) |

Grensesnittet på alle sidene er rundt 4 500 ord per språk. Sakssidene er tjue ganger mer, og det er saksinnhold.

Rekkefølge:
1. Forsiden på engelsk (gjort i første PR).
2. Tillit og metode, Slik arbeider vi, Tilbakemelding og Påvirk nå på engelsk.
3. Det faste rammeverket rundt sakssidene (overskrifter som «Kilder», «Frist», «Svaralternativer»), mens selve saken står på norsk med merkelapp.
4. Forum: knapper og menyer, så «Oversett»-knapp på innlegg.
5. Portugisisk, spansk og kinesisk for alt over, når engelsk er lest gjennom.
6. Egne adresser for søkemotorer (for eksempel `stemmeapp.no/en/`), hvis vi vil bli funnet på engelsk. Språkmotoren bytter tekst i nettleseren, så Google ser bare norsk i dag.

## voteapp.eu (Next.js-appen)

Her brukes ordentlig språkstøtte i Next (anbefalt: `next-intl` med én meldingsfil per språk, `messages/nb.json`, `messages/en.json` ...),
ikke tekstbytte i nettleseren. Teksten flyttes ut av koden og inn i meldingsfilene, fil for fil.

Omfang, målt 21.11.2026 (tekst som står skrevet rett i koden):

| Område | Filer | Tekstbiter | Ord | Oversettes? |
|---|---|---|---|---|
| Innbyggerappen: skjermer og kort (`components/pwa`) | 16 | ca. 430 | 2 300 | Ja, først |
| Innbyggersidene (`app/(citizen)`: forside, saker, varsler, foreslå, tillit) | 10 | ca. 320 | 2 250 | Ja, først |
| Innlogging og stemmesiden (`app/(auth)`, `app/vote`) | 6 | ca. 100 | 330 | Ja, først |
| Meny, ansvarsfraskrivelse og småbiter (`components/`) | 4 | ca. 20 | 130 | Ja, først |
| Feilmeldinger fra serveren (`app/api`) | 42 | ca. 200 | 1 300 | Bare de folk faktisk ser |
| Pilot og behandling (`lib/pilot`, `lib/processing`) | 12 | ca. 190 | 1 750 | Må sjekkes: noe er saksinnhold |
| Deep Dive-motoren (`lib/deepdive`) | 32 | ca. 850 | 9 100 | Nei: KI-instrukser og kontrollregler |
| Admin (`app/dashboard`, `app/admin`) | 9+ | ca. 400 | 2 100 | Nei, foreløpig |

Det folk ser i appen er altså rundt 4 000 til 5 000 ord per språk. Alt i alt står det rundt 20 000 ord i koden,
men mer enn halvparten er Deep Dive-instrukser og admin, som ikke skal oversettes nå.

Rekkefølge:
1. Sett opp `next-intl`, språkvalg (husket i en informasjonskapsel, ikke telefonens språk), og stripen «Oversatt fra norsk».
2. Flytt tekst ut av koden for innbyggerflyten: forside, saksliste, sakskort, stemmesiden, bekreftelse, resultat, innlogging.
3. Saksinnhold fra databasen: legg til en egen tabell for oversettelser per sak og versjon
   (språk, tekst, «maskinoversatt» eller «kontrollert av», dato, hvilken spørsmålsversjon den hører til),
   og vis merkelappen over. Uten slik rad vises norsk.
4. E-post og varsler på valgt språk.
5. Portugisisk, spansk og kinesisk.

Hver del blir egen gren og egen PR, og ingenting slås sammen før Geir skriver «Ja, merge NN».

## Det som ikke er avklart

- Hvem som leser gjennom engelsk, portugisisk, spansk og kinesisk. Kinesisk bør merkes «maskinoversatt» til en med morsmålet har lest det.
- Om oversatt saksinnhold skal lages automatisk når en sak publiseres, eller bare når noen ber om det.
- Om stemmeapp.no skal ha egne engelske adresser for søkemotorer.
- Bildene på forsiden (plakaten med fem steg, Deep Dive, Tillit) kan ha norsk tekst bakt inn i selve bildet. De er ikke byttet.
