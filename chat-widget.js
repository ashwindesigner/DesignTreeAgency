/* Design Tree Agency website chat widget.
   Talks to the Supabase Edge Function at /functions/v1/chat, which calls Claude. */
(() => {
  const config = window.DESIGN_TREE_AGENCY_SUPABASE || {};
  if (!config.url) return;
  const endpoint = `${config.url.replace(/\/+$/, '')}/functions/v1/chat`;
  const STORAGE_KEY = 'design-tree-agency-chat';
  const GREETING = "Hi! I'm the Design Tree assistant. Tell me a little about your business and what you'd like to grow, and I'll point you to the right services, or connect you with the team.";
  const SUGGESTIONS = ['What services do you offer?', 'How do you price projects?', 'I want to book a call'];

  const css = `
  .dt-chat-launch{position:fixed;right:20px;bottom:20px;z-index:1000;display:flex;align-items:center;gap:8px;height:52px;padding:0 20px 0 16px;border:0;border-radius:999px;background:var(--accent,#4aa8f0);color:var(--accent-ink,#fff);font:600 15px var(--display,system-ui,sans-serif);box-shadow:0 8px 28px rgba(21,49,74,.22);cursor:pointer;transition:transform .2s}
  .dt-chat-launch:hover{transform:translateY(-2px)}
  .dt-chat-launch svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .dt-chat-launch[aria-expanded="true"]{display:none}
  .dt-chat{margin:0;padding:0;position:fixed;right:20px;bottom:20px;z-index:1001;display:flex;flex-direction:column;width:min(380px,calc(100vw - 24px));height:auto;max-height:min(620px,calc(100dvh - 40px));background:var(--surface,#fff);color:var(--ink,#15314a);border:1px solid var(--line,#dde5ec);border-radius:var(--r,18px);box-shadow:0 18px 60px rgba(21,49,74,.25);font:14px/1.5 var(--display,system-ui,sans-serif);overflow:hidden}
  .dt-chat[hidden]{display:none}
  .dt-chat-head{margin:0;flex:none;display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--dark,#132b40);color:var(--dark-fg,#f3f7fb)}
  .dt-chat-head b{display:block;font-size:15px}
  .dt-chat-head span{font-size:12px;opacity:.75}
  .dt-chat-dot{width:9px;height:9px;border-radius:50%;background:#4ccf8f;flex:none}
  .dt-chat-close{margin-left:auto;display:grid;place-items:center;flex:none;width:32px;height:32px;padding:0;border:0;border-radius:8px;background:transparent;color:inherit;font-size:22px;line-height:1;cursor:pointer}
  .dt-chat-close:hover{background:rgba(255,255,255,.12)}
  .dt-chat-log{flex:0 1 auto;min-height:0;margin:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--bg,#f8fafc)}
  .dt-msg{max-width:85%;padding:10px 13px;border-radius:14px;white-space:normal;overflow-wrap:anywhere}
  .dt-msg p{margin:0 0 6px}.dt-msg p:last-child{margin:0}
  .dt-msg ul{display:block;margin:4px 0;padding:0 0 0 18px;list-style:disc;gap:0;font-size:inherit;font-weight:inherit;color:inherit}.dt-msg li{margin:2px 0}
  .dt-msg a{color:var(--accent,#4aa8f0);text-decoration:underline}
  .dt-msg.bot{align-self:flex-start;background:var(--surface,#fff);border:1px solid var(--line,#dde5ec);border-bottom-left-radius:4px}
  .dt-msg.user{align-self:flex-end;background:var(--accent,#4aa8f0);color:var(--accent-ink,#fff);border-bottom-right-radius:4px}
  .dt-msg.user a{color:inherit}
  .dt-typing{display:inline-flex;gap:4px}.dt-typing i{width:6px;height:6px;border-radius:50%;background:var(--ink-soft,#4a6178);animation:dt-b 1s infinite}
  .dt-typing i:nth-child(2){animation-delay:.15s}.dt-typing i:nth-child(3){animation-delay:.3s}
  @keyframes dt-b{0%,60%,100%{opacity:.3;transform:none}30%{opacity:1;transform:translateY(-3px)}}
  .dt-chips{display:flex;flex-wrap:wrap;gap:6px}
  .dt-chips button{padding:6px 11px;border:1px solid var(--line,#dde5ec);border-radius:999px;background:var(--surface,#fff);color:var(--ink,#15314a);font:inherit;font-size:13px;cursor:pointer}
  .dt-chips button:hover{border-color:var(--accent,#4aa8f0);color:var(--accent,#4aa8f0)}
  .dt-chat .dt-chat-form{flex:none;margin:0;display:flex;align-items:flex-end;gap:8px;padding:12px;border-top:1px solid var(--line,#dde5ec);background:var(--surface,#fff)}
  .dt-chat .dt-chat-form textarea{display:block;flex:1;width:auto;min-width:0;margin:0;resize:none;height:44px;min-height:44px;max-height:110px;padding:11px 12px;line-height:1.4;border:1px solid var(--line,#dde5ec);border-radius:12px;background:var(--bg,#f8fafc);color:inherit;font:inherit}
  .dt-chat .dt-chat-form textarea:focus,.dt-chat .dt-chat-form textarea:focus-visible{outline:2px solid var(--accent,#4aa8f0);outline-offset:-1px}
  .dt-chat .dt-chat-form button{display:grid;place-items:center;flex:none;width:44px;height:44px;margin:0;padding:0;border:0;border-radius:12px;background:var(--accent,#4aa8f0);color:var(--accent-ink,#fff);cursor:pointer}
  .dt-chat .dt-chat-form button:disabled{opacity:.5;cursor:default}
  .dt-chat .dt-chat-form button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
  .dt-chat-foot{flex:none;margin:0;padding:0 12px 10px;background:var(--surface,#fff);font-size:11px;color:var(--ink-soft,#4a6178);text-align:center}
  .dt-chat-foot button{border:0;background:none;color:inherit;text-decoration:underline;font:inherit;cursor:pointer}
  @media (max-width:520px){.dt-chat{right:12px;bottom:12px;max-height:calc(100dvh - 24px)}.dt-chat-launch{right:14px;bottom:14px}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.innerHTML = `
  <button class="dt-chat-launch" type="button" aria-controls="dt-chat" aria-expanded="false">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>Chat with us
  </button>
  <div class="dt-chat" id="dt-chat" role="dialog" aria-label="Chat with Design Tree Agency" hidden>
    <div class="dt-chat-head">
      <span class="dt-chat-dot" aria-hidden="true"></span>
      <div><b>Design Tree assistant</b><span>AI assistant · usually instant</span></div>
      <button class="dt-chat-close" type="button" aria-label="Close chat">&times;</button>
    </div>
    <div class="dt-chat-log" role="log" aria-live="polite"></div>
    <form class="dt-chat-form">
      <textarea rows="1" maxlength="2000" placeholder="Type your message..." aria-label="Message"></textarea>
      <button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
    </form>
    <div class="dt-chat-foot">AI can make mistakes. <button type="button" class="dt-chat-reset">Start over</button></div>
  </div>`;
  document.body.appendChild(root);

  const launch = root.querySelector('.dt-chat-launch');
  const panel = root.querySelector('.dt-chat');
  const log = root.querySelector('.dt-chat-log');
  const form = root.querySelector('.dt-chat-form');
  const input = form.querySelector('textarea');
  const send = form.querySelector('button');

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); } catch {}
  const save = () => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30))); } catch {} };

  const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inline = s => escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|#)[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
  const render = text => {
    const blocks = text.trim().split(/\n{2,}/);
    return blocks.map(block => {
      const lines = block.split('\n');
      if (lines.every(l => /^\s*[-*•]\s+/.test(l))) {
        return `<ul>${lines.map(l => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${lines.map(inline).join('<br>')}</p>`;
    }).join('');
  };

  const addBubble = (role, text) => {
    const el = document.createElement('div');
    el.className = `dt-msg ${role === 'user' ? 'user' : 'bot'}`;
    if (text) el.innerHTML = render(text);
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const showSuggestions = () => {
    const chips = document.createElement('div');
    chips.className = 'dt-chips';
    SUGGESTIONS.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = s;
      b.onclick = () => { chips.remove(); ask(s); };
      chips.appendChild(b);
    });
    log.appendChild(chips);
  };

  const paint = () => {
    log.innerHTML = '';
    addBubble('assistant', GREETING);
    history.forEach(m => addBubble(m.role, m.content));
    if (!history.length) showSuggestions();
  };

  let busy = false;
  const ask = async text => {
    if (busy || !text.trim()) return;
    busy = true; send.disabled = true;
    log.querySelector('.dt-chips')?.remove();
    history.push({ role: 'user', content: text.trim() });
    save();
    addBubble('user', text.trim());
    const bubble = addBubble('assistant', '');
    bubble.innerHTML = '<span class="dt-typing" aria-label="Assistant is typing"><i></i><i></i><i></i></span>';

    let reply = '';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: config.publishableKey || '' },
        body: JSON.stringify({ messages: history })
      });
      if (!res.ok || !res.body) {
        const msg = res.status === 429 ? await res.text() : '';
        throw new Error(msg || `Chat request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        if (reply.trim()) bubble.innerHTML = render(reply);
        log.scrollTop = log.scrollHeight;
      }
      reply += decoder.decode();
    } catch (err) {
      console.error(err);
      if (!reply.trim()) {
        reply = /quickly/.test(err.message)
          ? err.message
          : "Sorry, I couldn't connect just now. You can reach the team on [WhatsApp](https://wa.me/919985058875) or through the [contact form](#contact).";
      }
    }
    reply = reply.trim() || "Sorry, I didn't catch that. Could you try again?";
    bubble.innerHTML = render(reply);
    history.push({ role: 'assistant', content: reply });
    save();
    busy = false; send.disabled = false;
    input.focus();
  };

  const open = () => {
    panel.hidden = false;
    launch.setAttribute('aria-expanded', 'true');
    if (!log.childElementCount) paint();
    input.focus();
  };
  const close = () => {
    panel.hidden = true;
    launch.setAttribute('aria-expanded', 'false');
    launch.focus();
  };

  launch.addEventListener('click', open);
  root.querySelector('.dt-chat-close').addEventListener('click', close);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  root.querySelector('.dt-chat-reset').addEventListener('click', () => {
    if (busy) return;
    history = []; save(); paint(); input.focus();
  });
  log.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (a) { e.preventDefault(); close(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value;
    input.value = ''; input.style.height = '';
    ask(text);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  });
})();
