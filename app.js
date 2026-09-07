/* =====================================================================
   PROMPTFORGE — multiplayer AI chaos
   3-file architecture: index.html, styles.css, app.js (+ favicon.svg, README)
   ---------------------------------------------------------------------
   Flow:
     home -> lobby (host via PeerJS id) -> prompt phase -> build phase
     -> play phase (2 min) -> results -> (loop) play again
   ===================================================================== */

(() => {
'use strict';

/* ---------- tiny utils ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const el = (tag, props = {}, children = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
};
const rand = (n = 4) => Array.from({length: n}, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random()*32)]).join('');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- toast ---------- */
const toast = (msg, ms = 2400) => {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), ms);
};

/* ---------- settings (localStorage) ---------- */
const SETTINGS_KEY = 'promptforge.settings.v1';
const defaultSettings = () => ({
  apiKey: '',
  model: 'openrouter/auto',
  patchMode: true,
  temperature: 0.8,
  systemPrompt: [
    'You are the AI game engine of a multiplayer browser game called "Promptforge".',
    'You MUST output a single JSON object. No prose, no markdown fences, no commentary.',
    'The game is rendered in a sandboxed iframe. It uses plain HTML/CSS/JS and a tiny built-in API exposed as `window.PF`.',
    'Game dimensions: 960x540 (logical). It scales with CSS to fit.',
    'Players are represented as colored squares ({players: [{id, name, color, x, y, vx, vy, score}]}).',
    'You may add: collectibles, enemies, obstacles, particles, UI, win/lose conditions.',
    'When given a list of player PATCH REQUESTS, return ONLY the minimum JSON diff needed.',
    'Keep the code under 8KB. No external assets. No network calls.'
  ].join('\n'),
});
const loadSettings = () => {
  try { return Object.assign(defaultSettings(), JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); }
  catch { return defaultSettings(); }
};
const saveSettings = () => {
  const s = loadSettings();
  s.apiKey     = $('#apiKey').value.trim();
  s.model      = $('#modelInput').value.trim() || 'openrouter/auto';
  s.patchMode  = $('#patchMode').checked;
  s.temperature = parseFloat($('#tempInput').value) || 0.8;
  s.systemPrompt = $('#sysPrompt').value.trim() || defaultSettings().systemPrompt;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  $('#saveStatus').textContent = 'saved';
  setTimeout(() => $('#saveStatus').textContent = '', 1500);
};
const applySettings = () => {
  const s = loadSettings();
  $('#apiKey').value     = s.apiKey || '';
  $('#modelInput').value = s.model;
  $('#patchMode').checked = !!s.patchMode;
  $('#tempInput').value  = s.temperature;
  $('#sysPrompt').value  = s.systemPrompt;
};

/* ---------- screen router ---------- */
const screens = ['lobby','prompt','build','play','results'];
const showScreen = (name) => {
  for (const s of screens) $('#screen-' + s).classList.toggle('hidden', s !== name);
};

/* ---------- app state ---------- */
const state = {
  me: null,                  // {id, name, color}
  hostId: null,              // peer id of host
  code: null,                // lobby code (= host peer id without 'pf-' prefix)
  role: null,                // 'host' | 'guest'
  peer: null,
  conns: new Map(),          // peerId -> DataConnection
  players: new Map(),        // peerId -> {id, name, color, ready, prompt}
  round: 0,                  // round counter
  game: null,                // {html, css, meta} current generated game
  tickHandle: null,          // game tick interval
  timeLeft: 0,               // seconds remaining in play phase
};

/* ---------- peer setup ---------- */
const COLORS = ['#ff6b6b','#4ecdc4','#ffd166','#a78bfa','#34d399','#f472b6','#60a5fa','#fbbf24'];
const peerIdFor = (code) => 'pf-' + code.toUpperCase();
const colorFor = (id) => {
  let h = 0; for (let i=0;i<id.length;i++) h = (h*31 + id.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
};

function makePeer(id) {
  // Disconnect any old peer first
  if (state.peer && !state.peer.destroyed) {
    try { state.peer.destroy(); } catch {}
  }
  const p = new Peer(id, { debug: 1 });
  state.peer = p;
  return new Promise((resolve, reject) => {
    const onOpen = () => { p.removeEventListener('error', onErr); resolve(p); };
    const onErr  = (e) => { p.removeEventListener('open', onOpen); reject(e); };
    p.once('open', onOpen);
    p.once('error', onErr);
  });
}

/* ---------- protocol ----------
   Every message is {type, ...}.
   Host is authoritative. Guests follow. */
function broadcast(msg, except = null) {
  const data = JSON.stringify(msg);
  for (const [, c] of state.conns) {
    if (!c.open) continue;
    if (except && c.peer === except) continue;
    try { c.send(data); } catch {}
  }
}
function sendTo(peerId, msg) {
  const c = state.conns.get(peerId);
  if (c && c.open) { try { c.send(JSON.stringify(msg)); } catch {} }
}

/* ---------- lobby ---------- */
async function hostLobby() {
  const name = ($('#nameInput').value || 'host').trim();
  if (!name) return showLobbyError('Pick a handle first.');
  state.role = 'host';
  state.me = { id: uid(), name, color: colorFor(name), ready: false, prompt: '' };
  state.players.set(state.me.id, state.me);
  state.code = rand(5);

  try {
    await makePeer(peerIdFor(state.code));
  } catch (e) {
    return showLobbyError('Could not connect to broker. Try again.');
  }

  state.peer.on('connection', (c) => attachConn(c));
  state.peer.on('error', (e) => { if (e.type === 'network') toast('reconnecting…'); });

  enterLobbyUI();
  renderPlayers();
}

async function joinLobby() {
  const code = ($('#codeInput').value || '').trim().toUpperCase();
  const name = ($('#nameInput').value || 'guest').trim();
  if (!code) return showLobbyError('Enter the lobby code.');
  if (!name) return showLobbyError('Pick a handle first.');
  state.role = 'guest';
  state.me = { id: uid(), name, color: colorFor(name), ready: false, prompt: '' };
  state.code = code;
  state.hostId = peerIdFor(code);

  try {
    await makePeer();  // random id
  } catch (e) {
    return showLobbyError('Could not connect to broker. Try again.');
  }

  const c = state.peer.connect(state.hostId, { reliable: true, serialization: 'json' });
  attachConn(c, /*isOutbound*/ true);
  enterLobbyUI();
}

function attachConn(c, isOutbound = false) {
  state.conns.set(c.peer, c);
  c.on('open', () => {
    setConnBadge('connected');
    // guests announce themselves
    if (state.role === 'guest' && isOutbound) {
      sendTo(c.peer, { type: 'hello', me: state.me });
    }
    // host responds with current lobby state
    if (state.role === 'host') {
      sendTo(c.peer, {
        type: 'lobby-state',
        code: state.code,
        players: [...state.players.values()].map(p => ({...p, prompt: ''})),
        round: state.round,
      });
    }
  });
  c.on('data', (raw) => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    handleMessage(msg, c.peer);
  });
  c.on('close', () => onPeerLeave(c.peer));
  c.on('error', () => onPeerLeave(c.peer));
}

function onPeerLeave(peerId) {
  state.conns.delete(peerId);
  const p = state.players.get(peerId);
  if (p) {
    state.players.delete(peerId);
    toast(p.name + ' left');
    if (state.role === 'host') {
      broadcast({ type: 'player-left', id: peerId });
      renderPlayers();
      renderReadyDots();
    }
  }
}

function handleMessage(msg, fromPeer) {
  switch (msg.type) {
    case 'hello': {
      // guest joined our (host's) lobby
      const newP = msg.me;
      newP.ready = false; newP.prompt = '';
      state.players.set(newP.id, newP);
      broadcast({ type: 'lobby-state', code: state.code, players: [...state.players.values()].map(p => ({...p, prompt: ''})), round: state.round });
      renderPlayers();
      toast(newP.name + ' joined');
      break;
    }
    case 'lobby-state': {
      // guest received state from host
      state.players.clear();
      for (const p of msg.players) state.players.set(p.id, p);
      state.round = msg.round || 0;
      renderPlayers();
      $('#lobbyCode').textContent = state.code;
      $('#playLobbyCode').textContent = state.code;
      break;
    }
    case 'player-left': {
      state.players.delete(msg.id);
      renderPlayers();
      renderReadyDots();
      break;
    }
    case 'player-update': {
      // host receives a player's prompt / ready state
      const p = state.players.get(msg.id);
      if (p) {
        if (typeof msg.ready === 'boolean') p.ready = msg.ready;
        if (typeof msg.prompt === 'string') p.prompt = msg.prompt;
      }
      renderPlayers();
      renderReadyDots();
      // maybe auto-start? no, host clicks
      break;
    }
    case 'begin-prompt': {
      // host -> guests: start prompt phase
      state.round = msg.round;
      $('#roundTitle').textContent = 'Round ' + msg.round + ' — write your prompt';
      $('#promptInput').value = '';
      $('#charCount').textContent = '0';
      // reset ready/prompt for everyone
      for (const [, p] of state.players) { p.ready = false; p.prompt = ''; }
      renderReadyDots();
      showScreen('prompt');
      $('#promptInput').focus();
      break;
    }
    case 'begin-build': {
      // host -> guests: now building
      $('#buildTitle').textContent = 'Forging round ' + msg.round + '…';
      $('#buildSub').textContent = 'The AI is patching ' + (msg.patches.length) + ' request' + (msg.patches.length===1?'':'s') + '.';
      $('#buildLog').innerHTML = '';
      showScreen('build');
      break;
    }
    case 'begin-play': {
      // host -> guests: here is the generated game
      state.game = msg.game;
      startPlay(msg.timeLeft);
      break;
    }
    case 'round-over': {
      // host -> guests: time's up
      stopTick();
      showResults(msg.subtitle || '');
      break;
    }
    case 'play-again': {
      // host -> guests: go back to lobby
      backToLobby();
      break;
    }
    case 'error': {
      showLobbyError(msg.msg || 'something went wrong');
      break;
    }
  }
}

/* ---------- UI helpers ---------- */
function showLobbyError(msg) {
  const e = $('#lobbyError');
  e.textContent = msg;
  e.hidden = false;
  setTimeout(() => e.hidden = true, 4000);
}
function setConnBadge(text) { $('#connBadge').textContent = text; }

function enterLobbyUI() {
  $('#homeCard').classList.add('hidden');
  $('#lobbyCard').classList.remove('hidden');
  $('#lobbyCode').textContent = state.code;
  $('#playLobbyCode').textContent = state.code;
  setConnBadge('connected');
  if (state.role === 'host') {
    $('#btnStart').disabled = false;
    $('#btnStart').onclick = startRound;
  } else {
    $('#btnStart').disabled = true;
    $('#lobbyStatus').textContent = 'waiting for host to start…';
  }
}
function renderPlayers() {
  const ul = $('#playerList');
  ul.innerHTML = '';
  for (const [, p] of state.players) {
    const li = el('li', { class: 'player' });
    li.appendChild(el('span', { class: 'dot', style: `background:${p.color}` }));
    li.appendChild(el('span', { class: 'pname' }, p.name + (p.id === state.me?.id ? ' (you)' : '')));
    if (p.ready) li.appendChild(el('span', { class: 'ribbon' }, 'ready'));
    ul.appendChild(li);
  }
  // play-screen inline too
  const inline = $('#playPlayers');
  inline.innerHTML = '';
  for (const [, p] of state.players) {
    inline.appendChild(el('span', { class: 'pip', style: `background:${p.color}`, title: p.name }));
  }
}
function renderReadyDots() {
  const c = $('#readyDots');
  if (!c) return;
  c.innerHTML = '';
  const total = state.players.size;
  let ready = 0;
  for (const [, p] of state.players) {
    const d = el('span', { class: 'rdot' + (p.ready ? ' on' : '') });
    d.title = p.name;
    c.appendChild(d);
    if (p.ready) ready++;
  }
  $('#readyStatus').textContent = `${ready}/${total} ready`;
  $('#lobbyStatus').textContent = `${ready}/${total} ready`;
}

/* ---------- prompt phase ---------- */
function startRound() {
  state.round++;
  for (const [, p] of state.players) { p.ready = false; p.prompt = ''; }
  broadcast({ type: 'begin-prompt', round: state.round });
  // host also runs the local flow
  $('#roundTitle').textContent = 'Round ' + state.round + ' — write your prompt';
  $('#promptInput').value = '';
  $('#charCount').textContent = '0';
  renderReadyDots();
  showScreen('prompt');
  $('#promptInput').focus();
}

function toggleReady() {
  const text = $('#promptInput').value.trim();
  if (!text) { toast('write something first'); return; }
  state.me.ready = true;
  state.me.prompt = text;
  $('#btnReady').disabled = true;
  $('#promptInput').disabled = true;
  $('#btnReady').innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 12l4 4L19 7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> Waiting…`;
  broadcast({ type: 'player-update', id: state.me.id, ready: true, prompt: text });
  if (state.role === 'host') {
    renderPlayers();
    renderReadyDots();
    maybeAllReady();
  }
}

/* ---------- build phase (host only) ---------- */
async function maybeAllReady() {
  if (state.players.size < 1) return;
  for (const [, p] of state.players) if (!p.ready) return;

  // gather all prompts in deterministic order (oldest first / by join time)
  const patches = [];
  for (const [, p] of state.players) {
    if (p.prompt) patches.push({ id: p.id, name: p.name, color: p.color, prompt: p.prompt });
  }

  broadcast({ type: 'begin-build', round: state.round, patches });
  $('#buildTitle').textContent = 'Forging round ' + state.round + '…';
  $('#buildSub').textContent = 'The AI is patching ' + patches.length + ' request' + (patches.length===1?'':'s') + '.';
  $('#buildLog').innerHTML = '';
  showScreen('build');

  try {
    const game = await buildGame(patches, (line) => logBuild(line));
    state.game = game;
    broadcast({ type: 'begin-play', game, timeLeft: 120 });
    startPlay(120);
  } catch (e) {
    console.error(e);
    logBuild('AI failed: ' + (e.message || e));
    // graceful fallback: ship a default game so the round isn't lost
    const fallback = fallbackGame(patches);
    state.game = fallback;
    broadcast({ type: 'begin-play', game: fallback, timeLeft: 120 });
    startPlay(120);
  }
}

function logBuild(line) {
  const box = $('#buildLog');
  box.appendChild(el('div', { class: 'logLine' }, line));
  box.scrollTop = box.scrollHeight;
}

/* ---------- openrouter call ---------- */
async function orChat(messages, { json = true, maxTokens = 1200 } = {}) {
  const s = loadSettings();
  if (!s.apiKey) throw new Error('No OpenRouter key set. Open settings (gear icon) and paste your key.');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + s.apiKey,
      'HTTP-Referer': location.origin,
      'X-Title': 'Promptforge',
    },
    body: JSON.stringify({
      model: s.model,
      temperature: s.temperature,
      max_tokens: maxTokens,
      response_format: json ? { type: 'json_object' } : undefined,
      messages,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error('OpenRouter ' + res.status + ': ' + t.slice(0, 200));
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

function tryParseJson(txt) {
  // strip accidental fences
  let t = (txt || '').trim();
  if (t.startsWith('```')) t = t.replace(/^```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  // grab the outermost {...}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  try { return JSON.parse(t); } catch { return null; }
}

/* ---------- game builder ----------
   Token saver: round 1 = full JSON {html, css, meta}.
   Rounds 2+ = send a compact prompt that lists ONLY new patch requests + the previous meta,
   and ask the AI to return a DIFF JSON {meta?, html?, css?}. */
async function buildGame(patches, onLog) {
  const s = loadSettings();
  onLog('assembling prompt…');

  const players = patches.map(p => ({ id: p.id, name: p.name, color: p.color }));
  const userBlock = patches.map(p => `- (${p.name}, color ${p.color}) wants: ${p.prompt}`).join('\n');

  let sys;
  let user;

  if (state.round === 1 || !state.game || !s.patchMode) {
    // full generation
    sys = s.systemPrompt + '\n\nReturn JSON: { html: string, css: string, meta: {title, desc, entities:[{type, props}], controls:{p1, p2, ...}} }. The `html` field MUST be the JS code body ONLY — NO <script> tags, NO HTML markup, just JavaScript. The host injects it into a sandboxed iframe where a <canvas id="game"> and a <div id="hud"> already exist. You may use `document.getElementById(\'game\')` etc. Make a small, fun multiplayer game that satisfies the prompts.';
    user = `Players:\n${userBlock}\n\nGenerate the game now. Output JSON only.`;
    onLog('requesting full generation from ' + s.model);
    const out = await orChat([
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ], { maxTokens: 1400 });
    const j = tryParseJson(out);
    if (!j || typeof j.html !== 'string') throw new Error('AI returned invalid JSON');
    onLog('full game received (' + (j.html.length + (j.css?.length||0)) + ' bytes)');
    return { html: j.html, css: j.css || '', meta: j.meta || {}, full: true };
  } else {
    // surgical patch — send only meta summary + new requests
    const prevMeta = state.game.meta || {};
    sys = s.systemPrompt +
      `\n\nYou are patching an EXISTING game. Output JSON diff only: { meta?: {...}, html?: string, css?: string, full?: false }.` +
      `\n- "html" MUST be plain JS code only (NO <script> tags). It will be appended to the existing JS in the iframe.` +
      `\n- "css" should be ONLY new styles (appended).` +
      `\n- "meta" may add new entities/controls/rules.` +
      `\n- NEVER remove existing features. Keep the same <canvas id="game">.` +
      `\nPrevious meta: ${JSON.stringify(prevMeta).slice(0, 800)}`;
    user = `New patch requests this round:\n${userBlock}\n\nReturn ONLY the diff JSON.`;
    onLog('requesting patch from ' + s.model);
    const out = await orChat([
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ], { maxTokens: 900 });
    const j = tryParseJson(out);
    if (!j) throw new Error('AI returned invalid diff JSON');
    onLog('patch received');
    // merge
    const merged = {
      html: (state.game.html || '') + (j.html ? '\n' + j.html : ''),
      css:  (state.game.css  || '') + (j.css  ? '\n' + j.css  : ''),
      meta: { ...(state.game.meta || {}), ...(j.meta || {}) },
      full: false,
    };
    return merged;
  }
}

/* ---------- fallback (no key / failed AI) ----------
   A built-in tiny game so players always get to play something. */
function fallbackGame(patches) {
  const colors = patches.map(p => p.color);
  // NB: `html` here is the JS body only — the host wraps it in a real <script>.
  return {
    full: true,
    meta: { title: 'Orb Collectors', desc: 'Collect orbs. Avoid red ones. (Fallback game — AI was unavailable.)' },
    css: `body{margin:0;background:#0b0d12;color:#e6e6f0;font:14px/1.4 ui-monospace,monospace;overflow:hidden}
canvas{display:block;background:#11141b}
.hud{position:fixed;top:8px;left:8px;background:rgba(0,0,0,.35);padding:6px 10px;border-radius:6px}`,
    html: `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const players = new Map();
const orbs = [];
const enemies = [];
let tick = 0;
function spawnOrb(good=true){ orbs.push({ x:Math.random()*W, y:Math.random()*H, r:10, good }); }
for (let i=0;i<20;i++) spawnOrb(true);
for (let i=0;i<6;i++) spawnOrb(false);
const keys = {};
addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
addEventListener('keyup',   e => keys[e.key.toLowerCase()] = false);
window.PF && PF.onPlayerList(list => {
  for (const p of list) if (!players.has(p.id)) players.set(p.id, { ...p, x: W/2, y: H/2, vx:0, vy:0, score:0 });
});
window.PF && PF.onInput(input => {
  const me = players.get(input.id); if (!me) return;
  const sp = 4;
  me.vx = (keys['arrowright']||keys['d']?1:0) - (keys['arrowleft']||keys['a']?1:0);
  me.vy = (keys['arrowdown']||keys['s']?1:0) - (keys['arrowup']||keys['w']?1:0);
});
function loop(){
  tick++;
  ctx.fillStyle = '#11141b'; ctx.fillRect(0,0,W,H);
  // entities
  for (const o of orbs) {
    ctx.fillStyle = o.good ? '#4ecdc4' : '#ff6b6b';
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
  }
  for (const [id, p] of players) {
    p.x += p.vx * 4; p.y += p.vy * 4;
    p.x = Math.max(12, Math.min(W-12, p.x));
    p.y = Math.max(12, Math.min(H-12, p.y));
    // collide
    for (const o of orbs) {
      const dx = p.x - o.x, dy = p.y - o.y;
      if (dx*dx + dy*dy < (o.r+10)*(o.r+10)) {
        if (o.good) { p.score++; o.x = -1000; }
        else { p.score = Math.max(0, p.score-2); o.x = -1000; setTimeout(()=>spawnOrb(false), 2000); }
      }
    }
    ctx.fillStyle = p.color; ctx.fillRect(p.x-10, p.y-10, 20, 20);
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; ctx.fillText(p.name + ' ' + p.score, p.x-10, p.y-14);
    if (window.PF && p.id === PF.selfId) PF.broadcast({ id: p.id, x: p.x, y: p.y, score: p.score });
  }
  // respawn orbs
  if (tick % 120 === 0) spawnOrb(true);
  // enemies drift
  if (tick % 240 === 0) enemies.push({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*2, vy:(Math.random()-.5)*2 });
  for (const e of enemies) { e.x += e.vx; e.y += e.vy; ctx.fillStyle='#f472b6'; ctx.fillRect(e.x-8, e.y-8, 16, 16); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);`
  };
}

/* ---------- play phase ---------- */
function startPlay(seconds) {
  state.timeLeft = seconds;
  showScreen('play');
  $('#playTimer').textContent = fmtTime(state.timeLeft);
  $('#playLobbyCode').textContent = state.code;
  // Build the iframe document
  const frame = $('#gameFrame');
  const doc = buildGameDoc(state.game, [...state.players.values()], state.me?.id);
  frame.srcdoc = doc;
  // Listen for messages from inside the iframe (PF protocol)
  window.onmessage = onIframeMessage;
  // Host runs the game loop & timer
  stopTick();
  if (state.role === 'host') {
    const t0 = Date.now();
    state.tickHandle = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const left = Math.max(0, Math.ceil(seconds - elapsed));
      state.timeLeft = left;
      $('#playTimer').textContent = fmtTime(left);
      broadcast({ type: 'timer', timeLeft: left });
      if (left <= 0) {
        stopTick();
        broadcast({ type: 'round-over', subtitle: summarize() });
        showResults(summarize());
      }
    }, 250);
  }
}
function stopTick() {
  if (state.tickHandle) { clearInterval(state.tickHandle); state.tickHandle = null; }
}
function fmtTime(s) { const m = Math.floor(s/60); const r = s%60; return m + ':' + String(r).padStart(2,'0'); }
function summarize() {
  // scores come from in-iframe broadcast; we just summarize participants
  const names = [...state.players.values()].map(p => p.name).join(', ');
  return names + ' survived ' + fmtTime(120);
}

function onIframeMessage(ev) {
  const msg = ev.data;
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'pf-state') {
    // player moved / scored inside the iframe -> host broadcasts to other peers
    if (state.role === 'host') broadcast({ type: 'pf-state', from: msg.from, state: msg.state });
    // local: track scores
    if (msg.state?.scores) {
      const line = Object.entries(msg.state.scores).map(([id,sc]) => {
        const p = state.players.get(id); return (p?.name || id) + ': ' + sc;
      }).join(' · ');
      // we could push to a HUD; the iframe already has one
    }
  } else if (msg.type === 'pf-input') {
    // not used right now
  }
}

/* ---------- build the iframe document ----------
   This is THE sandbox. We:
     - inject a tiny `window.PF` API (broadcast, onPlayerList, onInput, selfId)
     - inject AI html + css
     - host (parent) forwards PF.broadcast to other peers via postMessage + ws broadcast
     - guests receive those posts and call PF.broadcast locally
*/
function buildGameDoc(game, players, selfId) {
  // escape hostile closures in AI output
  let safeHtml = String(game.html || '');
  // The host wraps this in its own <script>, so strip any stray <script>/</script>
  // tags the model may have emitted, and neutralize the literal closing sequence.
  safeHtml = safeHtml.replace(/<\/?script[^>]*>/gi, '');
  safeHtml = safeHtml.replace(/<\/script/gi, '<\\/script');
  safeHtml = safeHtml.replace(/<!--/g, '<\\!--');
  const safeCss = String(game.css || '');
  const playersJson = JSON.stringify(players).replace(/<\/script/g, '<\\/script');

  // Parent -> iframe relay (per peer)
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#0b0d12;overflow:hidden;color:#e6e6f0;font-family:ui-monospace,monospace}
${safeCss}
</style></head><body>
<canvas id="game" width="960" height="540"></canvas>
<div id="hud" style="position:fixed;top:8px;left:8px;background:rgba(0,0,0,.4);padding:6px 10px;border-radius:6px;font:12px ui-monospace,monospace"></div>
<script>
(function(){
  const SELF = ${JSON.stringify(selfId)};
  const PLAYERS = ${playersJson};
  const listeners = { input: [], players: [] };
  const PF = {
    selfId: SELF,
    broadcast(state) {
      // send out to parent (host) or up to host (guest)
      parent.postMessage({ type:'pf-state', from: SELF, state }, '*');
    },
    onInput(fn) { listeners.input.push(fn); },
    onPlayerList(fn) { listeners.players.push(fn); fn(PLAYERS); },
    send(msg) { parent.postMessage(msg, '*'); },
    on(fn) { window.addEventListener('message', (e) => fn(e.data)); }
  };
  window.PF = PF;

  // forward key events to PF.onInput listeners with our id
  const keys = {};
  addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  addEventListener('keyup',   e => { keys[e.key.toLowerCase()] = false; });
  function pumpInput() {
    const me = SELF;
    for (const fn of listeners.input) fn({ id: me, keys: { ...keys } });
    requestAnimationFrame(pumpInput);
  }
  requestAnimationFrame(pumpInput);

  // listen for host -> peer position updates
  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || typeof m !== 'object') return;
    if (m.type === 'pf-peers') {
      // host is fanning out latest positions; we expose them via a global
      window.__PEERS__ = m.peers || {};
    }
  });

  // ---- AI-generated game code runs here ----
  ${safeHtml}
})();
<\/script>
</body></html>`;
}

/* ---------- results ---------- */
function showResults(subtitle) {
  $('#resultsSub').textContent = subtitle;
  showScreen('results');
  if (state.role === 'guest') {
    $('#btnPlayAgain').disabled = true;
    $('#btnPlayAgain').title = 'Waiting for host…';
  } else {
    $('#btnPlayAgain').disabled = false;
    $('#btnPlayAgain').title = '';
  }
}
function backToLobby() {
  // cleanup iframe listeners
  window.onmessage = null;
  // reset
  for (const [, p] of state.players) { p.ready = false; p.prompt = ''; }
  showScreen('lobby');
  renderPlayers();
  renderReadyDots();
}

/* ---------- button wiring ---------- */
function wireUI() {
  $('#btnHost').addEventListener('click', hostLobby);
  $('#btnJoin').addEventListener('click', joinLobby);
  $('#codeInput').addEventListener('keydown', e => { if (e.key === 'Enter') joinLobby(); });
  $('#nameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { state.role === 'host' ? hostLobby() : joinLobby(); }
  });
  $('#copyCode').addEventListener('click', () => {
    navigator.clipboard?.writeText(state.code || '');
    toast('code copied');
  });
  $('#promptInput').addEventListener('input', e => $('#charCount').textContent = e.target.value.length);
  $('#btnReady').addEventListener('click', toggleReady);
  $('#btnPlayAgain').addEventListener('click', () => {
    if (state.role === 'host') {
      broadcast({ type: 'play-again' });
      startRound();
    }
  });
  $('#btnLeave').addEventListener('click', () => location.reload());

  // settings modal
  $('#openSettings').addEventListener('click', () => {
    applySettings();
    $('#settingsModal').classList.remove('hidden');
  });
  $('#closeSettings').addEventListener('click', () => $('#settingsModal').classList.add('hidden'));
  $('#settingsModal').addEventListener('click', (e) => {
    if (e.target === $('#settingsModal')) $('#settingsModal').classList.add('hidden');
  });
  $('#toggleKey').addEventListener('click', () => {
    const i = $('#apiKey');
    i.type = i.type === 'password' ? 'text' : 'password';
  });
  $('#saveSettings').addEventListener('click', () => {
    saveSettings();
    toast('settings saved');
  });
  $('#loadModels').addEventListener('click', loadFreeModels);
}

async function loadFreeModels() {
  const sel = $('#modelSelect');
  sel.hidden = false;
  sel.innerHTML = '<option>loading…</option>';
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    const data = await res.json();
    const free = (data.data || []).filter(m => (m.pricing?.prompt === '0' || m.id.endsWith(':free')));
    const list = free.length ? free : (data.data || []).slice(0, 60);
    sel.innerHTML = '';
    for (const m of list) {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.id + (m.pricing?.prompt === '0' ? ' · free' : '');
      sel.appendChild(o);
    }
    sel.onchange = () => { $('#modelInput').value = sel.value; };
  } catch {
    sel.innerHTML = '<option>failed to load — type model id above</option>';
  }
}

/* ---------- go ---------- */
window.addEventListener('DOMContentLoaded', () => {
  wireUI();
  applySettings();
  showScreen('lobby');
});

/* Expose minimal hooks for debugging */
window.__pf = { state, broadcast };

})();