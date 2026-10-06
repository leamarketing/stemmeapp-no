(() => {
  function applyExternalTargets(root = document) {
    root.querySelectorAll('a[href]').forEach((link) => {
      const raw = link.getAttribute('href');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
      let url;
      try { url = new URL(raw, window.location.href); } catch { return; }
      if (!['http:', 'https:'].includes(url.protocol)) return;
      if (url.origin === window.location.origin) return;
      link.target = '_blank';
      const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
      rel.add('noopener');
      rel.add('noreferrer');
      link.rel = Array.from(rel).join(' ');
    });
  }

  function ensureRecentCasesStyles() {
    if (document.getElementById('recent-cases-styles')) return;
    const style = document.createElement('style');
    style.id = 'recent-cases-styles';
    style.textContent = `
      .recent-cases-menu{position:relative;display:inline-flex;align-items:center}
      .recent-cases-menu summary{list-style:none;cursor:pointer;color:inherit;font:inherit;padding:0;border:0;background:none;white-space:nowrap}
      .recent-cases-menu summary::-webkit-details-marker{display:none}
      .recent-cases-menu summary::after{content:' ▾';font-size:.8em;opacity:.8}
      .recent-cases-menu[open] summary::after{content:' ▴'}
      .recent-cases-panel{position:absolute;right:0;top:calc(100% + .7rem);width:min(92vw,390px);padding:.55rem;background:#102c25;border:1px solid rgba(125,255,179,.2);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.35);z-index:1000}
      .recent-cases-panel a{display:block;padding:.72rem .8rem;border-radius:11px;text-decoration:none;color:#e8f6ef!important;line-height:1.25}
      .recent-cases-panel a:hover,.recent-cases-panel a:focus{background:rgba(125,255,179,.09);outline:none}
      .recent-cases-panel strong{display:block;font-size:.92rem;font-weight:700}
      .recent-cases-panel small{display:block;margin-top:.2rem;color:#9bb8ab;font-size:.78rem}
      .recent-cases-panel .recent-all{margin-top:.35rem;border-top:1px solid rgba(125,255,179,.14);padding-top:.75rem;color:#7dffb3!important;font-weight:700}
      @media(max-width:720px){.recent-cases-panel{position:fixed;left:1rem;right:1rem;top:auto;width:auto;margin-top:.45rem}}
    `;
    document.head.appendChild(style);
  }

  function recentMenuHost() {
    return document.querySelector('.nav-links') ||
      document.querySelector('header .links') ||
      document.querySelector('header .nav');
  }

  function addForumNavigation() {
    const host = recentMenuHost();
    if (!host || host.querySelector('a[href="/forum/"],a[href="forum/"]')) return;
    const link = document.createElement('a');
    link.href = '/forum/';
    link.textContent = 'Forum';
    const voteAppLink = Array.from(host.querySelectorAll('a')).find((a) => {
      try { return new URL(a.href, window.location.href).hostname === 'voteapp.eu'; } catch { return false; }
    });
    if (voteAppLink) host.insertBefore(link, voteAppLink);
    else host.appendChild(link);
  }

  function addCaseForumButton() {
    const match = window.location.pathname.match(/^\/saker\/([^/]+)\/?$/);
    if (!match) return;
    const cta = document.querySelector('.hero .cta');
    if (!cta || cta.querySelector('a[href*="/forum/"]')) return;
    const link = document.createElement('a');
    link.href = `/forum/?sak=${encodeURIComponent(decodeURIComponent(match[1]))}`;
    link.className = 'btn btn-secondary';
    link.textContent = 'Diskuter saken';
    cta.appendChild(link);
  }

  function shortGeo(issue) {
    if (issue.geoLevel === 'nation') return 'Hele Norge';
    return issue.municipalityName || issue.countyName || '';
  }

  async function addRecentCasesMenu() {
    if (document.querySelector('.recent-cases-menu')) return;
    const host = recentMenuHost();
    if (!host) return;

    let data;
    try {
      const response = await fetch('/data/issues.json', { cache: 'no-store' });
      if (!response.ok) return;
      data = await response.json();
    } catch {
      return;
    }

    const issues = Array.isArray(data?.issues) ? data.issues : [];
    if (!issues.length) return;

    const recent = issues.slice(-6).reverse();
    ensureRecentCasesStyles();

    const details = document.createElement('details');
    details.className = 'recent-cases-menu';

    const summary = document.createElement('summary');
    summary.textContent = 'Nye saker';
    summary.setAttribute('aria-label', 'Nylig publiserte saker');
    details.appendChild(summary);

    const panel = document.createElement('div');
    panel.className = 'recent-cases-panel';

    recent.forEach((issue) => {
      const a = document.createElement('a');
      a.href = issue.pageUrl || `/saker/${encodeURIComponent(issue.slug)}/`;
      const strong = document.createElement('strong');
      strong.textContent = issue.title || issue.question || 'Ny sak';
      const small = document.createElement('small');
      small.textContent = shortGeo(issue);
      a.append(strong, small);
      panel.appendChild(a);
    });

    const all = document.createElement('a');
    all.href = '/saker/';
    all.className = 'recent-all';
    all.textContent = 'Se alle saker →';
    panel.appendChild(all);

    details.appendChild(panel);

    const voteAppLink = Array.from(host.querySelectorAll('a')).find((a) => {
      try { return new URL(a.href, window.location.href).hostname === 'voteapp.eu'; } catch { return false; }
    });
    if (voteAppLink) host.insertBefore(details, voteAppLink);
    else host.appendChild(details);

    document.addEventListener('click', (event) => {
      if (details.open && !details.contains(event.target)) details.removeAttribute('open');
    });
  }

  async function init() {
    addForumNavigation();
    addCaseForumButton();
    applyExternalTargets();
    await addRecentCasesMenu();
    applyExternalTargets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
