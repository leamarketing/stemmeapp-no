(() => {
  const API = 'https://voteapp.eu/api/public/forum';
  const state = { issues: [], slug: '', posts: [], replyTo: null, query: '', page: 1 };
  let readController = null;
  const labels = {
    experience: 'Erfaring', source: 'Kilde', question: 'Spørsmål',
    for: 'Argument for', against: 'Argument mot', idea: 'Idé / forslag'
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  function fmtDate(value) {
    try { return new Intl.DateTimeFormat('nb-NO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
    catch { return ''; }
  }

  async function loadIssues() {
    const res = await fetch('/data/issues.json', { cache: 'no-store' });
    const data = await res.json();
    state.issues = Array.isArray(data.issues) ? data.issues.slice().reverse() : [];
    const select = $('#case-select');
    select.innerHTML = '';
    state.issues.forEach((issue) => {
      const option = document.createElement('option');
      option.value = issue.slug;
      option.textContent = issue.title || issue.question;
      select.appendChild(option);
    });
    const fromUrl = new URLSearchParams(location.search).get('sak');
    state.slug = state.issues.some(i => i.slug === fromUrl) ? fromUrl : (state.issues[0]?.slug || '');
    if (state.slug) select.value = state.slug;
    select.addEventListener('change', () => {
      state.slug = select.value;
      history.replaceState(null, '', `/forum/?sak=${encodeURIComponent(state.slug)}`);
      state.replyTo = null;
      updateReplyBanner();
      loadPosts();
    });
  }

  async function loadPosts() {
    readController?.abort();
    const controller = new AbortController();
    readController = controller;
    const wrap = $('#threads');
    wrap.innerHTML = '<p class="muted">Laster diskusjonen …</p>';
    if (!state.slug) return;
    wrap.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(`${API}?slug=${encodeURIComponent(state.slug)}`, { cache: 'no-store', signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunne ikke hente diskusjonen.');
      if (controller.signal.aborted) return;
      state.posts = data.posts || [];
      $('#forum-question').textContent = data.issue?.question || '';
      renderPosts();
      const target = document.getElementById(location.hash.slice(1));
      if (target && wrap.contains(target)) target.focus();
    } catch (error) {
      if (controller.signal.aborted) return;
      wrap.innerHTML = '';
      wrap.appendChild(el('p', 'notice', error.message || 'Forumet kunne ikke lastes akkurat nå.'));
    } finally {
      if (readController === controller) wrap.removeAttribute('aria-busy');
    }
  }

  function updateSearchMode() {
    const searching = Boolean(state.query);
    $('#forum-shell').classList.toggle('searching', searching);
    $('#case-panel').hidden = searching;
    $('#post-panel').hidden = searching;
    $('#clear-search').hidden = !searching;
  }

  function updateSearchUrl() {
    const params = new URLSearchParams();
    if (state.slug) params.set('sak', state.slug);
    if (state.query) {
      params.set('q', state.query);
      if (state.page > 1) params.set('side', String(state.page));
    }
    history.replaceState(null, '', `/forum/?${params.toString()}`);
  }

  async function searchPosts(page = 1) {
    readController?.abort();
    const controller = new AbortController();
    readController = controller;
    state.page = page;
    updateSearchMode();
    updateSearchUrl();
    const wrap = $('#threads');
    wrap.innerHTML = '';
    wrap.setAttribute('aria-busy', 'true');
    $('#search-status').textContent = `Søker etter «${state.query}» …`;
    const params = new URLSearchParams({ q: state.query, page: String(page) });
    try {
      const res = await fetch(`${API}?${params.toString()}`, { cache: 'no-store', signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunne ikke søke i forumet.');
      if (controller.signal.aborted) return;
      // A stale API must never silently display the unfiltered recent-post feed.
      if (data.query !== state.query || !Array.isArray(data.posts)) throw new Error('Søket er ikke tilgjengelig akkurat nå. Prøv igjen om litt.');
      const count = data.posts.length;
      const summary = !count ? `Ingen treff på «${state.query}». Prøv et annet ord eller en kortere frase.`
        : page === 1 && !data.hasMore ? `${count} treff på «${state.query}».`
        : `Treff ${(page - 1) * 20 + 1}–${(page - 1) * 20 + count} på «${state.query}».`;
      $('#search-status').textContent = summary;
      if (!count) wrap.appendChild(el('p', 'empty', summary));
      data.posts.forEach(post => {
        const issue = Array.isArray(post.issues) ? post.issues[0] : post.issues;
        if (!issue?.slug) return;
        const card = el('article', 'post search-result');
        const heading = el('h2', 'search-case', issue.question);
        card.appendChild(heading);
        card.appendChild(el('p', 'post-meta', `${labels[post.kind] || post.kind}${post.parent_id ? ' · Svarinnlegg' : ''} · ${post.author_name} · ${fmtDate(post.created_at)}`));
        card.appendChild(el('p', 'post-body', post.body));
        const link = el('a', 'btn', 'Åpne samtalen');
        link.href = `/forum/?sak=${encodeURIComponent(issue.slug)}#innlegg-${encodeURIComponent(post.id)}`;
        card.appendChild(link);
        wrap.appendChild(card);
      });
      if (page > 1 || data.hasMore) {
        const pagination = el('nav', 'search-pagination');
        pagination.setAttribute('aria-label', 'Sider med søketreff');
        for (const [label, target, enabled] of [['Forrige treff', page - 1, page > 1], ['Neste treff', page + 1, data.hasMore]]) {
          if (!enabled) continue;
          const button = el('button', 'btn', label);
          button.type = 'button';
          button.addEventListener('click', () => searchPosts(target));
          pagination.appendChild(button);
        }
        wrap.appendChild(pagination);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      $('#search-status').textContent = error.message || 'Kunne ikke søke i forumet. Prøv igjen.';
      wrap.appendChild(el('p', 'notice', 'Søket kunne ikke fullføres. Prøv på nytt, eller gå tilbake til valgt sak.'));
    } finally {
      if (readController === controller) wrap.removeAttribute('aria-busy');
    }
  }

  function clearSearch() {
    state.query = '';
    state.page = 1;
    $('#forum-search').value = '';
    $('#search-status').textContent = '';
    updateSearchMode();
    updateSearchUrl();
    loadPosts();
  }

  function renderPosts() {
    const wrap = $('#threads');
    wrap.innerHTML = '';
    const roots = state.posts.filter(p => !p.parent_id);
    if (!roots.length) {
      const empty = el('div', 'empty');
      empty.append(el('h2', '', 'Start samtalen'), el('p', 'muted', 'Ingen publiserte innlegg i denne saken ennå. Del et spørsmål, en erfaring, en kilde eller et argument.'));
      wrap.appendChild(empty);
      return;
    }
    roots.forEach(root => wrap.appendChild(renderPost(root, false)));
  }

  function renderPost(post, isReply) {
    const card = el('article', isReply ? 'post reply' : 'post');
    card.id = `innlegg-${post.id}`;
    card.tabIndex = -1;
    const top = el('div', 'post-top');
    const badge = el('span', `kind kind-${post.kind}`, labels[post.kind] || post.kind);
    const meta = el('span', 'post-meta', `${post.author_name} · ${fmtDate(post.created_at)}`);
    top.append(badge, meta);
    card.appendChild(top);
    card.appendChild(el('p', 'post-body', post.body));

    const actions = el('div', 'post-actions');
    const reply = el('button', 'link-btn', 'Svar');
    reply.type = 'button';
    reply.addEventListener('click', () => {
      state.replyTo = post.id;
      updateReplyBanner(post);
      $('#body').focus();
      window.scrollTo({ top: $('#new-post').offsetTop - 90, behavior: 'smooth' });
    });
    const report = el('button', 'link-btn subtle', 'Rapporter');
    report.type = 'button';
    report.addEventListener('click', () => reportPost(post.id));
    actions.append(reply, report);
    card.appendChild(actions);

    const replies = state.posts.filter(p => p.parent_id === post.id);
    if (replies.length) {
      const replyWrap = el('div', 'replies');
      replies.forEach(r => replyWrap.appendChild(renderPost(r, true)));
      card.appendChild(replyWrap);
    }
    return card;
  }

  function updateReplyBanner(post) {
    const box = $('#reply-banner');
    if (!state.replyTo) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    box.hidden = false;
    box.innerHTML = '';
    const text = el('span', '', `Du svarer på ${post?.author_name || 'et innlegg'}.`);
    const cancel = el('button', 'link-btn', 'Avbryt svar');
    cancel.type = 'button';
    cancel.addEventListener('click', () => { state.replyTo = null; updateReplyBanner(); });
    box.append(text, cancel);
  }

  async function submitPost(event) {
    event.preventDefault();
    const status = $('#form-status');
    status.textContent = 'Sender …';
    const payload = {
      slug: state.slug,
      kind: $('#kind').value,
      authorName: $('#author-name').value,
      email: $('#email').value,
      body: $('#body').value,
      website: $('#website').value,
      parentId: state.replyTo,
    };
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      status.textContent = data.error || 'Kunne ikke sende innlegget.';
      status.className = 'form-status error';
      return;
    }
    status.textContent = data.message || 'Innlegget er mottatt.';
    status.className = 'form-status ok';
    $('#body').value = '';
    state.replyTo = null;
    updateReplyBanner();
    if (data.post?.status === 'published') await loadPosts();
  }

  async function reportPost(postId) {
    const email = window.prompt('E-post for å registrere rapporten (vises ikke offentlig):');
    if (!email) return;
    const reason = window.prompt('Årsak: spam, harassment, misinformation, privacy eller other', 'other');
    if (!reason) return;
    const detail = window.prompt('Kort forklaring (valgfritt):', '') || '';
    const res = await fetch(`${API}/report`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, email, reason, detail })
    });
    const data = await res.json().catch(() => ({}));
    window.alert(data.message || data.error || 'Rapporten er sendt.');
    if (res.ok) await loadPosts();
  }

  async function init() {
    $('#forum-search-form').addEventListener('submit', event => {
      event.preventDefault();
      state.query = $('#forum-search').value.trim();
      if (!state.query) { clearSearch(); return; }
      state.replyTo = null;
      updateReplyBanner();
      searchPosts();
    });
    $('#clear-search').addEventListener('click', clearSearch);
    try {
      await loadIssues();
      const params = new URLSearchParams(location.search);
      state.query = (params.get('q') || '').trim().slice(0, 120);
      $('#forum-search').value = state.query;
      if (state.query) {
        const page = /^[1-9]\d{0,3}$/.test(params.get('side') || '') ? Number(params.get('side')) : 1;
        await searchPosts(page);
      } else await loadPosts();
    } catch {
      $('#threads').innerHTML = '<p class="notice">Forumet kunne ikke lastes akkurat nå.</p>';
    }
    $('#new-post').addEventListener('submit', submitPost);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

