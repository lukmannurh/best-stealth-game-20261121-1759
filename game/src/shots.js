// Staged scenes for screenshots: each one runs the real simulation with a
// fixed seed and a scripted thief, so a screenshot is a true render of the
// game's own code — never a mock-up. ?shot=start|play|end (with &seed=N)
// stages that scene, paints it twice and sets window.__shotReady.
import { LEVEL, STEP } from './config.js';
import { resetWorld, stepWorld } from './world.js';
import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** Walk the thief toward a waypoint, sneaking, for up to `seconds`. */
function sneakToward(world, x, y, seconds) {
  return moveToward(world, x, y, seconds, true);
}

function walkToward(world, x, y, seconds) {
  return moveToward(world, x, y, seconds, false);
}

function moveToward(world, x, y, seconds, sneak) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const dx = x - world.player.x;
    const dy = y - world.player.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) break;
    stepWorld(world, STEP, { x: dx / d, y: dy / d }, sneak, null);
  }
}

/** Let the guards patrol while the thief stands still, for `seconds`. */
function letGuardsPatrol(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    stepWorld(world, STEP, { x: 0, y: 0 }, true, null, true);
  }
}

/** Stage one named scene; returns the screen the renderer should paint. */
export function stageShot(name, world) {
  resetWorld(world);
  if (name === 'start') {
    // Title over a living level: guards mid-patrol, embers glowing, the
    // thief waiting at the entrance.
    letGuardsPatrol(world, 7);
    return { screen: SCREEN_TITLE };
  }
  if (name === 'end') {
    // The getaway: every ember stolen, the thief at the open exit, the
    // guards still walking their oblivious patrols.
    for (const ember of LEVEL.embers) ember.taken = true;
    world.player.embers = 3;
    world.player.x = LEVEL.exit.x + LEVEL.exit.w / 2;
    world.player.y = LEVEL.exit.y + LEVEL.exit.h / 2;
    world.player.angle = Math.PI / 2;
    letGuardsPatrol(world, 5);
    return { screen: SCREEN_WIN };
  }
  // 'play': a real sneaking run — slip along the south hall, then walk
  // (loud, in the open) to the south-west ember so the west guard's meter
  // fills and he comes to look, then freeze in the shadow by the crates.
  sneakToward(world, 120, 660, 3);
  walkToward(world, 95, 620, 3);
  sneakToward(world, 220, 560, 4);
  // No trailing patrol: the frame is taken at the peak of the moment, while
  // a guard is still walking over to look — yellow cone, "?" and SUSPICIOUS.
  return { screen: SCREEN_PLAY };
}
