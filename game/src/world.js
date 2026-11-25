// Ember & Thyme — world: orders, grill, plate, scoring. No DOM, no canvas;
// importable from Node for headless sims. All time in seconds.
import { GAME, INGREDIENTS, ING_BY_ID, DISHES, DISH_BY_ID } from './config.js';
import { mulberry32, pick } from './random.js';

export function countOf(list, id) {
  let n = 0;
  for (const it of list) if (it.id === id) n++;
  return n;
}

// Multiset equality between the plate and a recipe.
export function plateMatchesRecipe(plate, recipe) {
  const ids = new Set([...plate.map((p) => p.id), ...Object.keys(recipe)]);
  for (const id of ids) {
    if (countOf(plate, id) !== (recipe[id] ?? 0)) return false;
  }
  return true;
}

export function dishMatchingPlate(plate) {
  for (const d of DISHES) {
    if (plateMatchesRecipe(plate, d.recipe)) return d;
  }
  return null;
}

export function newWorld(seed = 1) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    state: 'title', // title | playing | paused | over
    time: 0, // shift clock, seconds since play started
    timeLeft: GAME.shiftSeconds,
    money: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    orders: [], // {uid, dishId, patience, remaining, born}
    nextOrderUid: 1,
    nextSpawnAt: GAME.spawnFirstAt,
    grill: [
      { slot: 0, id: null, progress: 0, state: 'empty', readyLeft: 0 },
      { slot: 1, id: null, progress: 0, state: 'empty', readyLeft: 0 },
    ],
    plate: [], // {id, cooked}
    message: '',
    messageAt: -99,
    shakeOrder: null,
    shakeAt: -99,
    serveFlashAt: -99,
    over: null, // {money, served, missed, bestCombo, newBest}
    frozen: false, // shots freeze the clock
    muted: false,
    events: [], // {type, at, ...} — sound hooks + sim log
  };
}

export function startShift(world) {
  world.state = 'playing';
  world.time = 0;
  world.timeLeft = GAME.shiftSeconds;
  world.money = 0;
  world.served = 0;
  world.missed = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.orders = [];
  world.nextOrderUid = 1;
  world.nextSpawnAt = GAME.spawnFirstAt;
  world.grill = world.grill.map((g) => ({ ...g, id: null, progress: 0, state: 'empty', readyLeft: 0 }));
  world.plate = [];
  world.over = null;
  world.message = 'Shift started — first order coming in!';
  world.messageAt = 0;
}

export function spawnIntervalAt(elapsed) {
  const t = Math.min(1, Math.max(0, (elapsed - GAME.spawnRampAt) / 60));
  return GAME.spawnIntervalStart + (GAME.spawnIntervalEnd - GAME.spawnIntervalStart) * t;
}

export function spawnOrder(world, dishId = null) {
  if (world.orders.length >= GAME.maxOrders) return null;
  const dish = dishId ? DISH_BY_ID[dishId] : pick(world.rng, DISHES);
  const order = {
    uid: world.nextOrderUid++,
    dishId: dish.id,
    patience: GAME.orderPatience,
    remaining: GAME.orderPatience,
    born: world.time,
  };
  world.orders.push(order);
  world.events.push({ type: 'order', at: world.time, dish: dish.id });
  return order;
}

function expireOrder(world, order) {
  world.orders = world.orders.filter((o) => o.uid !== order.uid);
  world.missed++;
  world.combo = 0;
  world.money = Math.max(0, world.money - GAME.missPenalty);
  world.message = `Order #${order.uid} walked out — -$${GAME.missPenalty}`;
  world.messageAt = world.time;
  world.events.push({ type: 'miss', at: world.time, dish: order.dishId });
}

export function update(world, dt) {
  if (world.state !== 'playing' || world.frozen) return;
  world.time += dt;
  world.timeLeft = Math.max(0, GAME.shiftSeconds - world.time);

  // Spawn orders.
  if (world.time >= world.nextSpawnAt && world.orders.length < GAME.maxOrders) {
    spawnOrder(world);
    world.nextSpawnAt = world.time + spawnIntervalAt(world.time);
  } else if (world.time >= world.nextSpawnAt) {
    world.nextSpawnAt = world.time + 2;
  }

  // Order patience drains; expired orders walk out.
  for (const o of [...world.orders]) {
    o.remaining -= dt;
    if (o.remaining <= 0) expireOrder(world, o);
  }

  // Grill cooks; ready items burn if left too long.
  for (const slot of world.grill) {
    if (slot.state === 'cooking') {
      const ing = ING_BY_ID[slot.id];
      slot.progress += dt / ing.cookSeconds;
      if (slot.progress >= 1) {
        slot.progress = 1;
        slot.state = 'ready';
        slot.readyLeft = GAME.readyWindow;
        world.events.push({ type: 'ready', at: world.time, id: slot.id });
      }
    } else if (slot.state === 'ready') {
      slot.readyLeft -= dt;
      if (slot.readyLeft <= 0) {
        slot.state = 'burnt';
        world.events.push({ type: 'burnt', at: world.time, id: slot.id });
      }
    }
  }

  if (world.timeLeft <= 0) endShift(world);
}

export function endShift(world) {
  world.state = 'over';
  world.timeLeft = 0;
  world.over = {
    money: world.money,
    served: world.served,
    missed: world.missed,
    bestCombo: world.bestCombo,
    newBest: false,
  };
  world.events.push({ type: 'over', at: world.time, money: world.money });
}

// --- Player actions. Each returns {ok, reason} for the UI. ---

export function addIngredient(world, id) {
  if (world.state !== 'playing') return { ok: false, reason: 'not-playing' };
  const ing = ING_BY_ID[id];
  if (!ing) return { ok: false, reason: 'unknown' };
  if (ing.cook === 'grill') {
    const slot = world.grill.find((g) => g.state === 'empty');
    if (!slot) {
      world.message = 'Grill is full — collect something first!';
      world.messageAt = world.time;
      return { ok: false, reason: 'grill-full' };
    }
    slot.id = id;
    slot.progress = 0;
    slot.state = 'cooking';
    slot.readyLeft = 0;
    world.events.push({ type: 'grill', at: world.time, id });
    return { ok: true, reason: 'grilling' };
  }
  world.plate.push({ id, cooked: false });
  world.events.push({ type: 'add', at: world.time, id });
  return { ok: true, reason: 'plated' };
}

export function grillClick(world, slotIndex) {
  if (world.state !== 'playing') return { ok: false, reason: 'not-playing' };
  const slot = world.grill[slotIndex];
  if (!slot || slot.state === 'empty' || slot.state === 'cooking') {
    return { ok: false, reason: 'not-ready' };
  }
  if (slot.state === 'burnt') {
    world.message = `Burnt ${ING_BY_ID[slot.id].name} tossed.`;
    world.messageAt = world.time;
    world.events.push({ type: 'trash-burnt', at: world.time, id: slot.id });
    slot.id = null;
    slot.progress = 0;
    slot.state = 'empty';
    return { ok: true, reason: 'trashed-burnt' };
  }
  // ready -> onto the plate
  world.plate.push({ id: slot.id, cooked: true });
  world.events.push({ type: 'add', at: world.time, id: slot.id, cooked: true });
  slot.id = null;
  slot.progress = 0;
  slot.state = 'empty';
  return { ok: true, reason: 'plated' };
}

export function trashPlate(world) {
  if (world.state !== 'playing') return { ok: false, reason: 'not-playing' };
  if (world.plate.length === 0) return { ok: false, reason: 'empty' };
  world.plate = [];
  world.message = 'Plate cleared.';
  world.messageAt = world.time;
  world.events.push({ type: 'trash', at: world.time });
  return { ok: true, reason: 'trashed' };
}

export function serveOrder(world, uid) {
  if (world.state !== 'playing') return { ok: false, reason: 'not-playing' };
  const order = world.orders.find((o) => o.uid === uid);
  if (!order) return { ok: false, reason: 'no-order' };
  const dish = DISH_BY_ID[order.dishId];
  if (!plateMatchesRecipe(world.plate, dish.recipe)) {
    world.shakeOrder = uid;
    world.shakeAt = world.time;
    world.message = `That plate is not a ${dish.name} — check the ticket!`;
    world.messageAt = world.time;
    world.events.push({ type: 'wrong', at: world.time, dish: dish.id });
    return { ok: false, reason: 'mismatch' };
  }
  const tip = Math.round(dish.price * 0.5 * Math.max(0, order.remaining / order.patience));
  const mult = Math.min(GAME.comboCap, 1 + GAME.comboStep * world.combo);
  const earned = Math.round((dish.price + tip) * mult);
  world.money += earned;
  world.served++;
  world.combo++;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders = world.orders.filter((o) => o.uid !== uid);
  world.plate = [];
  world.serveFlashAt = world.time;
  world.message = `Served ${dish.name}! +$${earned}${world.combo > 1 ? ` (combo x${mult.toFixed(2).replace(/0$/, '')})` : ''}`;
  world.messageAt = world.time;
  world.events.push({ type: 'serve', at: world.time, dish: dish.id, earned });
  return { ok: true, reason: 'served', earned };
}

// Serve the order the plate currently matches (Space / Serve button).
export function serveMatching(world) {
  const dish = dishMatchingPlate(world.plate);
  if (!dish) {
    world.message = 'No ticket matches this plate yet.';
    world.messageAt = world.time;
    return { ok: false, reason: 'no-match' };
  }
  const order = world.orders.find((o) => o.dishId === dish.id);
  if (!order) return { ok: false, reason: 'no-order' };
  return serveOrder(world, order.uid);
}

export function matchingOrderUid(world) {
  const dish = dishMatchingPlate(world.plate);
  if (!dish) return null;
  const order = world.orders.find((o) => o.dishId === dish.id);
  return order ? order.uid : null;
}

export { INGREDIENTS, DISHES, DISH_BY_ID, ING_BY_ID, GAME };
