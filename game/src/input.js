// Input: keyboard (WASD or arrows to move, Shift to sneak, P to pause,
// Space or Enter to confirm) and mouse (click the floor to walk there,
// click a panel button to confirm). The canvas reports positions in field
// coordinates, so the game never cares about the window's size.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const KEY_DIRS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let clickTarget = null;
  let sneak = false;

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      sneak = true;
    } else if (KEY_DIRS[event.code]) {
      held.add(event.code);
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = false;
    held.delete(event.code);
  });
  window.addEventListener('blur', () => {
    held.clear();
    sneak = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event);
    clickTarget = { x: point.x, y: point.y, done: false };
    actions |= ACTION_CONFIRM;
  });

  /** The current move direction from the held keys, each axis in [-1, 1]. */
  function direction() {
    let x = 0;
    let y = 0;
    for (const code of held) {
      x += KEY_DIRS[code][0];
      y += KEY_DIRS[code][1];
    }
    return { x, y };
  }

  /** Take and clear the actions pressed since the last call. */
  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  /** Take and clear the click target (null when the player arrived or none). */
  function takeClickTarget() {
    if (clickTarget && clickTarget.done) clickTarget = null;
    return clickTarget;
  }

  function clearClickTarget() {
    clickTarget = null;
  }

  return {
    direction,
    takeActions,
    takeClickTarget,
    clearClickTarget,
    isSneaking() {
      return sneak;
    },
  };
}
