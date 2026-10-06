(() => {
  const API = 'https://voteapp.eu/api/public/forum';
  const state = { issues: [], slug: '', posts: [], replyTo: null };
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
    const wrap = $('#threads');
    wrap.innerHTML = '<p class="muted">Laster diskusjonen …</p>';
    if (!state.slug) return;
    const res = await fetch(`${API}?slug=${encodeURIComponent(state.slug)}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) {
      wrap.innerHTML = '';
      wrap.appendChild(el('p', 'notice', data.error || 'Kunne ikke hente diskusjonen.'));
      return;
    }
    state.posts = data.posts || [];
    $('#forum-question').textContent = data.issue?.question || '';
    renderPosts();
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
    try {
      await loadIssues();
      await loadPosts();
    } catch {
      $('#threads').innerHTML = '<p class="notice">Forumet kunne ikke lastes akkurat nå.</p>';
    }
    $('#new-post').addEventListener('submit', submitPost);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
