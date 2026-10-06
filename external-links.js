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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyExternalTargets());
  } else {
    applyExternalTargets();
  }
})();
