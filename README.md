# SHADOWLINE — Steal the Embers

A top-down 2D stealth game for the make.fun "Make the best stealth game"
competition. Original work, no commercial copies.

## The game

Steal three embers from the Ember Archive and reach the exit unseen.
Four guards patrol with vision cones; a detection meter fills when you are
seen, drains when you are hidden. At 0.35 a guard gets suspicious and comes
to look; at 1.0 the alarm sounds and the guard chases. Getting caught costs
a life and respawns you at the entrance — three lives, then the run ends.

- **Sneak (hold Shift):** slower, silent, ×0.6 detection.
- **Walk:** fast, loud — guards within 130 px hear it and investigate.
- **Shadow zones:** ×0.45 detection. **Lamps:** pools of light, no cover.
- Crates and walls block sight and movement; the exit stays LOCKED until
  all three embers are stolen.

## Controls

WASD / arrows or click the floor to move, hold Shift to sneak, P to pause,
Space / Enter to confirm. Timer and best time in localStorage; WebAudio
blips for pickup, alarm, caught and win (no audio files).

## Files

- `game/index.html` — canvas + status line (screen-reader live region).
- `game/src/` — 11 ES modules: `config` (level + tuning), `random`
  (mulberry32), `level` (collision, line-of-sight, light tests), `guards`
  (patrol / suspicious / alert / search state machine), `player`,
  `audio`, `input`, `render` (darkness sheet, vision cones, HUD, panels),
  `shots` (staged screenshot scenes), `world` (step + events), `main`
  (loop, screens, shot mode).
- `main.ts` — builds `dossier.json` + copies `game/` and `screenshots/`
  to `$MAKEFUN_OUTPUT_DIR` (same caps as the kit starter).
- `screenshots/` — 1-start, 2-play, 3-end (1280×720 JPEG, ≤256 KiB each).
  Staged with `?shot=start|play|end&seed=1`; each shot runs the real
  simulation and paints twice, then sets `window.__shotReady`.

## Local verification

- All 11 JS modules pass `node --check`.
- Headless sim: all 4 guards complete patrol laps in 120 s; detection
  0.83 at 80 px in-cone; guard goes ALERT, meter 1.00, spotted event;
  scripted sneak run picks up 1 ember (max meter 0.67); win event fires
  at the exit with 3 embers.
- Interactive Playwright playtest: title → Space → walk/sneak with keys,
  player moves and collides, HUD updates, zero console/page errors.
- `main.ts` output: dossier 379 KB (deterministic, identical sha256 on
  two runs), 12 source files (56 KB), no external references.
