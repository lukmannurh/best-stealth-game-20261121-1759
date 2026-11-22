// The guards: patrols you can learn, a detection meter that gives you a
// chance to recover, and three moods — calm, suspicious, alarmed.
// A guard's state machine: patrol -> suspicious (walk to the last seen or
// heard spot and look) -> alert (chase the player) -> search (look around
// the last seen spot, then walk back to patrol). The world owns the
// detection meter; this module owns the guards' bodies and decisions.
import { DETECTION, GUARD, LEVEL } from './config.js';
import { hasLineOfSight, moveCircle, pointInShadow, sightDistance } from './level.js';

export const GUARD_PATROL = 0;
export const GUARD_SUSPICIOUS = 1;
export const GUARD_ALERT = 2;
export const GUARD_SEARCH = 3;

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/**
 * How strongly this guard sees the player right now: 0 when the player is
 * outside the cone, behind a wall, or out of range; up to 1 dead-centre
 * and close. Shadows and sneaking lower it before it reaches the meter.
 */
export function guardSeesPlayer(guard, player) {
  const d = distance(guard.x, guard.y, player.x, player.y);
  if (d > GUARD.sightRange) return 0;
  const toPlayer = angleTo(guard.x, guard.y, player.x, player.y);
  if (Math.abs(angleDifference(toPlayer, guard.angle)) > GUARD.sightHalfAngle) return 0;
  if (!hasLineOfSight(guard.x, guard.y, player.x, player.y)) return 0;
  // Close and centred reads strongest; the far edge of the cone reads weakest.
  const rangeFactor = 1 - (d / GUARD.sightRange) * 0.5;
  const centreFactor = 1 - Math.abs(angleDifference(toPlayer, guard.angle)) / GUARD.sightHalfAngle;
  let strength = rangeFactor * (0.55 + 0.45 * centreFactor);
  if (pointInShadow(player.x, player.y)) strength *= DETECTION.shadowFactor;
  if (player.sneaking) strength *= DETECTION.sneakFactor;
  return Math.min(1, strength);
}

/** The points of this guard's vision cone, for the renderer to fill. */
export function guardVisionCone(guard) {
  const points = [{ x: guard.x, y: guard.y }];
  const steps = 16;
  for (let i = 0; i <= steps; i += 1) {
    const angle = guard.angle - GUARD.sightHalfAngle + (2 * GUARD.sightHalfAngle * i) / steps;
    const reach = sightDistance(guard.x, guard.y, angle, GUARD.sightRange);
    points.push({ x: guard.x + Math.cos(angle) * reach, y: guard.y + Math.sin(angle) * reach });
  }
  return points;
}

/** Build the guards from the level's patrol routes. */
export function createGuards() {
  return LEVEL.patrols.map((waypoints, index) => {
    const start = waypoints[0];
    return {
      index,
      x: start.x,
      y: start.y,
      r: GUARD.radius,
      angle: angleTo(start.x, start.y, waypoints[1].x, waypoints[1].y),
      waypoints,
      waypoint: 1,
      wait: 0,
      state: GUARD_PATROL,
      meter: 0,
      lastSeenX: start.x,
      lastSeenY: start.y,
      memory: 0,
      searchTime: 0,
      scanAngle: 0,
      steps: 0,
    };
  });
}

/**
 * One guard, one step. `player` carries x, y, sneaking and noise (0 when
 * silent, otherwise the noise position). With `harmless` set (the title
 * screen's backdrop) the guard patrols but never spots anyone. Returns
 * event flags for the caller: EVENT_SPOTTED when a guard first raises the
 * alarm, EVENT_LOST when an alerted guard gives up and goes back to patrol.
 */
export function updateGuard(guard, dt, player, harmless = false) {
  let events = 0;
  const seen = harmless ? 0 : guardSeesPlayer(guard, player);

  // The detection meter: fills while seen, drains while unseen.
  if (seen > 0) {
    const fill = DETECTION.fillFar + (DETECTION.fillClose - DETECTION.fillFar) * seen;
    guard.meter = Math.min(1, guard.meter + fill * dt);
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.memory = GUARD.huntMemory;
  } else {
    guard.meter = Math.max(0, guard.meter - DETECTION.drain * dt);
  }

  // A loud noise pulls a calm guard over to listen, even unseen.
  if (player.noise > 0 && guard.state === GUARD_PATROL && guard.meter < DETECTION.suspectAt) {
    const d = distance(guard.x, guard.y, player.noiseX, player.noiseY);
    if (d < 260) {
      guard.state = GUARD_SUSPICIOUS;
      guard.lastSeenX = player.noiseX;
      guard.lastSeenY = player.noiseY;
    }
  }

  if (guard.meter >= DETECTION.alarmAt && guard.state !== GUARD_ALERT) {
    guard.state = GUARD_ALERT;
    events |= 1; // EVENT_SPOTTED
  } else if (guard.meter >= DETECTION.suspectAt && guard.state === GUARD_PATROL) {
    guard.state = GUARD_SUSPICIOUS;
  }

  // Movement by mood.
  if (guard.state === GUARD_PATROL) {
    const target = guard.waypoints[guard.waypoint];
    if (guard.wait > 0) {
      guard.wait -= dt;
      // Look around while waiting: a slow scan of the corridor.
      guard.angle += Math.sin(guard.steps * 0.02) * 0.004;
    } else if (moveToward(guard, target.x, target.y, GUARD.patrolSpeed * dt)) {
      guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
      guard.wait = GUARD.waitAtWaypoint;
    }
  } else if (guard.state === GUARD_SUSPICIOUS) {
    if (moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.investigateSpeed * dt)) {
      // Arrived: look around for a while, then give up and go back.
      guard.searchTime += dt;
      guard.angle += dt * 1.1;
      if (guard.searchTime > GUARD.searchTime) {
        guard.state = GUARD_PATROL;
        guard.searchTime = 0;
        guard.meter = 0;
        events |= 2; // EVENT_LOST
      }
    }
  } else if (guard.state === GUARD_ALERT) {
    if (seen > 0) {
      moveToward(guard, player.x, player.y, GUARD.chaseSpeed * dt);
      guard.memory = GUARD.huntMemory;
    } else {
      guard.memory -= dt;
      if (guard.memory <= 0) {
        guard.state = GUARD_SEARCH;
        guard.searchTime = 0;
      } else {
        moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.investigateSpeed * dt);
      }
    }
  } else {
    // SEARCH: sweep the area where the player was last seen, then patrol again.
    guard.searchTime += dt;
    guard.angle += dt * 1.4;
    if (guard.searchTime > GUARD.searchTime) {
      guard.state = GUARD_PATROL;
      guard.searchTime = 0;
      guard.meter = 0;
      events |= 2; // EVENT_LOST
    }
  }

  guard.steps += 1;
  return events;
}

/** Walk toward (tx, ty) by up to `amount`; returns true when arrived. */
function moveToward(guard, tx, ty, amount) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const step = Math.min(amount, d);
  const before = { x: guard.x, y: guard.y };
  moveCircle(guard, (dx / d) * step, (dy / d) * step);
  guard.angle = angleTo(before.x, before.y, guard.x, guard.y);
  // A wall stopped the walk (barely moved): give up on this target.
  if (Math.hypot(guard.x - before.x, guard.y - before.y) < step * 0.2) return true;
  return d - step < 4;
}
