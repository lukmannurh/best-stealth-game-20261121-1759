// The player: a thief in a hooded cloak. Walk with keys or click to move,
// hold Shift to sneak (slower, silent, harder to spot). Walking makes
// noise guards can hear; sneaking does not. Touching an ember steals it.
import { EMBERS, LEVEL, PLAYER } from './config.js';
import { circleHitsSolid, moveCircle, pointInShadow } from './level.js';

export function createPlayer() {
  return {
    x: LEVEL.entrance.x,
    y: LEVEL.entrance.y,
    r: PLAYER.radius,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    noise: 0,
    noiseX: 0,
    noiseY: 0,
    targetX: null,
    targetY: null,
    embers: 0,
    lives: PLAYER.lives,
    invulnerable: 0,
    steps: 0,
  };
}

/** Put the player back at the entrance after being caught. */
export function resetPlayer(player) {
  player.x = LEVEL.entrance.x;
  player.y = LEVEL.entrance.y;
  player.angle = -Math.PI / 2;
  player.targetX = null;
  player.targetY = null;
  player.noise = 0;
  player.invulnerable = 1.5;
}

/**
 * One player step. `move` is {x, y} in [-1, 1] from keys, `sneak` is the
 * Shift key, and a click target overrides the keys while it lasts.
 * Returns true when the player just stole an ember.
 */
export function updatePlayer(player, dt, move, sneak, clickTarget) {
  player.sneaking = sneak;
  player.noise = 0;

  let dx = 0;
  let dy = 0;
  if (clickTarget) {
    const tx = clickTarget.x - player.x;
    const ty = clickTarget.y - player.y;
    const d = Math.hypot(tx, ty);
    if (d > 6) {
      dx = tx / d;
      dy = ty / d;
    } else {
      clickTarget.done = true;
    }
  } else {
    dx = move.x;
    dy = move.y;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
  }

  const speed = sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const moving = dx !== 0 || dy !== 0;
  player.moving = moving;
  if (moving) {
    player.angle = Math.atan2(dy, dx);
    moveCircle(player, dx * speed * dt, dy * speed * dt);
    player.steps += 1;
    if (!sneak) {
      // Loud footsteps: guards nearby come to listen.
      player.noise = PLAYER.noiseRadius;
      player.noiseX = player.x;
      player.noiseY = player.y;
    }
  }
  if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);

  // Steal any ember within reach.
  for (const ember of LEVEL.embers) {
    if (ember.taken) continue;
    const d = Math.hypot(ember.x - player.x, ember.y - player.y);
    if (d < player.r + 20) {
      ember.taken = true;
      player.embers += 1;
      return true;
    }
  }
  return false;
}

/** True when the player stands inside a shadow zone (harder to spot). */
export function playerInShadow(player) {
  return pointInShadow(player.x, player.y);
}

/** True when the player is caught by an alerted guard touching them. */
export function playerCaughtBy(player, guard) {
  if (player.invulnerable > 0) return false;
  const d = Math.hypot(guard.x - player.x, guard.y - player.y);
  return d < guard.r + player.r - 2;
}

/** True when the player stands on the exit with every ember stolen. */
export function playerAtExit(player) {
  const exit = LEVEL.exit;
  return (
    player.embers >= EMBERS &&
    player.x > exit.x - 10 &&
    player.x < exit.x + exit.w + 10 &&
    player.y > exit.y - 10 &&
    player.y < exit.y + exit.h + 10
  );
}

/** The exit is open only once every ember is stolen. */
export function exitIsOpen(player) {
  return player.embers >= EMBERS;
}

/** Unused by the loop; kept for the dossier outline: is this spot walkable? */
export function spotIsFree(x, y, r) {
  return !circleHitsSolid(x, y, r);
}
