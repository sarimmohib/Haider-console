/* Rule mutations — make each cartridge and each level play differently. */
export const MODS = {
  OVERDRIVE:{name:'OVERDRIVE',icon:'⚡',kind:'tempo',desc:'Everything runs 30% faster'},
  SLOWMO:   {name:'SLOW-MO',icon:'🐌',kind:'tempo',desc:'Slow, precision timing'},
  FOG:      {name:'FOG',icon:'🌫️',kind:'visual',desc:'The field is shrouded in darkness'},
  PHANTOM:  {name:'PHANTOM',icon:'👻',kind:'visual',desc:'The screen flickers out briefly'},
  QUAKE:    {name:'QUAKE',icon:'🌋',kind:'visual',desc:'The cabinet will not stay still'},
  BLACKOUT: {name:'BLACKOUT',icon:'🌑',kind:'visual',desc:'Periodic total darkness'},
  DOUBLE:   {name:'2× SCORE',icon:'💰',kind:'rule',desc:'Double points for every action'},
  TIMER:    {name:'TIME LOCK',icon:'⏱️',kind:'rule',desc:'Clear the level before time runs out'},
  SUDDEN:   {name:'SUDDEN DEATH',icon:'💀',kind:'rule',desc:'One life. No second chances'},
  REVERSE:  {name:'INVERTED',icon:'🔃',kind:'control',desc:'All controls are inverted'},
  SWAP:     {name:'ROTATED',icon:'🔄',kind:'control',desc:'Controls are rotated 90 degrees'},
  CHAOS:    {name:'CHAOS',icon:'🌀',kind:'control',desc:'Controls scramble over time'}
};

const SAFE = ['OVERDRIVE','SLOWMO','FOG','PHANTOM','QUAKE','DOUBLE','TIMER','BLACKOUT','SUDDEN'];
const CONTROL = ['REVERSE','SWAP','CHAOS'];
/* Curated pairs guarantee that the five games of an engine never share a loadout. */
const BASE_PAIRS = [
  ['OVERDRIVE','FOG'], ['SLOWMO','PHANTOM'], ['QUAKE','DOUBLE'], ['TIMER','BLACKOUT'],
  ['SUDDEN','OVERDRIVE'], ['FOG','DOUBLE'], ['SLOWMO','TIMER'], ['BLACKOUT','QUAKE'],
  ['PHANTOM','OVERDRIVE'], ['DOUBLE','SLOWMO'], ['FOG','SUDDEN'], ['QUAKE','TIMER']
];

function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }

/** Stable, distinct loadout per game; levels unlock stronger rules. */
export function modsFor(game, level, index) {
  const h = (hash(game.id) ^ (index * 2654435761 >>> 0)) >>> 0;
  const out = [];
  const add = k => { if (k && !out.includes(k)) out.push(k); };
  const group = Math.floor(index / 5), variant = index % 5;
  for (const k of BASE_PAIRS[(variant + group * 5) % BASE_PAIRS.length]) add(k);
  if (level >= 3) add(SAFE[(h + level * 3) % SAFE.length]);
  if (level >= 5) add(CONTROL[(h >>> 11) % CONTROL.length]);
  if (level >= 7) add(SAFE[(h >>> 5) % SAFE.length]);
  if (level >= 9) add(TIMERin(out) ? 'DOUBLE' : 'TIMER');
  if (level >= 11) add('PHANTOM');
  return out;
}
function TIMERin(arr){ return arr.includes('TIMER'); }

/** Map an input code through the active control modifiers. */
export function mapKey(code, mods, t) {
  const lr = ['ArrowLeft','ArrowRight','KeyA','KeyD'];
  const ud = ['ArrowUp','ArrowDown','KeyW','KeyS'];
  let out = code;
  if (mods.includes('REVERSE')) {
    if (code === 'ArrowLeft') out = 'ArrowRight'; else if (code === 'ArrowRight') out = 'ArrowLeft';
    else if (code === 'KeyA') out = 'KeyD'; else if (code === 'KeyD') out = 'KeyA';
    else if (code === 'ArrowUp') out = 'ArrowDown'; else if (code === 'ArrowDown') out = 'ArrowUp';
    else if (code === 'KeyW') out = 'KeyS'; else if (code === 'KeyS') out = 'KeyW';
  }
  if (mods.includes('SWAP')) {
    const swap = { ArrowLeft:'ArrowUp', ArrowRight:'ArrowDown', ArrowUp:'ArrowRight', ArrowDown:'ArrowLeft', KeyA:'KeyW', KeyD:'KeyS', KeyW:'KeyD', KeyS:'KeyA' };
    out = swap[out] || out;
  }
  if (mods.includes('CHAOS')) {
    const all = [...lr, ...ud];
    const i = all.indexOf(out);
    if (i >= 0) {
      const shift = Math.floor(t / 3500) % 4;
      const group = i < 4 ? lr : ud;
      const pos = i % 4;
      out = group[(pos + shift) % 4];
    }
  }
  return out;
}

/** Map a pointer position through active visual/control modifiers. */
export function mapPoint(x, y, mods, w, h) {
  if (mods.includes('REVERSE')) { x = w - x; y = h - y; }
  if (mods.includes('SWAP')) { const nx = x / w * h; x = y / h * w; y = nx; }
  return { x, y };
}

export function timeScale(mods) {
  if (mods.includes('OVERDRIVE') && mods.includes('SLOWMO')) return 1;
  if (mods.includes('OVERDRIVE')) return 1.32;
  if (mods.includes('SLOWMO')) return 0.72;
  return 1;
}
