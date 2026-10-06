import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'data', 'participation-opportunities.json');
const OUT_DIR = path.join(ROOT, 'paavirk');
const OUT = path.join(OUT_DIR, 'index.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

function esc(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fmtDate(value) {
  if (!value) return '';
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('nb-NO', { dateStyle: 'long' }).format(d);
}

function active(op) {
  if (!op.deadline) return true;
  const deadline = new Date(`${op.deadline}T23:59:59`);
  return deadline.getTime() >= Date.now();
}

const raw = JSON.parse(await fs.readFile(DATA, 'utf8'));
const issueEntries = Object.entries(raw.issues || {});
const opportunities = [];
for (const [issueSlug, issueData] of issueEntries) {
  for (const op of issueData.opportunities || []) {
    if (!active(op)) continue;
    opportunities.push({ issueSlug, issueIntro: issueData.intro || '', ...op });
  }
}

opportunities.sort((a, b) => {
  const ad = a.deadline || '9999-12-31';
  const bd = b.deadline || '9999-12-31';
  return ad.localeCompare(bd) || String(a.title).localeCompare(String(b.title), 'nb');
});

const cards = opportunities.map((op) => `
<article class="card">
  <div class="eyebrow">${esc(op.stage || 'Formell medvirkning')}</div>
  <h2>${esc(op.title)}</h2>
  <div class="meta">
    ${op.authority ? `<span>${esc(op.authority)}</span>` : ''}
    ${op.scope ? `<span>${esc(op.scope)}</span>` : ''}
    ${op.deadline ? `<span>Frist ${esc(fmtDate(op.deadline))}</span>` : ''}
  </div>
  ${op.relevance ? `<p>${esc(op.relevance)}</p>` : ''}
  <div class="actions">
    <a class="btn primary" href="${esc(op.url)}">${esc(op.actionLabel || 'Åpne offisiell side')} ↗</a>
    <a class="btn" href="/saker/${encodeURIComponent(op.issueSlug)}/">Se StemmeApp-saken</a>
  </div>
</article>`).join('\n');

const html = `<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Åpne høringer og andre formelle påvirkningsmuligheter knyttet til saker i StemmeApp.">
  <title>Påvirk nå · StemmeApp.no</title>
  <link rel="icon" href="/favicon.png">
  <style>
    :root{--bg:#081b17;--panel:#102c25;--line:rgba(143,255,190,.18);--text:#ecf8f2;--muted:#9eb8ad;--accent:#7dffb3;--max:1120px}
    *{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:radial-gradient(900px 480px at 100% 0,#0e3a55 0,transparent 52%),var(--bg);color:var(--text);line-height:1.55}a{color:inherit}.wrap{width:min(100% - 2rem,var(--max));margin:auto}.top{position:sticky;top:0;z-index:5;background:rgba(8,27,23,.88);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}.nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem 0;flex-wrap:wrap}.brand{font-weight:800;text-decoration:none}.links{display:flex;gap:.9rem;flex-wrap:wrap}.links a{text-decoration:none;color:var(--muted)}.links a:hover,.links .active{color:var(--accent)}.hero{padding:3.5rem 0 2rem}.badge,.eyebrow{display:inline-block;color:var(--accent);font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.05;max-width:12ch;margin:.7rem 0}h2{margin:.3rem 0 .6rem;font-size:1.25rem}.lead{max-width:48rem;color:var(--muted);font-size:1.08rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;padding:1rem 0 4rem}.card{background:linear-gradient(180deg,rgba(255,255,255,.03),transparent),var(--panel);border:1px solid var(--line);border-radius:18px;padding:1.2rem}.card p{color:var(--muted)}.meta{display:flex;gap:.45rem;flex-wrap:wrap;margin:.75rem 0}.meta span{border:1px solid var(--line);border-radius:999px;padding:.3rem .6rem;color:var(--muted);font-size:.82rem}.actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem}.btn{display:inline-flex;padding:.7rem 1rem;border:1px solid var(--line);border-radius:999px;text-decoration:none;font-weight:700}.btn.primary{background:var(--accent);color:#062018;border-color:transparent}.note{border:1px solid rgba(255,210,138,.35);background:rgba(255,210,138,.08);border-radius:18px;padding:1rem 1.1rem;color:#ffe8c2;margin-top:1rem}footer{border-top:1px solid var(--line);padding:2rem 0 3rem;color:var(--muted)}
  </style>
  <script src="/external-links.js" defer></script>
</head>
<body>
<header class="top"><div class="wrap nav"><a class="brand" href="/">StemmeApp.no</a><nav class="links"><a href="/saker/">Saker nå</a><a class="active" href="/paavirk/">Påvirk nå</a><a href="/trust.html">Tillit</a><a href="https://voteapp.eu">VoteApp ↗</a></nav></div></header>
<main>
  <section class="hero"><div class="wrap"><span class="badge">Formell medvirkning</span><h1>Her kan du påvirke nå</h1><p class="lead">StemmeApp skiller mellom rådgivende avstemning og formelle offentlige prosesser. Her samler vi dokumenterte høringer, innspillsfrister og andre åpne kanaler der innbyggere faktisk kan sende innspill.</p><div class="note"><strong>Viktig:</strong> En oppføring her betyr ikke at StemmeApp-spørsmålet selv er på offentlig høring. Vi viser relevante, separate påvirkningskanaler og lenker alltid til den offisielle mottakeren.</div></div></section>
  <section><div class="wrap grid">${cards || '<article class="card"><h2>Ingen aktive påvirkningsinnganger registrert akkurat nå</h2><p>Listen oppdateres når vi har dokumenterte offentlige kanaler å vise.</p></article>'}</div></section>
</main>
<footer><div class="wrap"><strong>StemmeApp.no</strong><p>Kontrollert mot kilderegisteret ${esc(raw.checkedAt || '')}. Eksterne lenker åpnes i ny fane.</p></div></footer>
</body></html>`;

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT, html, 'utf8');

try {
  let sitemap = await fs.readFile(SITEMAP, 'utf8');
  const entry = '  <url><loc>https://stemmeapp.no/paavirk/</loc></url>';
  if (!sitemap.includes('https://stemmeapp.no/paavirk/')) {
    sitemap = sitemap.replace('</urlset>', `${entry}\n</urlset>`);
    await fs.writeFile(SITEMAP, sitemap, 'utf8');
  }
} catch {}

console.log(`Genererte Påvirk nå med ${opportunities.length} aktive innganger.`);
