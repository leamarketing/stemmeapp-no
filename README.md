# StemmeApp.no — statisk forside

Lett HTML uten eksterne CSS/JS-bibliotek. Egnet for høy trafikk via GitHub Pages eller CDN.

## Sider

| Fil | Innhold |
|-----|---------|
| `index.html` | Landing: produkt, geografi, Deep Dive, tillit, Nordreisa-pilot |
| `trust.html` | Trust Center — hva vi lover / ikke lover |
| `deep-dive-eksempel.html` | Illustrerende Deep Dive-case (Sandnes Fjord Camping / Nordreisa) |
| `tilbakemelding.html` | Skjema for feil, forslag og andre funn |

## Innhold

- Produktforklaring (nettside + app + Deep Dive)
- Geografisk URL-struktur
- Trust Center / sikkerhetsprinsipper (ID≠ballot, ingen live tally som standard)
- Deep Dive-eksempel med porter 0–7, kunnskapskort og innholdshash
- Nordreisa-pilot

## GitHub Pages

1. Repo: [leamarketing/stemmeapp-no](https://github.com/leamarketing/stemmeapp-no)
2. Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`.
3. Forventet URL: `https://leamarketing.github.io/stemmeapp-no/`
4. Koble eventuelt `stemmeapp.no` som custom domain (CNAME).

## Organisering senere

```
/
  index.html
  trust.html
  deep-dive-eksempel.html
  no/
    troms/
      nordreisa/
        ...
```

## Tilbakemelding

`tilbakemelding.html` sender JSON med `POST` til `https://voteapp.eu/api/feedback`. Siden har ingen API-nøkkel. Endepunktet (CORS fra stemmeapp.no) ligger i app-repoet. Hvis kallet feiler, er `mailto:admin@voteapp.eu` synlig på siden.

## Merknad

Ikke et offisielt valgsystem. Deep Dive-eksempelet er **illustrasjon** — ikke åpen avstemning.
