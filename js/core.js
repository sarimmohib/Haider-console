/* ============================================================
   HAIDER CONSOLE — CORE RUNTIME
   Shared helpers + base class for all 100 games.
   ============================================================ */

export const VW = 480;
export const VH = 320;

/* ---------- math ---------- */
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
export const TAU = Math.PI * 2;

/** Deterministic PRNG (mulberry32). */
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rnd = (r, a, b) => a + (b - a) * r();
export const rint = (r, a, b) => Math.floor(a + (b - a + 1) * r());
export const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
export function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- color ---------- */
export function rgba(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
export function mix(hexA, hexB, t) {
  const a = parseInt(hexA.replace('#', ''), 16), b = parseInt(hexB.replace('#', ''), 16);
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
export const shade = (hex, amt) => mix(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt));

/* ---------- drawing ---------- */
export function roundRect(ctx, x, y, w, h, r, fill, stroke, lw = 1) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function pixelText(ctx, str, x, y, size, color, align = 'left') {
  ctx.save();
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(String(str), x, y);
  ctx.restore();
}
export function uiText(ctx, str, x, y, size, color, align = 'left', weight = 700) {
  ctx.save();
  ctx.font = `${weight} ${size}px "Chakra Petch", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(String(str), x, y);
  ctx.restore();
}
export function glowDot(ctx, x, y, r, color, glow = r * 2.2) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, glow);
  g.addColorStop(0, rgba(color, 0.85));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, glow, 0, TAU); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
export function drawGrid(ctx, w, h, step, color, alpha = 0.08) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= w; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); }
  for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); }
  ctx.stroke();
  ctx.restore();
}

/* ---------- gamepad input snapshot ---------- */
export class Input {
  constructor() { this.keys = new Set(); this.pressed = new Set(); this.released = new Set(); this.pointer = { x: 0, y: 0, down: false, justDown: false, justUp: false }; }
  down(code) { if (!this.keys.has(code)) this.pressed.add(code); this.keys.add(code); }
  up(code) { if (this.keys.has(code)) this.released.add(code); this.keys.delete(code); }
  tick() { this.pressed.clear(); this.released.clear(); this.pointer.justDown = false; this.pointer.justUp = false; }
  isDown(code) { return this.keys.has(code); }
  justPressed(code) { return this.pressed.has(code); }
}

/* ============================================================
   BASE ENGINE — every game extends this.
   Override start/update/draw/pointer/key. Call win()/lose() etc.
   ============================================================ */
export class Engine {
  constructor(game, api) {
    this.game = game;
    this.api = api;
    this.p = game.params || {};
    this.w = VW;
    this.h = VH;
    this.level = 1;
    this.rng = makeRng(1);
    this.dead = false;
  }
  get theme() { return this.game.theme; }
  get name() { return this.game.name; }

  /* lifecycle — override */
  start(level) { this.level = level || 1; this.rng = makeRng((this.game.seed || 1) * 7919 + level * 104729); }
  update(dt, input) {}
  draw(ctx) {}
  pointer(x, y, phase) {}
  key(code, phase) {}

  /* feedback helpers */
  score(n, x, y, label) { this.api.score(n, x, y, label); }
  win() { if (!this.dead) { this.dead = true; this.api.win(); } }
  lose() { if (!this.dead) { this.dead = true; this.api.lose(); } }
  sfx(name) { this.api.sfx(name); }
  burst(x, y, color, count = 14, opts = {}) { this.api.burst(x, y, color, count, opts); }
  float(x, y, text, color) { this.api.float(x, y, text, color); }
  shake(n) { this.api.shake(n); }
  flash(color, a) { this.api.flash(color, a); }
  setLives(n) { this.api.setLives(n); }
  lifeLost() { this.api.lifeLost(); }
  setProgress(v) { this.api.setProgress(v); }
  setHint(s) { this.api.setHint(s); }
  setCombo(n) { this.api.setCombo(n); }
  banner(text, sub) { this.api.banner(text, sub); }
}

/* Engine registry filled by engine modules. */
export const ENGINE_REGISTRY = {};
export function registerEngine(key, cls) { ENGINE_REGISTRY[key] = cls; }
