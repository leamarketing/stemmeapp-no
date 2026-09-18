# StemmeApp.no — statisk forside

Lett `index.html` uten eksterne CSS/JS-bibliotek. Egnet for høy trafikk via GitHub Pages eller CDN.

## Innhold

- Produktforklaring (nettside + app + Deep Dive)
- Geografisk URL-struktur
- Tillit / sikkerhetsprinsipper
- Nordreisa-pilot

## GitHub Pages

1. Lag nytt repo (f.eks. `stemmeapp-no` eller bruk `username.github.io`).
2. Last opp innholdet i denne mappen til `main`.
3. Settings → Pages → Source: Deploy from branch → `main` / `/ (root)`.
4. Koble eventuelt `stemmeapp.no` som custom domain (CNAME).

## Organisering senere

Når flere sider kommer, behold samme stil og del i mapper:

```
/
  index.html          ← denne filen
  no/
    index.html
    troms/
      nordreisa/
        index.html
```

Eller bygg videre med Next.js/Supabase fra ferdigmalen — denne HTML-en forblir en rask landing.

## Merknad

Ikke et offisielt valgsystem. Se Deep Dive-kildefil og spesifikasjon i prosjektmappen `01-StemmeApp`.
