(() => {
  const C = window.FIT_CHECK || {};
  const $ = (id) => document.getElementById(id);
  const els = {
    messages: $('messages'), hero: $('hero'), chips: $('chips'), form: $('composer'),
    input: $('input'), send: $('send'), toggle: $('polishToggle'), status: $('llmStatus'),
  };

  // ---- Text from config.js
  $('brandName').textContent = C.name || 'Fit Check';
  $('brandTag').textContent = C.tagline || '';
  $('heroTitle').textContent = C.heroTitle || '';
  $('heroSub').textContent = C.heroSub || '';
  $('fineprint').textContent = C.footer || '';
  document.title = `${C.name || 'Fit Check'} - ${C.tagline || 'Chat'}`;
  (C.suggestions || []).forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = s;
    b.addEventListener('click', () => send(s));
    els.chips.appendChild(b);
  });

  // ---- Session + preferences (storage can be unavailable; never let that break the page)
  const store = {
    get(k, area = 'localStorage') { try { return window[area].getItem(k); } catch { return null; } },
    set(k, v, area = 'localStorage') { try { window[area].setItem(k, v); } catch { /* ignore */ } },
  };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  let sessionId = store.get('fc_session', 'sessionStorage');
  if (!sessionId) { sessionId = newId(); store.set('fc_session', sessionId, 'sessionStorage'); }

  // AI polish is OFF by default so the bot runs purely rule-based unless someone turns it on.
  els.toggle.checked = store.get('fc_polish') === 'on';
  els.toggle.setAttribute('aria-label', 'AI polish');
  els.toggle.addEventListener('change', () => store.set('fc_polish', els.toggle.checked ? 'on' : 'off'));

  // ---- Local AI status
  async function checkHealth() {
    const text = els.status.querySelector('.status-text');
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      const h = await r.json();
      els.status.classList.remove('online', 'offline');
      if (!h.llm?.configured) { text.textContent = 'Rule-based only'; els.status.classList.add('offline'); }
      else if (h.llm.online) { text.textContent = 'Local AI online'; els.status.classList.add('online'); }
      else { text.textContent = 'Local AI offline'; els.status.classList.add('offline'); }
    } catch {
      text.textContent = 'Status unknown';
    }
  }
  checkHealth();
  setInterval(checkHealth, 60000);

  // ---- Rendering helpers
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const scrollDown = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  function withCitations(text, sources) {
    return esc(text).replace(/\s?\[(\d+)\]/g, (m, n) => {
      const s = sources.find((x) => x.id === Number(n));
      if (!s) return m;
      return s.url
        ? `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.title)}">[${n}]</a>`
        : `<span class="cite" title="${esc(s.title)}">[${n}]</span>`;
    });
  }

  function addUser(text) {
    const div = document.createElement('div');
    div.className = 'msg user';
    div.innerHTML = `<div class="bubble">${esc(text)}</div>`;
    els.messages.appendChild(div);
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot typing';
    div.innerHTML = '<div class="bubble"><span></span><span></span><span></span></div>';
    els.messages.appendChild(div);
    scrollDown();
    return div;
  }

  const VERDICT = {
    supported: ['good', 'Sources confirm it'],
    partially_supported: ['warn', 'Partly confirmed by sources'],
    unsupported: ['bad', "Sources don't confirm it"],
    no_sources: ['', 'No sources linked to this intent'],
    unknown: ['', 'Verification unclear'],
  };
  const POLISH = {
    applied: ['good', 'AI polished'],
    rejected: ['warn', 'AI rewrite blocked'],
    unavailable: ['warn', 'AI offline'],
    skipped: ['', 'Rule-based only · AI not used'],
    off: ['', 'AI polish off'],
  };

  function addBot(data) {
    const rb = data.ruleBased || {};
    const p = data.polish || {};
    const sources = data.sources || [];
    const conf = typeof rb.confidence === 'number' ? ` · ${Math.round(rb.confidence * 100)}%` : '';
    const [pClass, pLabel] = POLISH[p.status] || ['', p.status];
    const v = p.verification;
    const [vClass, vLabel] = v ? (VERDICT[v.verdict] || VERDICT.unknown) : [null, null];

    const claims = (v?.claims || []).filter((c) => c.claim).map((c) => {
      const cls = c.status === 'supported' ? 'claim-supported' : c.status === 'unsupported' ? 'claim-unsupported' : '';
      const src = c.source ? ` [${c.source}]` : '';
      return `<li><span class="${cls}">${esc(c.status.replace('_', ' '))}</span>: ${esc(c.claim)}${esc(src)}</li>`;
    }).join('');

    const srcList = sources.map((s) => `<li>[${s.id}] ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</li>`).join('');

    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = `
      <div class="bubble">${withCitations(data.answer, sources)}</div>
      <div class="meta">
        <span class="tag mono">${esc(rb.engine || 'Dialogflow')} · ${esc(rb.intent || 'no intent')}${conf}</span>
        <span class="tag ${pClass}">${esc(pLabel)}</span>
        ${vLabel ? `<span class="tag ${vClass}">${esc(vLabel)}</span>` : ''}
        <button type="button" class="details-btn" aria-expanded="false">How was this answered?</button>
      </div>
      <div class="details" hidden>
        <ol>
          <li>
            <h4>Dialogflow chose the answer (rule-based)</h4>
            Matched <code>${esc(rb.intent || 'nothing')}</code>${rb.page ? ` on page <code>${esc(rb.page)}</code>` : ''}${conf ? ` with${conf.replace(' ·', '')} confidence` : ''}${rb.isFallback ? ' (fallback - no intent matched)' : ''}. Original response:
            <blockquote>${esc(rb.text)}</blockquote>
          </li>
          <li>
            <h4>Source check</h4>
            ${v ? `${esc(vLabel)}.${v.notes ? ` ${esc(v.notes)}` : ''}${claims ? `<ul>${claims}</ul>` : ''}` : 'Not run for this reply.'}
            ${srcList ? `<ul>${srcList}</ul>` : ''}
          </li>
          <li>
            <h4>Wording</h4>
            ${esc(p.reason || '')}${p.model ? ` <span class="tag mono">${esc(p.model)}</span>` : ''}
          </li>
        </ol>
      </div>`;
    if ((data.suggestions || []).length) {
      const quick = document.createElement('div');
      quick.className = 'quick';
      data.suggestions.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip small'; b.textContent = s;
        b.addEventListener('click', () => send(s));
        quick.appendChild(b);
      });
      div.appendChild(quick);
    }
    const btn = div.querySelector('.details-btn');
    const det = div.querySelector('.details');
    btn.addEventListener('click', () => {
      det.hidden = !det.hidden;
      btn.setAttribute('aria-expanded', String(!det.hidden));
      btn.textContent = det.hidden ? 'How was this answered?' : 'Hide details';
    });
    els.messages.appendChild(div);
  }

  function addError(text) {
    const div = document.createElement('div');
    div.className = 'msg bot error';
    div.innerHTML = `<div class="bubble">${esc(text)}</div>`;
    els.messages.appendChild(div);
  }

  // ---- Sending
  let busy = false;
  async function send(text) {
    const message = String(text || '').trim();
    if (!message || busy) return;
    busy = true;
    els.send.disabled = true;
    els.hero.hidden = true;
    els.input.value = '';
    autosize();
    document.querySelectorAll('.quick').forEach((q) => q.remove());
    addUser(message);
    const typing = addTyping();
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId, polish: els.toggle.checked }),
      });
      const data = await r.json().catch(() => ({}));
      typing.remove();
      if (!r.ok) addError(data.error || 'Something went wrong. Try again.');
      else addBot(data);
    } catch {
      typing.remove();
      addError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      busy = false;
      els.send.disabled = false;
      els.input.focus();
      scrollDown();
    }
  }

  function autosize() {
    els.input.style.height = 'auto';
    els.input.style.height = `${Math.min(els.input.scrollHeight, 160)}px`;
  }
  els.input.addEventListener('input', autosize);
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(els.input.value); }
  });
  els.form.addEventListener('submit', (e) => { e.preventDefault(); send(els.input.value); });
})();
