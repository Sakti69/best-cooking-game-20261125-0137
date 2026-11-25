// Ember & Thyme — screenshot staging. Deterministic scenes for shots.json:
// each stages a frozen world so the render is identical every run.
import { GAME, DISH_BY_ID } from './config.js';
import { newWorld, startShift, spawnOrder } from './world.js';

function freeze(world) {
  world.frozen = true;
}

export function stageShot(name, seed = 1) {
  const world = newWorld(seed);
  world.bestScore = 132;
  if (name === 'start') {
    // Title over a lively kitchen: two orders on the board, one patty grilling.
    startShift(world);
    world.state = 'title';
    spawnOrder(world, 'ember-classic');
    spawnOrder(world, 'sunrise');
    world.orders[0].remaining = 32;
    world.orders[1].remaining = 41;
    world.grill[0] = { slot: 0, id: 'patty', progress: 0.55, state: 'cooking', readyLeft: 0 };
    world.plate = [{ id: 'bun', cooked: false }, { id: 'lettuce', cooked: false }];
    world.money = 24;
    world.time = 32;
    world.timeLeft = GAME.shiftSeconds - 32;
    freeze(world);
    return world;
  }
  if (name === 'play') {
    // Mid-assembly: orders ticking, patty mid-grill, plate half built.
    startShift(world);
    spawnOrder(world, 'ember-classic');
    spawnOrder(world, 'melt');
    world.orders[0].remaining = 28;
    world.orders[1].remaining = 19;
    world.grill[0] = { slot: 0, id: 'patty', progress: 0.55, state: 'cooking', readyLeft: 0 };
    world.grill[1] = { slot: 1, id: 'bacon', progress: 0.8, state: 'cooking', readyLeft: 0 };
    world.plate = [
      { id: 'bun', cooked: false },
      { id: 'lettuce', cooked: false },
      { id: 'tomato', cooked: false },
    ];
    world.money = 41;
    world.served = 3;
    world.combo = 2;
    world.bestCombo = 2;
    world.time = 58;
    world.timeLeft = GAME.shiftSeconds - 58;
    world.message = 'Patty on the grill — plate is half built!';
    world.messageAt = 58;
    freeze(world);
    return world;
  }
  if (name === 'serve') {
    // Plate complete and matching a ticket: SERVE glows, ticket says READY.
    startShift(world);
    spawnOrder(world, 'melt');
    spawnOrder(world, 'garden');
    world.orders[0].remaining = 24;
    world.orders[1].remaining = 38;
    world.grill[0] = { slot: 0, id: 'egg', progress: 1, state: 'ready', readyLeft: 4 };
    world.plate = [
      { id: 'bun', cooked: false },
      { id: 'patty', cooked: true },
      { id: 'cheese', cooked: false },
      { id: 'onion', cooked: false },
    ];
    world.money = 63;
    world.served = 4;
    world.combo = 3;
    world.bestCombo = 3;
    world.time = 74;
    world.timeLeft = GAME.shiftSeconds - 74;
    world.message = 'Thyme Melt is ready — serve it now!';
    world.messageAt = 74;
    freeze(world);
    return world;
  }
  if (name === 'end') {
    // Shift over: final tally with a new best.
    startShift(world);
    world.money = 148;
    world.served = 9;
    world.missed = 1;
    world.combo = 4;
    world.bestCombo = 4;
    world.time = GAME.shiftSeconds;
    world.timeLeft = 0;
    world.state = 'over';
    world.over = { money: 148, served: 9, missed: 1, bestCombo: 4, newBest: true };
    freeze(world);
    return world;
  }
  // Fallback: plain title.
  freeze(world);
  return world;
}
