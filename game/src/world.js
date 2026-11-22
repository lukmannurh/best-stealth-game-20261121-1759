// The world: one thief, four guards, three embers and an exit. No drawing
// and no browser in it — step() advances one fixed step and returns what
// happened as bit flags, so the caller can react (and play sounds) without
// the world knowing about screens or sound.
import { LEVEL, STEP } from './config.js';
import { createGuards, GUARD_ALERT, updateGuard } from './guards.js';
import {
  createPlayer,
  exitIsOpen,
  playerAtExit,
  playerCaughtBy,
  resetPlayer,
  updatePlayer,
} from './player.js';

export const EVENT_EMBER = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_WIN = 8;
export const EVENT_LOST = 16;

/** A fresh world: the thief at the entrance, guards on patrol, embers in place. */
export function createWorld() {
  const world = {
    player: createPlayer(),
    guards: createGuards(),
    elapsed: 0,
    alertLevel: 0,
    maxMeter: 0,
  };
  return world;
}

/** Back to the start of a run: embers return, guards return, clock resets. */
export function resetWorld(world) {
  for (const ember of LEVEL.embers) ember.taken = false;
  world.player = createPlayer();
  world.guards = createGuards();
  world.elapsed = 0;
  world.alertLevel = 0;
  world.maxMeter = 0;
}

/** After being caught: the thief slips back to the entrance, guards resume patrol. */
export function resetPositions(world) {
  resetPlayer(world.player);
  world.guards = createGuards();
  world.alertLevel = 0;
  world.maxMeter = 0;
}

/**
 * One fixed step. `move` is {x, y} from the keys, `sneak` is the Shift key,
 * `clickTarget` is the mouse's walk-to point (or null). With `harmless` set
 * (the title screen's backdrop) guards patrol but nothing spots, steals or
 * wins. Returns event flags.
 */
export function stepWorld(world, dt, move, sneak, clickTarget, harmless = false) {
  let events = 0;
  world.elapsed += dt;

  const stole = harmless ? false : updatePlayer(world.player, dt, move, sneak, clickTarget);
  if (stole) events |= EVENT_EMBER;

  let alertLevel = 0;
  let maxMeter = 0;
  for (const guard of world.guards) {
    const guardEvents = updateGuard(guard, dt, world.player, harmless);
    if (guardEvents & 1) events |= EVENT_SPOTTED;
    if (guardEvents & 2) events |= EVENT_LOST;
    if (guard.state > alertLevel) alertLevel = guard.state;
    if (guard.meter > maxMeter) maxMeter = guard.meter;
  }
  world.alertLevel = alertLevel;
  world.maxMeter = maxMeter;

  if (!harmless && alertLevel === GUARD_ALERT) {
    for (const guard of world.guards) {
      if (guard.state === GUARD_ALERT && playerCaughtBy(world.player, guard)) {
        world.player.lives -= 1;
        events |= EVENT_CAUGHT;
        break;
      }
    }
  }

  if (!harmless && exitIsOpen(world.player) && playerAtExit(world.player)) events |= EVENT_WIN;
  return events;
}

/** The fixed-step alias the main loop uses (kept for the outline's clarity). */
export { STEP };
