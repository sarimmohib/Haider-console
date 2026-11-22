# HAIDER CONSOLE

A retro game-console website with **100 distinct, playable games**. Every cartridge has its own look, rules and difficulty curve, with **infinite escalating levels** (8+ guaranteed). Built with plain HTML, CSS and JavaScript — no build step, no dependencies, no external requests.

Live site: https://sarimmohib.github.io/Haider-console/ · Repository: https://github.com/sarimmohib/Haider-console

## Features

- 100 unique games across 20 game engines: snake, breakout, pong, shooters, dodgers, merge puzzles, match-3, sliding puzzles, lights-out, code breaking, runners, flappy, reflex, tower, rhythm, mazes, memory, block stacking, sorting and survival.
- Infinite levels — every clear introduces a new rule, not just more speed: time locks, inverted or rotated controls, fog, blackouts, phantom screens, quake, sudden death and double-score stages.
- Per-cartridge rule loadouts — the five games inside an engine each have a different modifier combination, so they play differently even when they share a core. Pong, flappy and tower games also have unique mechanics (curved/multi-ball, moving walls, shrinking paddles, twin pipes, lasers, bombs, wind and more).
- Responsive console shell: works on phones, tablets and desktops of every size.
- Touch D-pad and A/B buttons, plus full keyboard support. Many games also support swipes and taps on the screen itself.
- Synthesised sound effects, particle bursts, screen shake, level-up confetti and a CRT screen treatment.
- Local high scores, favourites and last-played game via localStorage.
- Search, genre filters, random-game picker and an in-app field manual.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | Arrow keys / WASD | D-pad or drag on screen |
| Primary action | Space / Enter | A button or tap on screen |
| Secondary action | Z | B button |
| Pause | Escape | SELECT |

Each game shows its objective on the screen HUD. Clear it to advance a level; lose all lives and you can retry instantly.

## Run locally

ES modules require an HTTP server (opening index.html directly with file:// will not work):

    cd Haider-console
    python -m http.server 8000
    # open http://localhost:8000

Or with Node: npx serve .

## Deploy to GitHub Pages

1. Copy the contents of this folder into the main branch of sarimmohib/Haider-console.
2. Open Settings > Pages in the repository.
3. Set Source = Deploy from a branch, Branch = main, Folder = / (root).
4. Save. The site will be published at https://sarimmohib.github.io/Haider-console/.

All paths are relative, so no configuration is needed.

## Structure

    index.html          console shell + library markup
    styles.css          responsive design and animation system
    js/core.js          shared engine API, helpers and input state
    js/games.js         the 100 game definitions
    js/modifiers.js     per-game loadouts and level rule mutations
    js/engines/         20 game engines (action, puzzle, reflex, mind)
    js/app.js           game loop, audio, effects, HUD and library UI
    assets/             self-hosted pixel and UI fonts