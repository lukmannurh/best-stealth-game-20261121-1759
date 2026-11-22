// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between six screens:
// title, play, paused, caught, game over and win.
//
// ?seed=N fixes the random pattern. ?shot=start|play|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_CAUGHT, EVENT_EMBER, EVENT_SPOTTED, EVENT_WIN, resetPositions, resetWorld, stepWorld } from './world.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
void seed;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();
let best = readBest();

function readBest() {
  try {
    return Number.parseFloat(window.localStorage.getItem(BEST_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best time then lasts this visit only.
  }
}

function runShot(name) {
  renderer.resize();
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  let stepSounds = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    resetWorld(world);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Steal three embers and reach the exit unseen.');
  }

  function endGame(won) {
    if (won) {
      screen = SCREEN_WIN;
      audio.win();
      if (best === 0 || world.elapsed < best) {
        best = world.elapsed;
        saveBest(best);
      }
      announce(`Clean getaway in ${Math.round(world.elapsed)} seconds.`);
    } else {
      screen = SCREEN_OVER;
      announce('Caught for good. The archive keeps its embers.');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_CAUGHT) {
        resetPositions(world);
        screen = SCREEN_PLAY;
        announce('Back in. Quieter this time.');
      } else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
  }

  function step() {
    const clickTarget = input.takeClickTarget();
    const events = stepWorld(world, STEP, input.direction(), input.isSneaking(), clickTarget);
    if (events & EVENT_EMBER) audio.pickup();
    if (events & EVENT_SPOTTED) {
      audio.alarm();
      announce('A guard raised the alarm!');
    }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      input.clearClickTarget();
      if (world.player.lives <= 0) endGame(false);
      else {
        screen = SCREEN_CAUGHT;
        announce(`Spotted! ${world.player.lives} ${world.player.lives === 1 ? 'life' : 'lives'} left.`);
      }
    }
    if (events & EVENT_WIN) endGame(true);
    // Footsteps: a ripple and a tick every few steps while walking loud.
    if (world.player.moving) {
      stepSounds += 1;
      if (stepSounds % 14 === 0) {
        renderer.addRipple(world.player.x, world.player.y);
        if (!world.player.sneaking) audio.footstep();
      }
    }
    renderer.ageRipples(STEP);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE) {
      // A living backdrop: the guards patrol behind the title panel, but
      // nothing spots the thief waiting at the entrance.
      while (accumulator >= STEP) {
        stepWorld(world, STEP, { x: 0, y: 0 }, true, null, true);
        accumulator -= STEP;
      }
    } else if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting guards hunt unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('resize', () => renderer.resize());
  renderer.resize();
  announce('Shadowline. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
