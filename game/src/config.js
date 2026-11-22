// SHADOWLINE — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 165,
  sneakSpeed: 95,
  /** Noise radius while walking; sneaking is silent. */
  noiseRadius: 130,
  lives: 3,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 68,
  investigateSpeed: 105,
  chaseSpeed: 148,
  /** How far a guard can see, in pixels. */
  sightRange: 235,
  /** Half of the vision cone's angle, in radians. */
  sightHalfAngle: 0.61,
  /** Seconds a guard waits at each patrol waypoint. */
  waitAtWaypoint: 1.6,
  /** Seconds an alerted guard keeps hunting after losing sight. */
  huntMemory: 4.5,
  /** Seconds a guard searches the last seen spot before giving up. */
  searchTime: 3.0,
};

/** Detection: how fast the meter fills (per second) and drains. */
export const DETECTION = {
  /** Base fill rate when the player is dead-centre of a cone at close range. */
  fillClose: 1.5,
  /** Fill rate at the far edge of a cone. */
  fillFar: 0.55,
  /** Multiplier while the player stands in a shadow zone. */
  shadowFactor: 0.45,
  /** Multiplier while the player sneaks. */
  sneakFactor: 0.6,
  /** How fast the meter drains when unseen. */
  drain: 0.55,
  /** Meter level that makes a guard suspicious and walk over to look. */
  suspectAt: 0.35,
  /** Meter level that triggers a full alarm and a chase. */
  alarmAt: 1.0,
};

export const EMBERS = 3;

export const PALETTE = {
  backdrop: '#0a0c12',
  floor: '#1a1e28',
  floorTile: '#20242f',
  floorEdge: '#2c3242',
  wall: '#3a4157',
  wallTop: '#565f7d',
  wallShadow: '#232838',
  crate: '#6b4a2b',
  crateTop: '#8a6136',
  crateEdge: '#4a3018',
  shadowZone: '#0d1526',
  lampGlow: '#ffd9a0',
  player: '#e8e4d8',
  playerCloak: '#3f6fb5',
  playerHood: '#e8e4d8',
  guard: '#d84a4a',
  guardHelmet: '#8f2f2f',
  guardConeCalm: 'rgba(120, 220, 130, 0.20)',
  guardConeCalmEdge: 'rgba(120, 220, 130, 0.45)',
  guardConeSuspect: 'rgba(240, 200, 60, 0.26)',
  guardConeSuspectEdge: 'rgba(240, 200, 60, 0.55)',
  guardConeAlarm: 'rgba(240, 60, 50, 0.30)',
  guardConeAlarmEdge: 'rgba(240, 60, 50, 0.65)',
  ember: '#ffb347',
  emberCore: '#fff3c4',
  exitLocked: '#c94f4f',
  exitOpen: '#58d68d',
  exitDoor: '#1e5c38',
  text: '#eef1f5',
  muted: '#9aa3b5',
  gold: '#f2c94c',
  panel: 'rgba(16, 20, 30, 0.92)',
  panelEdge: '#3a4157',
  danger: '#e5534b',
  safe: '#58d68d',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best time is kept between visits (this browser only). */
export const BEST_KEY = 'shadowline.best';

/**
 * The level: walls, crates (cover that blocks sight), shadow zones (dark
 * patches where guards spot you slower), lamps (pools of light), embers,
 * the exit and the player's entrance. Coordinates are in the 1280x720 field.
 * Walls are {x, y, w, h} rectangles; crates the same; shadows are circles.
 */
export const LEVEL = {
  // Border walls (thickness 24).
  walls: [
    { x: 0, y: 0, w: 1280, h: 24 },
    { x: 0, y: 696, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 720 },
    { x: 1256, y: 0, w: 24, h: 720 },
    // Interior walls: rooms and corridors with gaps to slip through.
    { x: 320, y: 120, w: 24, h: 300 },
    { x: 640, y: 300, w: 24, h: 300 },
    { x: 936, y: 120, w: 24, h: 300 },
    { x: 480, y: 240, w: 320, h: 24 },
    { x: 80, y: 480, w: 320, h: 24 },
    { x: 880, y: 480, w: 320, h: 24 },
    { x: 560, y: 120, w: 24, h: 120 },
    { x: 1120, y: 560, w: 24, h: 136 },
  ],
  // Crates: solid cover you can hide behind; they block a guard's sight.
  crates: [
    { x: 120, y: 120, w: 64, h: 64 },
    { x: 220, y: 300, w: 56, h: 56 },
    { x: 420, y: 560, w: 64, h: 64 },
    { x: 700, y: 140, w: 56, h: 56 },
    { x: 760, y: 380, w: 64, h: 64 },
    { x: 1020, y: 300, w: 56, h: 56 },
    { x: 1060, y: 560, w: 64, h: 64 },
    { x: 520, y: 420, w: 56, h: 56 },
  ],
  // Shadow zones: standing inside one makes guards spot you much slower.
  shadows: [
    { x: 180, y: 240, r: 78 },
    { x: 460, y: 340, r: 70 },
    { x: 820, y: 200, r: 72 },
    { x: 1120, y: 420, r: 76 },
    { x: 620, y: 620, r: 70 },
  ],
  // Lamps: warm pools of light; the floor under them is bright (no hiding).
  lamps: [
    { x: 200, y: 420, r: 110 },
    { x: 480, y: 140, r: 110 },
    { x: 840, y: 420, r: 110 },
    { x: 1160, y: 180, r: 100 },
  ],
  // The three embers to steal.
  embers: [
    { x: 150, y: 90, taken: false },
    { x: 1130, y: 90, taken: false },
    { x: 90, y: 620, taken: false },
  ],
  // The exit door, bottom-right. It opens once all embers are taken.
  exit: { x: 1180, y: 640, w: 52, h: 56 },
  // Where the player slips in: the south-west door, out of every patrol's
  // cone, so the first seconds are yours to plan — not a chase.
  entrance: { x: 200, y: 660 },
  // Guard patrols: each guard walks its waypoints in a loop, pausing at each.
  // Every straight leg is checked against the walls and crates above.
  patrols: [
    // Top corridor guard, sweeping left-right along the north hall.
    [{ x: 380, y: 80 }, { x: 900, y: 80 }],
    // West wing guard, walking the left hall up and down.
    [{ x: 60, y: 300 }, { x: 60, y: 620 }],
    // Centre guard, circling the middle block clockwise.
    [{ x: 600, y: 280 }, { x: 860, y: 280 }, { x: 860, y: 620 }, { x: 600, y: 620 }],
    // East wing guard, circling the hall that leads to the exit.
    [{ x: 1100, y: 220 }, { x: 1210, y: 220 }, { x: 1210, y: 440 }, { x: 1100, y: 440 }],
  ],
};
