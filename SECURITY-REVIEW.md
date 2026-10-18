# Sikkerhetsgjennomgang – 18. oktober 2026

stemmeapp.no er den offentlige informasjonssiden på GitHub Pages. Innlogging og stemmegivning skjer i VoteApp. Denne grenen endrer ikke merkevare, bilder, DNS eller vertsløsning.

Synkroniseringsskriptet avviser ugyldige, doble og avvikende saksadresser før filskriving og sletting. Dermed kan data fra saksfeeden ikke brukes som stier utenfor saksområdet. Påvirkningslisten avviser andre URL-skjema enn HTTP/HTTPS og adresser med innbakte legitimasjonsopplysninger. Menylenker til saker bygges lokalt. Eksisterende tekstescaping er beholdt.

Fire isolerte tester kontrollerer filstier, lenker, escaping og at en ondsinnet detaljadresse ikke endrer eksisterende filer. Ingen virkelige skjemaer eller stemmer sendes i testene. GitHub Actions er pinnet til kontrollerte commit-ID-er, bruker Node 24 og begrenser skrivetilgang til synkroniseringsjobben. Synkroniseringen kjører bare fra main ved push. Dependabot foreslår videre action-oppdateringer.

De observerte offentlige svarene fra GitHub Pages mangler flere nettleserbeskyttende headere. En `_headers`-fil gir ikke denne funksjonen på GitHub Pages. Full styring av slike headere krever en egnet vertsløsning eller proxy; det er et eget driftstiltak. Ingen slik flytting er gjennomført her.

Før sammenslåing: se at CI består, kontroller en normal sakssynkronisering og behold eksisterende genererte sakssider. Den ordinære cron-jobben vil fortsette å oppdatere publiserte saker. Full rapport om VoteApp, database, tofaktor og krav til en framtidig kundeutgave ligger i den private app-repoens `docs/security-review-2026-10-18.md`.
