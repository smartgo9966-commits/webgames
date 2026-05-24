(function () {
  const PBKDF2_ITERATIONS = 500000;
  const STORAGE_KEY = 'gamesGalleryAuth';

  const STORAGE = sessionStorage;

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deriveKey(pin, salt) {
    const baseKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(pin),
      'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  }

  async function tryDecrypt(pin, params) {
    const salt = b64ToBytes(params.salt);
    const iv = b64ToBytes(params.iv);
    const ct = b64ToBytes(params.data);
    const key = await deriveKey(pin, salt);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new TextDecoder().decode(pt);
  }

  function replaceDocument(html) {
    document.open();
    document.write(html);
    document.close();
  }

  const css = `
    #lock-gate {
      position: fixed; inset: 0; z-index: 2147483647;
      background: linear-gradient(160deg, #0d1b35 0%, #1a2f5a 60%, #2a4880 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
      color: #fff; -webkit-user-select: none; user-select: none;
    }
    #lock-gate * { box-sizing: border-box; }
    #lock-card {
      width: min(92vw, 380px);
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 24px;
      padding: 28px 24px 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      text-align: center;
    }
    #lock-title { margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    #lock-sub { margin: 0 0 18px; font-size: 13px; opacity: 0.75; }
    #lock-dots { display: flex; justify-content: center; gap: 10px; margin: 0 0 14px; }
    .lock-dot {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.45);
      background: transparent;
      transition: background 120ms, transform 120ms;
    }
    .lock-dot.filled { background: #ffd24a; border-color: #ffd24a; transform: scale(1.1); }
    #lock-msg { min-height: 20px; margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #ffb4b4; }
    #lock-msg.info { color: #ffd24a; }
    #lock-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .lock-key {
      appearance: none; -webkit-appearance: none;
      border: none; outline: none; cursor: pointer;
      background: rgba(255,255,255,0.12);
      color: #fff; font-size: 22px; font-weight: 700;
      padding: 16px 0; border-radius: 14px;
      transition: background 120ms, transform 80ms;
      font-family: inherit;
    }
    .lock-key:hover { background: rgba(255,255,255,0.20); }
    .lock-key:active { transform: scale(0.95); background: rgba(255,255,255,0.28); }
    .lock-key.action { background: rgba(255,210,74,0.20); color: #ffd24a; font-size: 18px; }
    .lock-key.action:hover { background: rgba(255,210,74,0.35); }
    .lock-key:disabled { opacity: 0.4; cursor: default; }
    .shake { animation: lock-shake 0.4s; }
    @keyframes lock-shake {
      0%,100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-6px); }
      80% { transform: translateX(6px); }
    }
  `;

  let entered = '';
  let busy = false;
  let dotsEl, msgEl, cardEl, padEl;
  let onSubmit = null;

  function renderDots() {
    if (!dotsEl) return;
    for (let i = 0; i < 8; i++) {
      dotsEl.children[i].classList.toggle('filled', i < entered.length);
    }
  }

  function setKeysDisabled(disabled) {
    if (!padEl) return;
    Array.from(padEl.children).forEach(b => { b.disabled = disabled; });
  }

  function setMsg(text, kind) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.className = kind === 'info' ? 'info' : '';
  }

  function clearEntered() {
    entered = '';
    renderDots();
  }

  function fail(text) {
    setMsg(text || 'Wrong PIN', '');
    cardEl.classList.add('shake');
    setTimeout(() => {
      cardEl.classList.remove('shake');
      clearEntered();
      setKeysDisabled(false);
      busy = false;
    }, 450);
  }

  function pushDigit(d) {
    if (busy || entered.length >= 8) return;
    setMsg('', '');
    entered += d;
    renderDots();
    if (entered.length === 8) trigger();
  }

  function backspace() {
    if (busy || entered.length === 0) return;
    entered = entered.slice(0, -1);
    renderDots();
  }

  async function trigger() {
    if (entered.length !== 8 || !onSubmit) return;
    busy = true;
    setKeysDisabled(true);
    setMsg('Unlocking…', 'info');
    try {
      await onSubmit(entered);
    } catch (e) {
      fail('Wrong PIN');
    }
  }

  function onKey(e) {
    if (e.key >= '0' && e.key <= '9') { pushDigit(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { backspace(); e.preventDefault(); }
    else if (e.key === 'Enter') { trigger(); e.preventDefault(); }
  }

  function showPinPad(submitHandler) {
    onSubmit = submitHandler;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const gate = document.createElement('div');
    gate.id = 'lock-gate';
    gate.innerHTML =
      '<div id="lock-card">' +
        '<h1 id="lock-title">Enter PIN</h1>' +
        '<p id="lock-sub">8-digit code required</p>' +
        '<div id="lock-dots">' + '<div class="lock-dot"></div>'.repeat(8) + '</div>' +
        '<div id="lock-msg"></div>' +
        '<div id="lock-pad"></div>' +
      '</div>';
    (document.body || document.documentElement).appendChild(gate);

    cardEl = gate.querySelector('#lock-card');
    dotsEl = gate.querySelector('#lock-dots');
    msgEl = gate.querySelector('#lock-msg');
    padEl = gate.querySelector('#lock-pad');

    const keys = ['1','2','3','4','5','6','7','8','9','del','0','ok'];
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lock-key' + (k === 'del' || k === 'ok' ? ' action' : '');
      btn.textContent = k === 'del' ? '⌫' : k === 'ok' ? 'OK' : k;
      btn.addEventListener('click', () => {
        if (k === 'del') backspace();
        else if (k === 'ok') trigger();
        else pushDigit(k);
      });
      padEl.appendChild(btn);
    });

    window.addEventListener('keydown', onKey);
  }

  async function boot(params) {
    document.documentElement.style.background = '#0d1b35';

    let cachedPin = null;
    try { cachedPin = STORAGE.getItem(STORAGE_KEY); } catch (e) {}

    if (cachedPin) {
      try {
        const html = await tryDecrypt(cachedPin, params);
        replaceDocument(html);
        return;
      } catch (e) {
        try { STORAGE.removeItem(STORAGE_KEY); } catch (_) {}
      }
    }

    showPinPad(async (pin) => {
      const html = await tryDecrypt(pin, params);
      try { STORAGE.setItem(STORAGE_KEY, pin); } catch (e) {}
      replaceDocument(html);
    });
  }

  window.LOCK = { boot: boot };
})();
