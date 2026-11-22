// The level's geometry: walls and crates as solid rectangles, shadow zones as
// circles, and the two questions the game asks about them all the time —
// "can this circle stand here?" and "can this point see that point?"
import { FIELD, LEVEL } from './config.js';

/** All solid rectangles: walls plus crates. */
export const SOLIDS = [...LEVEL.walls, ...LEVEL.crates];

/** True when the circle at (x, y) with radius r overlaps any solid rectangle. */
export function circleHitsSolid(x, y, r) {
  for (const s of SOLIDS) {
    const nearestX = Math.max(s.x, Math.min(x, s.x + s.w));
    const nearestY = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

/**
 * Move a circle by (dx, dy), sliding along walls: try x first, then y, so the
 * circle glides around corners instead of sticking to them.
 */
export function moveCircle(body, dx, dy) {
  const nextX = body.x + dx;
  if (!circleHitsSolid(nextX, body.y, body.r)) body.x = nextX;
  const nextY = body.y + dy;
  if (!circleHitsSolid(body.x, nextY, body.r)) body.y = nextY;
  body.x = Math.max(body.r, Math.min(FIELD.width - body.r, body.x));
  body.y = Math.max(body.r, Math.min(FIELD.height - body.r, body.y));
}

/** True when the point (x, y) lies inside any shadow zone. */
export function pointInShadow(x, y) {
  for (const s of LEVEL.shadows) {
    const dx = x - s.x;
    const dy = y - s.y;
    if (dx * dx + dy * dy < s.r * s.r) return true;
  }
  return false;
}

/** True when the point (x, y) lies inside any lamp's pool of light. */
export function pointInLampLight(x, y) {
  for (const lamp of LEVEL.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.r * lamp.r) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Quick reject: both ends on the same outside side.
  if (Math.max(x1, x2) < rect.x || Math.min(x1, x2) > rect.x + rect.w) return false;
  if (Math.max(y1, y2) < rect.y || Math.min(y1, y2) > rect.y + rect.h) return false;
  // Either end inside the rectangle blocks sight.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  // Test the four edges with a parametric segment-segment intersection.
  const dx = x2 - x1;
  const dy = y2 - y1;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const ex = ex2 - ex1;
    const ey = ey2 - ey1;
    const denom = dx * ey - dy * ex;
    if (denom === 0) continue;
    const t = ((ex1 - x1) * ey - (ey1 - y1) * ex) / denom;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / denom;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when nothing solid stands between (x1, y1) and (x2, y2). */
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const s of SOLIDS) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

/**
 * How far a guard at (x, y) looking along `angle` can see before a wall
 * stops the gaze. Marches in small steps; cheap enough for a few dozen rays.
 */
export function sightDistance(x, y, angle, maxRange) {
  const step = 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  for (let d = step; d <= maxRange; d += step) {
    const px = x + cos * d;
    const py = y + sin * d;
    if (px < 0 || py < 0 || px > FIELD.width || py > FIELD.height) return d;
    for (const s of SOLIDS) {
      if (px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) return d;
    }
  }
  return maxRange;
}
