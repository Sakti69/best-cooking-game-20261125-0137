// Ember & Thyme — boot + loop. Static files only, no network requests.
import { GAME } from './config.js';
import { newWorld, update, endShift } from './world.js';
import { draw } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';
import { playReady, playMiss, setSizzle, unlockAudio } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const canvas = document.getElementById('game');
canvas.width = GAME.width;
canvas.height = GAME.height;
const ctx = canvas.getContext('2d');

let world;
if (shotName) {
  world = stageShot(shotName, seed);
} else {
  world = newWorld(seed);
  try {
    world.bestScore = Number(window.localStorage.getItem(GAME.bestKey) || '0') || 0;
  } catch {
    world.bestScore = 0;
  }
}

attachInput(canvas, world, {
  onAction() {
    // Best score is saved when a shift ends (see loop below).
  },
});

// Sound hooks: watch the event log the world appends to.
let seenEvents = 0;
let lastCooking = 0;
function drainEvents() {
  const evs = world.events.slice(seenEvents);
  seenEvents = world.events.length;
  for (const ev of evs) {
    if (world.muted) continue;
    if (ev.type === 'ready') playReady();
    else if (ev.type === 'miss') playMiss();
  }
  const cooking = world.grill.filter((g) => g.state === 'cooking').length;
  if (cooking !== lastCooking) {
    lastCooking = cooking;
    if (!world.muted) setSizzle(cooking);
  }
}

let last = performance.now();
let savedBest = false;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (world.state === 'playing') update(world, dt);
  if (world.state === 'over' && world.over && !savedBest) {
    savedBest = true;
    try {
      const prev = Number(window.localStorage.getItem(GAME.bestKey) || '0') || 0;
      if (world.over.money > prev) {
        window.localStorage.setItem(GAME.bestKey, String(world.over.money));
        world.over.newBest = true;
        world.bestScore = world.over.money;
      }
    } catch {
      /* storage unavailable; best is session-only */
    }
  }
  if (world.state !== 'over') savedBest = false;
  drainEvents();
  draw(ctx, world, now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook: the Playwright play-test drives the game through this.
window.__game = { world, canvas };
