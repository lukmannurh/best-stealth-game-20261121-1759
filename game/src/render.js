// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the
// margin filled with the backdrop colour. The night is drawn as a darkness
// sheet with holes punched where the lamps, the player, the embers and the
// exit shine — and the guards' vision cones are painted over the dark, so
// the danger is always readable at a glance.
import { FIELD, FONT, LEVEL, PALETTE } from './config.js';
import { guardVisionCone, GUARD_ALERT, GUARD_PATROL, GUARD_SUSPICIOUS } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 640, top: 150, line: 32, bottom: 76 };

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const ripples = [];
  // The night lives on its own canvas: darkness is painted there, holes are
  // punched through it, and the sheet is laid over the level in one draw.
  const night = document.createElement('canvas');
  night.width = FIELD.width;
  night.height = FIELD.height;
  const nightContext = night.getContext('2d');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawFloor() {
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Subtle floor tiles so the space reads as a place, not a void.
    context.fillStyle = PALETTE.floorTile;
    for (let x = 24; x < FIELD.width; x += 80) {
      for (let y = 24; y < FIELD.height; y += 80) {
        if (((x + y) / 80) % 2 === 0) context.fillRect(x, y, 78, 78);
      }
    }
    context.strokeStyle = PALETTE.floorEdge;
    context.lineWidth = 1;
    for (let x = 24; x < FIELD.width; x += 80) {
      context.beginPath();
      context.moveTo(x, 24);
      context.lineTo(x, FIELD.height - 24);
      context.stroke();
    }
    for (let y = 24; y < FIELD.height; y += 80) {
      context.beginPath();
      context.moveTo(24, y);
      context.lineTo(FIELD.width - 24, y);
      context.stroke();
    }
  }

  function drawShadowZones() {
    for (const s of LEVEL.shadows) {
      context.fillStyle = PALETTE.shadowZone;
      context.beginPath();
      context.ellipse(s.x, s.y, s.r, s.r * 0.72, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = 'rgba(90, 120, 180, 0.25)';
      context.lineWidth = 2;
      context.stroke();
    }
  }

  function drawLampGlow() {
    for (const lamp of LEVEL.lamps) {
      const glow = context.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      glow.addColorStop(0, 'rgba(255, 217, 160, 0.30)');
      glow.addColorStop(1, 'rgba(255, 217, 160, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.lampGlow;
      context.beginPath();
      context.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawExit(open) {
    const exit = LEVEL.exit;
    context.fillStyle = PALETTE.exitDoor;
    context.fillRect(exit.x, exit.y, exit.w, exit.h);
    context.strokeStyle = open ? PALETTE.exitOpen : PALETTE.exitLocked;
    context.lineWidth = 4;
    context.strokeRect(exit.x, exit.y, exit.w, exit.h);
    context.fillStyle = open ? PALETTE.exitOpen : PALETTE.exitLocked;
    context.font = `bold 26px ${FONT}`;
    context.textAlign = 'center';
    context.fillText(open ? 'EXIT' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 9);
    if (open) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
      context.fillStyle = `rgba(88, 214, 141, ${0.12 + pulse * 0.12})`;
      context.fillRect(exit.x - 8, exit.y - 8, exit.w + 16, exit.h + 16);
    }
  }

  function drawEmbers(elapsed) {
    for (const ember of LEVEL.embers) {
      if (ember.taken) continue;
      const pulse = 0.75 + 0.25 * Math.sin(elapsed * 4 + ember.x);
      const glow = context.createRadialGradient(ember.x, ember.y, 2, ember.x, ember.y, 34);
      glow.addColorStop(0, `rgba(255, 179, 71, ${0.5 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(ember.x, ember.y, 34, 0, Math.PI * 2);
      context.fill();
      // A faceted gem: a diamond with a bright core.
      context.fillStyle = PALETTE.ember;
      context.beginPath();
      context.moveTo(ember.x, ember.y - 14);
      context.lineTo(ember.x + 10, ember.y);
      context.lineTo(ember.x, ember.y + 14);
      context.lineTo(ember.x - 10, ember.y);
      context.closePath();
      context.fill();
      context.fillStyle = PALETTE.emberCore;
      context.beginPath();
      context.moveTo(ember.x, ember.y - 7);
      context.lineTo(ember.x + 5, ember.y);
      context.lineTo(ember.x, ember.y + 7);
      context.lineTo(ember.x - 5, ember.y);
      context.closePath();
      context.fill();
    }
  }

  function drawCrates() {
    for (const crate of LEVEL.crates) {
      context.fillStyle = PALETTE.crateEdge;
      context.fillRect(crate.x - 2, crate.y - 2, crate.w + 4, crate.h + 4);
      context.fillStyle = PALETTE.crate;
      context.fillRect(crate.x, crate.y, crate.w, crate.h);
      context.fillStyle = PALETTE.crateTop;
      context.fillRect(crate.x, crate.y, crate.w, 10);
      context.strokeStyle = PALETTE.crateEdge;
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(crate.x, crate.y + crate.h / 2);
      context.lineTo(crate.x + crate.w, crate.y + crate.h / 2);
      context.moveTo(crate.x + crate.w / 2, crate.y);
      context.lineTo(crate.x + crate.w / 2, crate.y + crate.h);
      context.stroke();
    }
  }

  function drawWalls() {
    for (const wall of LEVEL.walls) {
      context.fillStyle = PALETTE.wallShadow;
      context.fillRect(wall.x + 3, wall.y + 4, wall.w, wall.h);
      context.fillStyle = PALETTE.wall;
      context.fillRect(wall.x, wall.y, wall.w, wall.h);
      context.fillStyle = PALETTE.wallTop;
      if (wall.h <= wall.w) context.fillRect(wall.x, wall.y, wall.w, 5);
      else context.fillRect(wall.x, wall.y, 5, wall.h);
    }
  }

  function punchLight(x, y, radius, strength) {
    const glow = nightContext.createRadialGradient(x, y, 4, x, y, radius);
    glow.addColorStop(0, `rgba(255, 255, 255, ${strength})`);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    nightContext.fillStyle = glow;
    nightContext.beginPath();
    nightContext.arc(x, y, radius, 0, Math.PI * 2);
    nightContext.fill();
  }

  function drawDarkness(player) {
    nightContext.clearRect(0, 0, FIELD.width, FIELD.height);
    nightContext.globalCompositeOperation = 'source-over';
    nightContext.fillStyle = 'rgba(4, 6, 12, 0.58)';
    nightContext.fillRect(0, 0, FIELD.width, FIELD.height);
    nightContext.globalCompositeOperation = 'destination-out';
    for (const lamp of LEVEL.lamps) punchLight(lamp.x, lamp.y, lamp.r, 0.85);
    punchLight(player.x, player.y, 150, 0.9);
    for (const ember of LEVEL.embers) {
      if (!ember.taken) punchLight(ember.x, ember.y, 60, 0.7);
    }
    punchLight(LEVEL.exit.x + LEVEL.exit.w / 2, LEVEL.exit.y + LEVEL.exit.h / 2, 80, 0.7);
    nightContext.globalCompositeOperation = 'source-over';
    context.drawImage(night, 0, 0);
  }

  function drawGuardCone(guard) {
    const points = guardVisionCone(guard);
    let fill;
    let edge;
    if (guard.state === GUARD_ALERT) {
      fill = PALETTE.guardConeAlarm;
      edge = PALETTE.guardConeAlarmEdge;
    } else if (guard.state === GUARD_SUSPICIOUS) {
      fill = PALETTE.guardConeSuspect;
      edge = PALETTE.guardConeSuspectEdge;
    } else {
      fill = PALETTE.guardConeCalm;
      edge = PALETTE.guardConeCalmEdge;
    }
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i].x, points[i].y);
    context.closePath();
    context.fill();
    context.strokeStyle = edge;
    context.lineWidth = 1.5;
    context.stroke();
  }

  function drawGuard(guard) {
    // Body: a red circle with a dark helmet and a facing tick.
    context.fillStyle = PALETTE.guard;
    context.beginPath();
    context.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.guardHelmet;
    context.beginPath();
    context.arc(guard.x, guard.y, guard.r * 0.55, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#ffd9d9';
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(guard.x, guard.y);
    context.lineTo(guard.x + Math.cos(guard.angle) * (guard.r + 6), guard.y + Math.sin(guard.angle) * (guard.r + 6));
    context.stroke();
    // The detection meter floats over an alarmed guard.
    if (guard.meter > 0.05) {
      const width = 36;
      context.fillStyle = 'rgba(10, 12, 18, 0.8)';
      context.fillRect(guard.x - width / 2, guard.y - guard.r - 16, width, 6);
      context.fillStyle = guard.meter >= 1 ? PALETTE.danger : PALETTE.gold;
      context.fillRect(guard.x - width / 2, guard.y - guard.r - 16, width * Math.min(1, guard.meter), 6);
    }
    if (guard.state === GUARD_ALERT) {
      context.fillStyle = PALETTE.danger;
      context.font = `bold 20px ${FONT}`;
      context.textAlign = 'center';
      context.fillText('!', guard.x, guard.y - guard.r - 22);
    } else if (guard.state === GUARD_SUSPICIOUS) {
      context.fillStyle = PALETTE.gold;
      context.font = `bold 20px ${FONT}`;
      context.textAlign = 'center';
      context.fillText('?', guard.x, guard.y - guard.r - 22);
    }
  }

  function drawPlayer(player) {
    if (player.invulnerable > 0 && Math.floor(player.invulnerable * 10) % 2 === 0) return;
    // Footstep ripples while walking loud.
    for (const ripple of ripples) {
      context.strokeStyle = `rgba(232, 228, 216, ${0.35 * (1 - ripple.age)})`;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(ripple.x, ripple.y, 6 + ripple.age * 26, 0, Math.PI * 2);
      context.stroke();
    }
    if (player.noise > 0) {
      context.strokeStyle = 'rgba(240, 200, 60, 0.35)';
      context.lineWidth = 2;
      context.setLineDash([6, 8]);
      context.beginPath();
      context.arc(player.x, player.y, player.noise, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
    }
    // Cloak: a blue triangle pointing where the thief faces, hood on top.
    context.fillStyle = PALETTE.playerCloak;
    context.beginPath();
    context.moveTo(player.x + Math.cos(player.angle) * 18, player.y + Math.sin(player.angle) * 18);
    context.lineTo(player.x + Math.cos(player.angle + 2.4) * 13, player.y + Math.sin(player.angle + 2.4) * 13);
    context.lineTo(player.x + Math.cos(player.angle - 2.4) * 13, player.y + Math.sin(player.angle - 2.4) * 13);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.playerHood;
    context.beginPath();
    context.arc(player.x, player.y, player.r * 0.72, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#20242f';
    context.beginPath();
    context.arc(player.x + Math.cos(player.angle) * 4, player.y + Math.sin(player.angle) * 4, 3.5, 0, Math.PI * 2);
    context.fill();
    if (player.sneaking) {
      context.strokeStyle = 'rgba(88, 214, 141, 0.9)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(player.x, player.y, player.r + 5, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function drawHud(world) {
    context.textBaseline = 'top';
    const embers = '◆'.repeat(world.player.embers) + '◇'.repeat(3 - world.player.embers);
    text(`Embers ${embers}`, 28, 18, 26, PALETTE.gold, 'left');
    text(`Lives ${'♥'.repeat(world.player.lives)}${'♡'.repeat(3 - world.player.lives)}`, 28, 50, 26, PALETTE.text, 'left');
    const minutes = Math.floor(world.elapsed / 60);
    const seconds = Math.floor(world.elapsed % 60);
    text(`${minutes}:${String(seconds).padStart(2, '0')}`, FIELD.width / 2, 18, 26, PALETTE.text, 'center');
    let status = 'UNSEEN';
    let statusColor = PALETTE.safe;
    if (world.alertLevel === GUARD_ALERT) {
      status = 'HUNTED!';
      statusColor = PALETTE.danger;
    } else if (world.alertLevel === GUARD_SUSPICIOUS) {
      status = 'SUSPICIOUS';
      statusColor = PALETTE.gold;
    }
    text(status, FIELD.width - 28, 18, 26, statusColor, 'right');
    // The loudest detection meter, as a thin bar under the status.
    const barWidth = 150;
    context.fillStyle = 'rgba(10, 12, 18, 0.8)';
    context.fillRect(FIELD.width - 28 - barWidth, 52, barWidth, 8);
    context.fillStyle = world.maxMeter >= 1 ? PALETTE.danger : PALETTE.gold;
    context.fillRect(FIELD.width - 28 - barWidth, 52, barWidth * Math.min(1, world.maxMeter), 8);
    if (world.player.sneaking) {
      text('SNEAKING — slow and silent', FIELD.width / 2, FIELD.height - 40, 20, PALETTE.safe, 'center');
    } else if (world.player.moving) {
      text('Walking is loud — guards hear footsteps', FIELD.width / 2, FIELD.height - 40, 20, PALETTE.muted, 'center');
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PANEL.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PANEL.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.gold, 'center');
  }

  /** Paint one frame: the level, the night, the cones, the actors, the HUD. */
  function draw(world, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawFloor();
    drawShadowZones();
    drawLampGlow();
    drawExit(world.player.embers >= 3);
    drawEmbers(world.elapsed);
    drawCrates();
    drawWalls();
    drawDarkness(world.player);
    for (const guard of world.guards) drawGuardCone(guard);
    for (const guard of world.guards) drawGuard(guard);
    drawPlayer(world.player);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_CAUGHT) drawHud(world);

    if (screen === SCREEN_TITLE) {
      drawPanel(
        'SHADOWLINE',
        [
          'Steal the three embers from the Ember Archive.',
          'Slip past the guards and reach the exit unseen.',
          'Move: WASD / arrows or click the floor.  Sneak: hold Shift.',
          'Walking is loud. Sneaking is silent. Shadows hide you.',
          best > 0 ? `Best escape: ${formatTime(best)}` : 'No escape yet — the archive waits.',
        ],
        'Press Space or click to begin',
      );
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['The guards wait. The embers wait.'], 'Press P or Space to keep sneaking');
    } else if (screen === SCREEN_CAUGHT) {
      drawPanel(
        'SPOTTED!',
        [`A guard caught you in the light. ${world.player.lives} ${world.player.lives === 1 ? 'life' : 'lives'} left.`, 'Back to the entrance — quieter this time.'],
        'Press Space to slip back in',
      );
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        'CAUGHT FOR GOOD',
        ['The archive keeps its embers tonight.', `Embers stolen: ${world.player.embers} of 3.`],
        'Press Space to try again',
      );
    } else if (screen === SCREEN_WIN) {
      drawPanel(
        'CLEAN GETAWAY',
        [`All three embers, and nobody saw a thing.`, best > 0 ? `Escape time: ${formatTime(world.elapsed)}  •  Best: ${formatTime(best)}` : `Escape time: ${formatTime(world.elapsed)}`],
        'Press Space to steal again',
      );
    }
  }

  function formatTime(total) {
    const minutes = Math.floor(total / 60);
    const seconds = Math.floor(total % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  /** A footstep ripple at the player's feet; the loop adds them while walking. */
  function addRipple(x, y) {
    ripples.push({ x, y, age: 0 });
    if (ripples.length > 12) ripples.shift();
  }

  function ageRipples(dt) {
    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      ripples[i].age += dt * 1.4;
      if (ripples[i].age >= 1) ripples.splice(i, 1);
    }
  }

  return { draw, resize, addRipple, ageRipples };
}
