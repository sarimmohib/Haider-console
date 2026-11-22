/* HAIDER CONSOLE — app controller */
import { GAMES, GENRES, getGame } from './games.js';
import { ENGINE_REGISTRY } from './engines/index.js';
import { Input, VW, VH, clamp, rgba, TAU, roundRect, uiText, pixelText, makeRng } from './core.js';
import { MODS, modsFor, mapKey, mapPoint, timeScale } from './modifiers.js';

const MOD_COLORS = { OVERDRIVE:'#ffd23f', SLOWMO:'#6ee7ff', FOG:'#8ea9c2', PHANTOM:'#c77dff', QUAKE:'#ff8f4d', BLACKOUT:'#7c5cff', DOUBLE:'#4dff9e', TIMER:'#ff5c7a', SUDDEN:'#ff3b6b', REVERSE:'#ff2fd0', SWAP:'#4dc9ff', CHAOS:'#ffd23f' };

const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', { alpha: false });
const input = new Input();

/* ---------- persistence ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('hc_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('hc_' + k, JSON.stringify(v)); } catch {} }
};

/* ---------- sound ---------- */
class Sound {
  constructor() { this.ctx = null; this.on = store.get('sound', true); this.master = null; }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;
    this.master.connect(this.ctx.destination);
  }
  tone(f, dur, type = 'square', vol = 0.5, slide = 0, delay = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(Math.max(30, f), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  play(name) {
    if (!this.on) return;
    this.ensure();
    if (!this.ctx) return;
    switch (name) {
      case 'tick': this.tone(1100, .04, 'square', .25); break;
      case 'move': this.tone(240, .045, 'triangle', .3); break;
      case 'blip': this.tone(520, .06, 'square', .3); break;
      case 'good': this.tone(660, .09, 'square', .4, 260); break;
      case 'score': this.tone(880, .1, 'square', .45, 420); break;
      case 'bad': this.tone(220, .18, 'sawtooth', .35, -150); break;
      case 'power': [0, .07, .14].forEach((d, i) => this.tone([523, 659, 880][i], .12, 'triangle', .4, 0, d)); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .18, 'square', .4, 0, i * .085)); break;
      case 'lose': [440, 330, 220, 130].forEach((f, i) => this.tone(f, .2, 'sawtooth', .35, 0, i * .12)); break;
      case 'laser': this.tone(920, .1, 'sawtooth', .3, -650); break;
      case 'jump': this.tone(300, .14, 'square', .35, 320); break;
      case 'combo': [784, 988, 1319].forEach((f, i) => this.tone(f, .1, 'triangle', .4, 0, i * .045)); break;
      case 'start': [392, 523, 784].forEach((f, i) => this.tone(f, .12, 'square', .4, 0, i * .07)); break;
      default: this.tone(440, .06, 'square', .25);
    }
  }
}
const sound = new Sound();

/* ---------- effects ---------- */
const fx = { parts: [], texts: [], shake: 0, flash: null };
function burst(x, y, color, count = 14, opts = {}) {
  const speed = opts.speed || 110;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + Math.random() * .5;
    const s = speed * (.35 + Math.random() * .85);
    fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: .45 + Math.random() * .45, max: .9, color, size: 1.5 + Math.random() * 2.8 });
  }
}
function float(x, y, text, color) { fx.texts.push({ x, y, text: String(text), color: color || '#fff', life: .9 }); }
function confetti() {
  const cols = ['#ff4d6d', '#ffd23f', '#4dff9e', '#4dc9ff', '#c77dff', '#ffffff'];
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * VW, y = -10 - Math.random() * 100;
    fx.parts.push({ x, y, vx: (Math.random() - .5) * 50, vy: 90 + Math.random() * 160, life: 1.6 + Math.random(), max: 2.6, color: cols[i % cols.length], size: 2 + Math.random() * 3, grav: 90 });
  }
}
function updateFx(dt) {
  fx.shake = Math.max(0, fx.shake - dt * 26);
  if (fx.flash) { fx.flash.a -= dt * 1.6; if (fx.flash.a <= 0) fx.flash = null; }
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i]; p.life -= dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 160) * dt; p.vx *= .99;
    if (p.life <= 0) fx.parts.splice(i, 1);
  }
  for (let i = fx.texts.length - 1; i >= 0; i--) {
    const t = fx.texts[i]; t.life -= dt; t.y -= dt * 24;
    if (t.life <= 0) fx.texts.splice(i, 1);
  }
}
function drawFx() {
  for (const p of fx.parts) {
    ctx.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1);
    ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  for (const t of fx.texts) {
    ctx.globalAlpha = clamp(t.life / .9, 0, 1);
    uiText(ctx, t.text, t.x, t.y, 11, t.color, 'center');
  }
  ctx.globalAlpha = 1;
}

/* ---------- game state ---------- */
const S = { state: 'idle', game: null, engine: null, level: 1, score: 0, lives: 3, hint: '', progress: 0, lastTime: 0, clearAt: 0, overAt: 0, nextLevel: 1, mods: [], prevMods: [], timeLeft: 0, scoreMul: 1 };
const activeKeyMap = {};
let lastPoint = { x: VW / 2, y: VH / 2 };
const api = {
  score(n, x, y, label) {
    S.score += n * S.scoreMul;
    if (x !== undefined) float(x, y, label === undefined ? '+' + n : (label || '+' + n), '#fff');
  },
  win() {
    if (S.state !== 'playing') return;
    S.state = 'clear'; sound.play('win'); confetti(); fx.shake = 6;
    fx.flash = { color: '#ffffff', a: .3 };
    S.nextLevel = S.level + 1; S.clearAt = performance.now() + 900;
    const best = store.get('scores', {});
    if (S.score > (best[S.game.id] || 0)) { best[S.game.id] = S.score; store.set('scores', best); }
  },
  lose() {
    if (S.state !== 'playing') return;
    S.state = 'over'; sound.play('lose'); fx.shake = 12; S.overAt = performance.now() + 550;
    fx.flash = { color: '#ff3b6b', a: .4 };
  },
  sfx: n => sound.play(n),
  burst, float,
  shake(n) { fx.shake = Math.max(fx.shake, n); },
  flash(color, a) { fx.flash = { color, a }; },
  setLives(n) { S.lives = n; },
  lifeLost() {
    S.lives--;
    sound.play('bad');
    fx.shake = Math.max(fx.shake, 9);
    fx.flash = { color: '#ff3b6b', a: .32 };
    if (S.lives <= 0) {
      S.lives = 0;
      S.state = 'over'; sound.play('lose'); S.overAt = performance.now() + 550;
    }
  },
  setProgress(v) { S.progress = clamp(v, 0, 1); },
  setHint(s) { S.hint = s; },
  setCombo() {},
  banner() {}
};

function startGame(game, level = 1) {
  const Cls = ENGINE_REGISTRY[game.engine];
  if (!Cls) { toast('ENGINE MISSING: ' + game.engine); return; }
  sound.ensure();
  S.prevMods = S.mods.slice();
  S.mods = modsFor(game, level, GAMES.indexOf(game));
  S.scoreMul = S.mods.includes('DOUBLE') ? 2 : 1;
  S.timeLeft = S.mods.includes('TIMER') ? Math.max(24, 55 - Math.floor(level / 3) * 5) : 0;
  S.game = game; S.level = level; S.score = 0; S.progress = 0; S.hint = game.how;
  fx.parts.length = 0; fx.texts.length = 0; fx.flash = null;
  S.engine = new Cls(game, api);
  S.clearAt = 0; S.overAt = 0;
  S.engine.start(level);
  S.state = 'playing';
  S.lives = S.mods.includes('SUDDEN') ? 1 : 3;
  store.set('last', game.id);
  applyTheme(game.theme);
  hideOverlay();
  document.querySelectorAll('.cart').forEach(el => el.classList.toggle('active', el.dataset.id === game.id));
  sound.play('start');
  renderLibrary();
  updateHud();
  const fresh = S.mods.filter(m => !S.prevMods.includes(m));
  toast((fresh.length ? 'NEW RULE · ' + fresh.map(m => MODS[m].name).join(' + ') : 'LEVEL ' + level + ' · ' + S.mods.map(m => MODS[m].name).join(' + ')));
}

function applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--now-primary', t.primary);
  r.setProperty('--now-accent', t.accent);
  $('screen').style.boxShadow = 'inset 0 0 0 2px rgba(0,0,0,.9), 0 0 34px ' + rgba(t.accent, .2);
}

/* ---------- overlay ---------- */
function showOverlay({ icon, kicker, title, desc, primary, secondary, foot, onPrimary, onSecondary }) {
  $('overlayIcon').textContent = icon || '🎮';
  $('overlayKicker').textContent = kicker || 'HAIDER CONSOLE';
  $('overlayTitle').textContent = title || 'READY?';
  $('overlayDesc').textContent = desc || '';
  $('overlayFoot').textContent = foot || '';
  const p = $('primaryBtn'), s = $('secondaryBtn');
  p.textContent = primary || 'START';
  s.textContent = secondary || 'LIBRARY';
  s.hidden = !secondary;
  p.onclick = () => { sound.ensure(); onPrimary && onPrimary(); };
  s.onclick = () => { onSecondary && onSecondary(); };
  $('overlay').hidden = false;
  $('overlay').classList.remove('fade');
  const card = $('overlayCard');
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
}
function hideOverlay() { $('overlay').classList.add('fade'); setTimeout(() => { if (S.state === 'playing') $('overlay').hidden = true; }, 240); }

function showClear() {
  const next = modsFor(S.game, S.level + 1, GAMES.indexOf(S.game));
  const fresh = next.filter(m => !S.mods.includes(m));
  showOverlay({
    icon: '🏆', kicker: 'LEVEL ' + String(S.level).padStart(2, '0') + ' COMPLETE',
    title: 'LEVEL CLEAR!', desc: 'Score ' + S.score.toLocaleString() + '. ' + (fresh.length ? 'Next stage adds: ' + fresh.map(m => MODS[m].name).join(' + ') + '.' : 'Rules intensify on the next stage.'),
    primary: 'NEXT LEVEL', secondary: 'MENU',
    foot: 'AUTO ADVANCING…',
    onPrimary: () => startGame(S.game, S.nextLevel),
    onSecondary: () => toMenu()
  });
}
function showOver() {
  const best = store.get('scores', {})[S.game.id] || 0;
  showOverlay({
    icon: '💀', kicker: 'GAME OVER', title: 'TRY AGAIN?',
    desc: 'You scored ' + S.score.toLocaleString() + (best ? ' · Best ' + best.toLocaleString() : '') + '. Every run is a new shot.',
    primary: 'RETRY', secondary: 'LIBRARY',
    foot: 'PRESS SPACE OR ENTER TO RETRY',
    onPrimary: () => startGame(S.game, 1),
    onSecondary: () => toMenu()
  });
}
function showPause() {
  showOverlay({
    icon: '⏸️', kicker: 'SYSTEM PAUSED', title: 'PAUSED',
    desc: S.game.name + ' · Level ' + S.level,
    primary: 'RESUME', secondary: 'MENU',
    foot: 'PRESS ESC OR START TO RESUME',
    onPrimary: () => resume(),
    onSecondary: () => toMenu()
  });
}
function showIdle() {
  const lastId = store.get('last', null);
  const last = lastId ? getGame(lastId) : null;
  showOverlay({
    icon: '🎮', kicker: 'HAIDER CONSOLE', title: 'READY?',
    desc: last ? 'Last played: ' + last.name + '. Jump back in or explore all 100 cartridges.' : 'Pick a cartridge from the library and press START. 100 games. Infinite levels. Zero filler.',
    primary: last ? 'PLAY ' + last.name.toUpperCase() : 'PICK A GAME',
    secondary: last ? 'BROWSE ALL' : 'HOW TO PLAY',
    foot: 'ARROWS / WASD + SPACE · TOUCH CONTROLS BELOW',
    onPrimary: () => last ? startGame(last, 1) : document.getElementById('library').scrollIntoView({ behavior: 'smooth' }),
    onSecondary: () => last ? toMenu() : openHow()
  });
}
function toMenu() {
  S.state = 'idle'; S.engine = null; S.game = null; S.lives = 3; S.score = 0; S.progress = 0;
  ctx.fillStyle = '#05070e'; ctx.fillRect(0, 0, VW, VH);
  $('hudGame').textContent = 'NO CARTRIDGE'; $('hudLevel').textContent = 'LV 00';
  $('hudScore').textContent = '000000'; $('hudLives').textContent = '';
  $('hudHint').textContent = 'SELECT A GAME TO BEGIN'; $('progressFill').style.width = '0%';
  showIdle();
}
function pause() {
  if (S.state !== 'playing') return;
  S.state = 'paused'; showPause();
}
function resume() {
  if (S.state !== 'paused') return;
  S.state = 'playing'; hideOverlay();
}

/* ---------- HUD ---------- */
function updateHud() {
  if (S.game) {
    $('hudGame').textContent = S.game.name.toUpperCase();
    $('hudLevel').textContent = 'LV ' + String(S.level).padStart(2, '0');
    $('hudHint').textContent = (S.timeLeft > 0 ? '⏱ ' + Math.ceil(S.timeLeft) + 's · ' : '') + (S.hint || S.game.how);
    $('hudLives').innerHTML = '♥'.repeat(Math.max(0, S.lives)) + '<span style="opacity:.22">' + '♥'.repeat(Math.max(0, 3 - S.lives)) + '</span>';
  }
  $('hudScore').textContent = String(S.score).padStart(6, '0');
  $('progressFill').style.width = (S.progress * 100).toFixed(1) + '%';
  const chips = $('modChips'), key = S.mods.join(',');
  if (chips.dataset.key !== key) {
    chips.dataset.key = key;
    chips.innerHTML = S.mods.map(m => '<span class="mod-chip" style="color:' + MOD_COLORS[m] + '" title="' + MODS[m].desc + '">' + MODS[m].icon + ' ' + MODS[m].name + '</span>').join('');
  }
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 1400);
}

/* ---------- library ---------- */
let activeGenre = 'All';
function cartColor(theme) { return theme.primary; }
function renderLibrary() {
  const q = $('search').value.trim().toLowerCase();
  const favs = store.get('favs', []);
  const scores = store.get('scores', {});
  const list = GAMES.filter(gm =>
    (activeGenre === 'All' || gm.genre === activeGenre) &&
    (!q || (gm.name + ' ' + gm.genre + ' ' + gm.engine).toLowerCase().includes(q))
  );
  const grid = $('grid');
  grid.innerHTML = list.map((gm, i) => {
    const best = scores[gm.id] || 0;
    return '<div class="cart' + (favs.includes(gm.id) ? ' fav' : '') + (S.game && S.game.id === gm.id ? ' active' : '') + '" role="button" tabindex="0" data-id="' + gm.id + '" style="--cart:' + cartColor(gm.theme) + ';animation-delay:' + Math.min(i * 7, 320) + 'ms" title="' + gm.name + ' — star to favourite">' +
      '<span class="cart-num">' + String(GAMES.indexOf(gm) + 1).padStart(3, '0') + '</span>' +
      '<button class="fav-btn" data-fav="' + gm.id + '" aria-label="Favourite">★</button>' +
      '<div class="cart-icon">' + gm.icon + '</div>' +
      '<div class="cart-name">' + gm.name.toUpperCase() + '</div>' +
      '<div class="cart-genre">' + gm.genre + '</div>' +
      '<div class="cart-mods">' + modsFor(gm, 1, GAMES.indexOf(gm)).slice(0, 2).map(m => MODS[m].icon + ' ' + MODS[m].name).join(' · ') + '</div>' +
      (best ? '<div class="cart-best">' + best.toLocaleString() + '</div>' : '') +
      '<span class="cart-fav">★</span></div>';
  }).join('');
  $('empty').hidden = list.length > 0;
  $('resultCount').textContent = list.length + (list.length === 1 ? ' GAME' : ' GAMES');
  grid.querySelectorAll('.cart').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(getGame(el.dataset.id), 1); } });
    el.addEventListener('click', e => {
      if (e.target.closest('.fav-btn')) return;
      startGame(getGame(el.dataset.id), 1);
    });
    el.addEventListener('contextmenu', e => { e.preventDefault(); toggleFav(el.dataset.id); });
  });
  grid.querySelectorAll('.fav-btn').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); toggleFav(el.dataset.fav); }));
}
function toggleFav(id) {
  let favs = store.get('favs', []);
  favs = favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id];
  store.set('favs', favs); renderLibrary();
}
function renderGenres() {
  $('genreBar').innerHTML = GENRES.map(g => '<button class="genre' + (g === activeGenre ? ' active' : '') + '" data-g="' + g + '">' + g.toUpperCase() + '</button>').join('');
  $('genreBar').querySelectorAll('.genre').forEach(b => b.onclick = () => { activeGenre = b.dataset.g; renderGenres(); renderLibrary(); });
}

/* ---------- input ---------- */
const KEYMAP = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Space: 1, Enter: 1, KeyZ: 1, KeyX: 1, Escape: 1, KeyA: 1, KeyD: 1, KeyW: 1, KeyS: 1 };
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (KEYMAP[e.code]) e.preventDefault();
  sound.ensure();
  const now = performance.now();
  const mapped = mapKey(e.code, S.mods, now);
  activeKeyMap[e.code] = mapped;
  if (!input.keys.has(mapped)) input.down(mapped);
  if (S.engine && S.state === 'playing') S.engine.key(mapped, 'down');
  if (e.code === 'Escape') { if (S.state === 'playing') pause(); else if (S.state === 'paused') resume(); }
  if ((e.code === 'Enter' || e.code === 'Space') && S.state !== 'playing') {
    if (S.state === 'idle') $('primaryBtn').click();
    else if (S.state === 'clear') $('primaryBtn').click();
    else if (S.state === 'over') $('primaryBtn').click();
    else if (S.state === 'paused') resume();
  }
}, { passive: false });
window.addEventListener('keyup', e => {
  if (KEYMAP[e.code]) e.preventDefault();
  const mapped = activeKeyMap[e.code] || mapKey(e.code, S.mods, performance.now());
  input.up(mapped);
  if (S.engine) S.engine.key(mapped, 'up');
  delete activeKeyMap[e.code];
}, { passive: false });
window.addEventListener('blur', () => { input.keys.clear(); if (S.state === 'playing') pause(); });

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * VW, y: (e.clientY - r.top) / r.height * VH };
}
canvas.addEventListener('pointerdown', e => {
  e.preventDefault(); sound.ensure();
  const raw = toLogical(e);
  lastPoint = raw;
  const p = mapPoint(raw.x, raw.y, S.mods, VW, VH);
  input.pointer.x = p.x; input.pointer.y = p.y; input.pointer.down = true; input.pointer.justDown = true;
  if (S.engine && S.state === 'playing') S.engine.pointer(p.x, p.y, 'down');
  try { canvas.setPointerCapture(e.pointerId); } catch {}
}, { passive: false });
canvas.addEventListener('pointermove', e => {
  const raw = toLogical(e);
  lastPoint = raw;
  const p = mapPoint(raw.x, raw.y, S.mods, VW, VH);
  input.pointer.x = p.x; input.pointer.y = p.y;
  if (S.engine && S.state === 'playing') S.engine.pointer(p.x, p.y, 'move');
});
canvas.addEventListener('pointerup', e => {
  const raw = toLogical(e);
  const p = mapPoint(raw.x, raw.y, S.mods, VW, VH);
  input.pointer.down = false; input.pointer.justUp = true;
  if (S.engine && S.state === 'playing') S.engine.pointer(p.x, p.y, 'up');
}, { passive: false });
canvas.addEventListener('pointercancel', () => { input.pointer.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

document.querySelectorAll('[data-key]').forEach(btn => {
  const code = btn.dataset.key;
  const press = e => {
    e.preventDefault(); sound.ensure();
    const mapped = mapKey(code, S.mods, performance.now());
    activeKeyMap['BTN_' + code] = mapped;
    input.down(mapped); btn.classList.add('held');
    if (S.engine && S.state === 'playing') S.engine.key(mapped, 'down');
    if (code === 'Escape') { if (S.state === 'playing') pause(); else if (S.state === 'paused') resume(); }
    if (code === 'Enter' && S.state !== 'playing') $('primaryBtn').click();
    try { btn.setPointerCapture(e.pointerId); } catch {}
  };
  const release = e => {
    e.preventDefault();
    const mapped = activeKeyMap['BTN_' + code] || mapKey(code, S.mods, performance.now());
    input.up(mapped); btn.classList.remove('held');
    if (S.engine) S.engine.key(mapped, 'up');
    delete activeKeyMap['BTN_' + code];
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
});

/* Input wrapper: control modifiers affect engine polls as well as events. */
function viewInput(base, t) {
  const p = mapPoint(base.pointer.x, base.pointer.y, S.mods, VW, VH);
  return {
    keys: base.keys, pressed: base.pressed, released: base.released,
    pointer: { x: p.x, y: p.y, down: base.pointer.down, justDown: base.pointer.justDown, justUp: base.pointer.justUp },
    isDown: c => base.isDown(mapKey(c, S.mods, t)),
    justPressed: c => base.justPressed(mapKey(c, S.mods, t))
  };
}

/* ---------- loop ---------- */
function drawBackdrop() {
  ctx.fillStyle = S.game ? S.game.theme.bg : '#05070e';
  ctx.fillRect(0, 0, VW, VH);
  if (S.game) {
    ctx.fillStyle = rgba(S.game.theme.primary, .04);
    ctx.fillRect(0, 0, VW, VH);
  }
}
function frame(t) {
  const dt = Math.min(.05, (t - S.lastTime) / 1000 || 0);
  S.lastTime = t;
  const now = performance.now();
  if (S.state === 'over' && S.overAt && now >= S.overAt) { S.overAt = 0; showOver(); }
  if (S.state === 'clear' && S.clearAt && now >= S.clearAt) { S.clearAt = 0; showClear(); }
  if (S.state === 'playing' && S.engine) {
    S.engine.update(dt * timeScale(S.mods), viewInput(input, now));
    if (S.mods.includes('QUAKE')) fx.shake = Math.max(fx.shake, 2.2);
    if (S.timeLeft > 0) {
      S.timeLeft -= dt;
      if (S.timeLeft <= 0) { api.lifeLost(); S.timeLeft = Math.max(24, 55 - Math.floor(S.level / 3) * 5); }
    }
    updateFx(dt);
  } else if (S.state !== 'paused') updateFx(dt);

  ctx.save();
  if (fx.shake > 0) ctx.translate((Math.random() - .5) * fx.shake, (Math.random() - .5) * fx.shake);
  drawBackdrop();
  if (S.engine) S.engine.draw(ctx);
  drawFx();
  ctx.restore();
  if (fx.flash) { ctx.fillStyle = rgba(fx.flash.color, Math.min(.5, fx.flash.a)); ctx.fillRect(0, 0, VW, VH); }
  if (S.state === 'playing' || S.state === 'clear') {
    if (S.mods.includes('FOG')) {
      const g = ctx.createRadialGradient(lastPoint.x, lastPoint.y, 14, lastPoint.x, lastPoint.y, 165);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,.9)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    }
    const ph = (now / 1000) % 7;
    if (S.mods.includes('BLACKOUT') && ph > 6.15) { ctx.fillStyle = 'rgba(0,0,0,.9)'; ctx.fillRect(0, 0, VW, VH); }
    const pp = (now / 1000) % 5.5;
    if (S.mods.includes('PHANTOM') && pp > 5.15) { ctx.fillStyle = 'rgba(0,0,0,.93)'; ctx.fillRect(0, 0, VW, VH); }
  }
  updateHud();
  input.tick();
  requestAnimationFrame(frame);
}

/* ---------- ui wiring ---------- */
$('soundBtn').onclick = () => {
  sound.on = !sound.on; store.set('sound', sound.on);
  $('soundLabel').textContent = sound.on ? 'SOUND ON' : 'SOUND OFF';
  $('soundBtn').querySelector('.pill-ico').textContent = sound.on ? '♪' : '✕';
  if (sound.on) sound.play('blip');
};
$('soundLabel').textContent = sound.on ? 'SOUND ON' : 'SOUND OFF';
if (!sound.on) $('soundBtn').querySelector('.pill-ico').textContent = '✕';
$('randomBtn').onclick = () => startGame(GAMES[Math.floor(Math.random() * GAMES.length)], 1);
$('search').addEventListener('input', renderLibrary);
function openHow() { $('howModal').hidden = false; }
function closeHow() { $('howModal').hidden = true; }
$('howBtn').onclick = openHow; $('howClose').onclick = closeHow; $('howOk').onclick = closeHow;
$('howModal').addEventListener('click', e => { if (e.target === $('howModal')) closeHow(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S.state === 'playing') pause(); });
window.addEventListener('error', e => toast('ERROR: ' + (e.message || 'unknown')));

window.__HC__ = { S, GAMES, startGame, api, ENGINE_REGISTRY };
renderGenres(); renderLibrary(); showIdle();
requestAnimationFrame(frame);
