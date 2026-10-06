import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = process.env.VOTEAPP_PUBLIC_API || "https://voteapp.eu/api/public/issues";
const ROOT = process.cwd();
const CASES_DIR = path.join(ROOT, "saker");
const DATA_DIR = path.join(ROOT, "data");

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function fmtDate(value) {
  if (!value) return "Ikke oppgitt";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "long" }).format(date);
}

function geography(issue) {
  if (issue.geoLevel === "nation") return "Hele Norge";
  return [issue.municipalityName, issue.countyName].filter(Boolean).join(", ") || "Geografi ikke oppgitt";
}

function textFrom(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textFrom).filter(Boolean).join(" · ");
  if (typeof value === "object") {
    for (const key of ["claim", "text", "summary", "description", "effect", "name", "title", "value", "note", "statement"]) {
      if (value[key] != null) return textFrom(value[key]);
    }
    return Object.entries(value)
      .filter(([key]) => !["url", "sourceIds", "source_ids", "sources", "id"].includes(key))
      .map(([, v]) => textFrom(v))
      .filter(Boolean)
      .join(" · ");
  }
  return "";
}

function sourceIds(value) {
  if (!value || typeof value !== "object") return [];
  const raw = value.sourceIds || value.source_ids || value.sources || [];
  return Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? [raw] : [];
}

function renderItems(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  if (!items.length) return "";
  return items.map((item) => {
    const text = textFrom(item);
    const ids = sourceIds(item);
    if (!text) return "";
    return `<div class="fact"><p>${esc(text)}</p>${ids.length ? `<div class="source-ids">Kilder: ${esc(ids.join(", "))}</div>` : ""}</div>`;
  }).join("");
}

function renderCard(title, value) {
  const content = renderItems(value);
  if (!content) return "";
  return `<article class="card"><h3>${esc(title)}</h3>${content}</article>`;
}

function collectSources(card) {
  const candidates = [card?.sourceJournal, card?.source_journal, card?.sources, card?.sourceRegistry, card?.source_registry];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function renderSources(card) {
  const sources = collectSources(card);
  if (!sources.length) return `<p class="lead">Kildelisten finnes i VoteApp-saken. Automatisk fullvisning her blir utvidet videre.</p>`;
  return `<div class="sources">${sources.map((source, index) => {
    const id = source?.id || source?.sourceId || source?.source_id || `Kilde ${index + 1}`;
    const title = source?.title || source?.name || source?.publisher || source?.url || `Kilde ${index + 1}`;
    const publisher = source?.publisher || source?.organization || source?.domain || "";
    const relevance = source?.relevance || source?.note || source?.why || "";
    const limitations = source?.limitations || source?.limitation || "";
    const url = safeUrl(source?.url || source?.link);
    return `<article class="source"><strong>${esc(id)} · ${esc(title)}</strong>${publisher ? `<small>${esc(publisher)}</small>` : ""}${relevance ? `<small>Relevans: ${esc(relevance)}</small>` : ""}${limitations ? `<small>Begrensning: ${esc(limitations)}</small>` : ""}${url ? `<small><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Åpne kilden</a></small>` : ""}</article>`;
  }).join("")}</div>`;
}

function pageHtml(issue) {
  const card = issue.deepDive?.knowledgeCard || {};
  const sources = collectSources(card);
  const sourceCount = sources.length || card.sourceCount || card.source_count || 0;
  const hero = safeUrl(issue.heroSrc);
  const canonical = `https://stemmeapp.no/saker/${encodeURIComponent(issue.slug)}/`;
  const voteUrl = safeUrl(issue.voteUrl) || `https://voteapp.eu/saker/${encodeURIComponent(issue.slug)}`;
  const note = card.questionNote || card.question_note || "";
  const statusLabel = issue.closed || issue.status === "closed" ? "Lukket" : "Åpen for innspill";
  const description = issue.description || "";

  const cards = [
    renderCard("Hvem kan beslutte?", card.whoDecides || card.who_decides),
    renderCard("Status i dag", card.statusToday || card.status_today),
    renderCard("Dokumenterte hovedfunn", card.facts || card.documentedFacts || card.documented_facts),
    renderCard("Erfaringer og attribuerte påstander", card.attributedClaims || card.attributed_claims || card.livedExperience || card.lived_experience),
    renderCard("Dokumenterte virkninger", card.documentedEffects || card.documented_effects),
    renderCard("Økonomi", card.economicLedger || card.economic_ledger || card.costs),
    renderCard("Naturens regnskap", card.natureLedger || card.nature_ledger),
    renderCard("Interesser og roller", card.interests || card.roles || card.stakeholders),
    renderCard("Lovgrunnlag", card.legal || card.legalBasis || card.legal_basis),
    renderCard("Usikkerhet og kunnskapshull", card.uncertainties || card.knowledgeGaps || card.knowledge_gaps)
  ].filter(Boolean).join("");

  return `<!doctype html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${esc(issue.question)} — offentlig saksside fra StemmeApp.no.">
  <meta property="og:title" content="${esc(issue.title)} — StemmeApp.no">
  <meta property="og:description" content="${esc(issue.question)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${esc(canonical)}">
  ${hero ? `<meta property="og:image" content="${esc(hero)}">` : ""}
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" href="/favicon.png">
  <link rel="stylesheet" href="/saker/sak.css">
  <title>${esc(issue.title)} — StemmeApp.no</title>
</head>
<body>
<header><div class="wrap nav"><a class="brand" href="/"><img src="/favicon.png" alt=""><span>StemmeApp.no</span></a><a href="/">Alle saker</a></div></header>
<main>
  <section class="hero"><div class="wrap">
    <div class="breadcrumbs"><a href="/">Forside</a> / Sak / ${esc(issue.title)}</div>
    <div class="case-grid">
      <div>
        <span class="badge">${esc(statusLabel)}</span>
        <h1 class="question">${esc(issue.question)}</h1>
        ${description ? `<p class="lead">${esc(description)}</p>` : ""}
        ${note ? `<div class="card notice"><strong>Merknad til ordlyden</strong><p>${esc(note)}</p></div>` : ""}
        <div class="meta">
          <span>${esc(geography(issue))}</span>
          <span>${esc(issue.participationCount || 0)} deltakere</span>
          ${issue.deadline ? `<span>Frist ${esc(fmtDate(issue.deadline))}</span>` : ""}
          ${sourceCount ? `<span>${esc(sourceCount)} journalførte kilder</span>` : ""}
        </div>
        <div class="cta"><a class="btn btn-primary" href="${esc(voteUrl)}">Åpne saken i VoteApp</a><a class="btn btn-secondary" href="#kunnskap">Se kunnskapsgrunnlaget</a></div>
      </div>
      ${hero ? `<figure class="hero-media"><img src="${esc(hero)}" alt="${esc(issue.heroAlt || issue.title)}" width="1280" height="720"></figure>` : ""}
    </div>
  </div></section>

  <section><div class="wrap grid">
    <article class="card"><div class="label">Spørsmålet</div><h2>Innsenderens spørsmål står fast</h2><p>StemmeApp skal forklare dokumenterte svakheter, premisser og usikkerhet uten å overta innsenderens politiske hensikt.</p></article>
    <article class="card"><div class="label">Status</div><h2>${esc(statusLabel)}</h2><p>${esc(geography(issue))}${issue.deadline ? ` · frist ${esc(fmtDate(issue.deadline))}` : ""}.</p></article>
  </div></section>

  <section id="kunnskap"><div class="wrap">
    <div class="card"><div class="label">Deep Dive</div><h2>Hva er dokumentert — og hva vet vi fortsatt ikke?</h2><p>Dette er den publiserte kunnskapspakken som følger saken. StemmeApp anbefaler ikke hvilket alternativ du bør velge.</p></div>
    <div class="grid" style="margin-top:1rem">${cards || `<article class="card"><p>Kunnskapsgrunnlaget finnes i VoteApp og blir synkronisert videre til denne siden.</p></article>`}</div>
  </div></section>

  <section id="kilder"><div class="wrap"><div class="card"><div class="label">Kilder</div><h2>${sourceCount ? `${esc(sourceCount)} journalførte kilder` : "Kildegrunnlag"}</h2>${renderSources(card)}</div></div></section>

  <section><div class="wrap"><div class="card"><div class="label">Sporbarhet</div><h2>Publisert Deep Dive-versjon</h2><p class="deep-meta">Versjon: ${esc(issue.deepDive?.version || "—")}<br>Fryst: ${esc(fmtDate(issue.deepDive?.frozenAt))}<br>Hash: ${esc(issue.deepDive?.contentHash || "—")}</p>${issue.deepDive?.aiDisclosure ? `<p>${esc(issue.deepDive.aiDisclosure)}</p>` : ""}</div></div></section>
</main>
<footer><div class="wrap"><p><strong>StemmeApp.no</strong> · Rådgivende innbyggerdeltakelse. Ikke et offentlig valgsystem.</p><p>Siden oppdateres automatisk fra den publiserte saken i VoteApp. Sist generert ${esc(new Date().toISOString())}.</p></div></footer>
</body></html>`;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "stemmeapp-no-case-sync/1.0" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} fra ${url}`);
  return response.json();
}

async function main() {
  const feed = await fetchJson(API_BASE);
  const summaries = Array.isArray(feed.issues) ? feed.issues : [];
  if (!summaries.length) throw new Error("Offentlig saksfeed returnerte ingen saker; avbryter uten å slette eksisterende sider.");

  const details = [];
  for (const summary of summaries) {
    const detail = await fetchJson(`${API_BASE}/${encodeURIComponent(summary.slug)}`);
    if (!detail.issue) throw new Error(`Mangler detaljdata for ${summary.slug}`);
    details.push(detail.issue);
  }

  await fs.mkdir(CASES_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });

  const existing = await fs.readdir(CASES_DIR, { withFileTypes: true });
  const keep = new Set(details.map((issue) => issue.slug));
  for (const entry of existing) {
    if (entry.isDirectory() && !keep.has(entry.name)) {
      await fs.rm(path.join(CASES_DIR, entry.name), { recursive: true, force: true });
    }
  }

  for (const issue of details) {
    const dir = path.join(CASES_DIR, issue.slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), pageHtml(issue), "utf8");
  }

  const publicIndex = {
    generatedAt: new Date().toISOString(),
    issues: details.map((issue) => ({
      slug: issue.slug,
      title: issue.title,
      question: issue.question,
      description: issue.description,
      status: issue.status,
      deadline: issue.deadline,
      geoLevel: issue.geoLevel,
      municipalityName: issue.municipalityName,
      countyName: issue.countyName,
      participationCount: issue.participationCount,
      interestTags: issue.interestTags,
      heroSrc: issue.heroSrc,
      heroAlt: issue.heroAlt,
      pageUrl: `https://stemmeapp.no/saker/${encodeURIComponent(issue.slug)}/`,
      voteUrl: issue.voteUrl
    }))
  };
  await fs.writeFile(path.join(DATA_DIR, "issues.json"), JSON.stringify(publicIndex, null, 2) + "\n", "utf8");

  const urls = ["https://stemmeapp.no/", "https://stemmeapp.no/trust.html", ...details.map((issue) => `https://stemmeapp.no/saker/${encodeURIComponent(issue.slug)}/`)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${esc(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
  await fs.writeFile(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");

  console.log(`Synkroniserte ${details.length} publiserte saker til stemmeapp.no.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
