# Engine authoring spec (internal)

Each engine file lives in `js/engines/` and is an ES module that exports a default object:

```js
import { Engine, clamp, ... } from '../core.js';
class MyGame extends Engine {
  start(level) { super.start(level); /* reset state, scale difficulty by level */ }
  update(dt, input) { /* dt seconds */ }
  draw(ctx) { /* draw into 480x320 logical canvas */ }
  pointer(x, y, phase) { /* phase: 'down' | 'move' | 'up' */ }
  key(code, phase) { /* optional; prefer input polling in update */ }
}
export default { mykey: MyGame };
```

## API available on engines
- `this.w`, `this.h` = 480, 320. `this.level`, `this.p` (game params object), `this.theme` ({bg, primary, accent, ink, glow}), `this.game`.
- `this.rng` seeded random function; helpers `rint(rng,a,b)`, `rnd`, `pick`, `shuffle`.
- Feedback: `this.score(n,x,y,label)`, `this.sfx(name)`, `this.burst(x,y,color,count,opts)`, `this.float(x,y,text,color)`, `this.shake(n)`, `this.flash(color,a)`, `this.setProgress(v)`, `this.setHint(text)`, `this.setCombo(n)`, `this.banner(text,sub)`.
- Life API: `this.setLives(n)`, `this.lifeLost()`. The app owns lives; call lifeLost() when the player fails a life, then reset internal state. If lives reach 0 the app triggers game over automatically — do NOT call lose() for a normal life loss. Only call `this.lose()` for immediate game over (e.g. timer expired with no lives mechanic).
- `this.win()` clears the current level. The app then increments level and calls start(level+1). Levels are infinite; scale difficulty with `this.level` so level 8 is meaningfully harder than level 1.

## Input
Poll in `update(dt, input)`:
- `input.justPressed(code)`, `input.isDown(code)`, `input.released`.
- Codes: `ArrowLeft/Right/Up/Down`, `KeyA/D/W/S`, `Space`, `KeyZ`, `KeyX`, `Enter`, `Escape`.
- Touch/mobile D-pad is mapped by the app to arrow keys; touch A/B buttons to Space / KeyZ. So support BOTH arrow keys and WASD.
- Pointer: `input.pointer.x/y`, `.justDown`, `.down`, `.justUp` in logical coordinates (0..480, 0..320).

## Drawing
- Pure canvas 2D. No DOM access, no external assets. Use helpers from core.js: `roundRect`, `pixelText`, `uiText`, `glowDot`, `drawGrid`, `rgba`, `mix`, `shade`, `clamp`, `lerp`, `TAU`.
- Always draw inside 480x320. Keep a small inner margin (~10px) so the HUD overlay does not cover gameplay.
- Use `this.theme.bg` as background only if needed — the app already clears with it. Prefer subtle accents.

## Sound names
`tick`, `move`, `good`, `score`, `bad`, `power`, `win`, `lose`, `laser`, `jump`, `blip`, `combo`, `start`.

## Quality bar
- Each engine must be genuinely playable, with clear goal, clear feedback, and increasing difficulty.
- Avoid empty/dead states: always show instructions or a visible objective.
- No console.log in shipped engines.
