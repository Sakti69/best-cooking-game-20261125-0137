// Ember & Thyme — configuration: menu, ingredients, tuning.
// All art, names and sounds are original to this game.
export const GAME = {
  title: 'Ember & Thyme',
  subtitle: 'a timed bistro cooking game',
  width: 1280,
  height: 800,
  shiftSeconds: 150,
  maxOrders: 3,
  orderPatience: 45,
  spawnFirstAt: 2,
  spawnIntervalStart: 14,
  spawnIntervalEnd: 9,
  spawnRampAt: 60,
  missPenalty: 5,
  readyWindow: 5,
  comboStep: 0.25,
  comboCap: 2,
  bestKey: 'ember-thyme-best',
};

// Ingredients. cook: null = goes straight to the plate; 'grill' = must be
// cooked on the grill first. cookSeconds is the grill time.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', cook: null, color: '#e8a54b', dark: '#b97a28' },
  { id: 'patty', name: 'Patty', key: '2', cook: 'grill', cookSeconds: 6, color: '#7a4a26', dark: '#54301a' },
  { id: 'cheese', name: 'Cheese', key: '3', cook: null, color: '#f7c948', dark: '#d9a41f' },
  { id: 'lettuce', name: 'Lettuce', key: '4', cook: null, color: '#7bc950', dark: '#4e9b2e' },
  { id: 'tomato', name: 'Tomato', key: '5', cook: null, color: '#e4572e', dark: '#b23a1a' },
  { id: 'onion', name: 'Onion', key: '6', cook: null, color: '#b388eb', dark: '#7e57c2' },
  { id: 'egg', name: 'Egg', key: '7', cook: 'grill', cookSeconds: 5, color: '#fff3d6', dark: '#f0c93f' },
  { id: 'bacon', name: 'Bacon', key: '8', cook: 'grill', cookSeconds: 7, color: '#c0392b', dark: '#7e241a' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// The menu: six original dishes, each a multiset of ingredients.
export const DISHES = [
  {
    id: 'ember-classic',
    name: 'Ember Classic',
    price: 14,
    recipe: { bun: 1, patty: 1, lettuce: 1, tomato: 1 },
    blurb: 'The house original',
  },
  {
    id: 'melt',
    name: 'Thyme Melt',
    price: 15,
    recipe: { bun: 1, patty: 1, cheese: 1, onion: 1 },
    blurb: 'Sharp cheese, sweet onion',
  },
  {
    id: 'sunrise',
    name: 'Sunrise Stack',
    price: 16,
    recipe: { bun: 1, egg: 1, bacon: 1, cheese: 1 },
    blurb: 'Breakfast, all day',
  },
  {
    id: 'garden',
    name: 'Garden Stack',
    price: 13,
    recipe: { bun: 1, lettuce: 1, tomato: 1, onion: 1, cheese: 1 },
    blurb: 'No grill, all green',
  },
  {
    id: 'double-ember',
    name: 'Double Ember',
    price: 19,
    recipe: { bun: 1, patty: 2, cheese: 1 },
    blurb: 'Two patties, one nap',
  },
  {
    id: 'full-works',
    name: 'Full Works',
    price: 22,
    recipe: { bun: 1, patty: 1, egg: 1, bacon: 1, lettuce: 1, tomato: 1 },
    blurb: 'Everything on it',
  },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// Layout (1280x800 canvas).
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 76, w: 1232, h: 128 },
  grill: { x: 24, y: 224, w: 400, h: 220 },
  plate: { x: 448, y: 224, w: 384, h: 220 },
  side: { x: 856, y: 224, w: 400, h: 220 },
  counter: { x: 24, y: 464, w: 1232, h: 200 },
  footer: { x: 24, y: 684, w: 1232, h: 92 },
};
