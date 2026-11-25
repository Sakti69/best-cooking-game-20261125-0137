// Ember & Thyme — canvas renderer. Draws the whole kitchen in 2D; no images,
// no network. Also computes the clickable regions input.js reads.
import { GAME, INGREDIENTS, ING_BY_ID, DISHES, DISH_BY_ID, LAYOUT } from './config.js';
import { matchingOrderUid } from './world.js';

const W = GAME.width;
const H = GAME.height;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, font, color, align = 'left', baseline = 'alphabetic') {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(s, x, y);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// --- Ingredient icons, drawn centered at (x, y) inside a box of size s. ---
export function drawIngredient(ctx, id, x, y, s) {
  const u = s / 64;
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    // Top dome + sesame, bottom half.
    ctx.fillStyle = '#e8a54b';
    ctx.beginPath();
    ctx.ellipse(0, -6 * u, 26 * u, 15 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-12, -14], [0, -18], [12, -14], [-6, -9], [7, -9]]) {
      ctx.beginPath();
      ctx.ellipse(dx * u, dy * u, 2.2 * u, 1.4 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#c98a35';
    rr(ctx, -26 * u, 2 * u, 52 * u, 9 * u, 4 * u);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = '#7a4a26';
    rr(ctx, -27 * u, -11 * u, 54 * u, 22 * u, 9 * u);
    ctx.fill();
    ctx.strokeStyle = '#54301a';
    ctx.lineWidth = 2.5 * u;
    for (const dx of [-14, 0, 14]) {
      ctx.beginPath();
      ctx.moveTo(dx * u, -8 * u);
      ctx.lineTo(dx * u, 8 * u);
      ctx.stroke();
    }
    ctx.fillStyle = '#8d5a30';
    ctx.beginPath();
    ctx.ellipse(-8 * u, -4 * u, 7 * u, 3 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.save();
    ctx.rotate(-0.06);
    rr(ctx, -26 * u, -13 * u, 52 * u, 26 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = '#d9a41f';
    for (const [dx, dy, r] of [[-14, -4, 3], [4, 5, 4], [15, -6, 2.5]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#7bc950';
    for (const [dx, dy, rx] of [[-14, 2, 16], [0, -4, 18], [14, 2, 16]]) {
      ctx.beginPath();
      ctx.ellipse(dx * u, dy * u, rx * u, 11 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5da83a';
    ctx.beginPath();
    ctx.ellipse(0, 3 * u, 24 * u, 6 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.arc(0, 0, 24 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2825f';
    ctx.beginPath();
    ctx.arc(-4 * u, -4 * u, 15 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4e9b2e';
    ctx.beginPath();
    ctx.ellipse(0, -22 * u, 6 * u, 4 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'onion') {
    ctx.strokeStyle = '#b388eb';
    ctx.lineWidth = 5 * u;
    for (const r of [8, 15, 22]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#e9dcfb';
    ctx.beginPath();
    ctx.arc(0, 0, 5 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.ellipse(0, 0, 27 * u, 20 * u, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c93f';
    ctx.beginPath();
    ctx.arc(3 * u, 1 * u, 11 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(0, -2 * u, 5 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'bacon') {
    for (const dy of [-11, 9]) {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(-27 * u, dy * u);
      for (let px = -27; px <= 27; px += 9) {
        ctx.lineTo(px * u, (dy + (px % 18 === 0 ? -4 : 4)) * u);
      }
      ctx.lineTo(27 * u, (dy + 8) * u);
      ctx.lineTo(-27 * u, (dy + 8) * u);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e8a49b';
      ctx.fillRect(-20 * u, (dy + 2) * u, 40 * u, 3 * u);
    }
  }
  ctx.restore();
}

function drawFlame(ctx, x, y, s, t, seed) {
  const f = 0.75 + 0.25 * Math.sin(t * 9 + seed * 2.1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, f);
  const g = ctx.createLinearGradient(0, 0, 0, -s);
  g.addColorStop(0, '#ff9d00');
  g.addColorStop(0.6, '#ff5e00');
  g.addColorStop(1, '#ffd23f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.4, s * 0.32, 0);
  ctx.quadraticCurveTo(0, s * 0.22, -s * 0.32, 0);
  ctx.quadraticCurveTo(-s * 0.55, -s * 0.4, 0, -s);
  ctx.fill();
  ctx.restore();
}

function patienceColor(frac) {
  if (frac > 0.55) return '#4caf50';
  if (frac > 0.28) return '#ff9800';
  return '#e53935';
}

function drawTicket(ctx, world, order, x, y, w, h, t) {
  const dish = DISH_BY_ID[order.dishId];
  const matchUid = matchingOrderUid(world);
  const isMatch = matchUid === order.uid;
  const shaking = world.shakeOrder === order.uid && world.time - world.shakeAt < 0.4;
  const sx = shaking ? Math.sin(world.time * 55) * 5 : 0;
  ctx.save();
  ctx.translate(sx, 0);
  // Paper ticket.
  ctx.fillStyle = isMatch ? '#e8f5e9' : '#fff8e7';
  ctx.strokeStyle = isMatch ? '#43a047' : '#d8c49a';
  ctx.lineWidth = isMatch ? 3 : 1.5;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  // Header: order no + dish name + price.
  text(ctx, `#${order.uid}`, x + 14, y + 26, 'bold 15px system-ui, sans-serif', '#8a6d3b');
  text(ctx, dish.name, x + 52, y + 26, 'bold 20px Georgia, serif', '#3a2a1e');
  text(ctx, `$${dish.price}`, x + w - 14, y + 26, 'bold 20px Georgia, serif', '#2e7d32', 'right');
  text(ctx, dish.blurb, x + 52, y + 46, 'italic 12px Georgia, serif', '#8a6d3b');
  // Ingredient icons (above the patience bar).
  const ids = Object.entries(dish.recipe).flatMap(([id, n]) => Array(n).fill(id));
  let ix = x + 20;
  const iy = y + 62;
  for (const id of ids) {
    drawIngredient(ctx, id, ix + 15, iy, 30);
    ix += 34;
  }
  if (isMatch) {
    rr(ctx, x + w - 92, y + 32, 80, 22, 11);
    ctx.fillStyle = '#43a047';
    ctx.fill();
    text(ctx, 'READY ✓', x + w - 52, y + 48, 'bold 13px system-ui, sans-serif', '#ffffff', 'center');
  }
  // Patience bar.
  const frac = clamp(order.remaining / order.patience, 0, 1);
  rr(ctx, x + 14, y + h - 12, w - 28, 7, 3.5);
  ctx.fillStyle = '#e8ddc8';
  ctx.fill();
  rr(ctx, x + 14, y + h - 12, (w - 28) * frac, 7, 3.5);
  ctx.fillStyle = patienceColor(frac);
  ctx.fill();
  text(ctx, `${Math.ceil(order.remaining)}s`, x + w - 14, y + h - 18, 'bold 13px system-ui, sans-serif', patienceColor(frac), 'right');
  ctx.restore();
}

function drawPlateStack(ctx, world, cx, baseY) {
  const plate = world.plate;
  // Plate.
  ctx.fillStyle = '#f5f0e6';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 150, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e3d9c2';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 118, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  if (plate.length === 0) {
    text(ctx, 'empty plate', cx, baseY - 4, 'italic 14px Georgia, serif', '#a08c68', 'center');
    return;
  }
  const hasBun = plate.some((p) => p.id === 'bun');
  const fillings = plate.filter((p) => p.id !== 'bun');
  let y = baseY - 8;
  if (hasBun) {
    // Bottom bun.
    ctx.fillStyle = '#c98a35';
    rr(ctx, cx - 62, y - 12, 124, 13, 6);
    ctx.fill();
    y -= 12;
  }
  // Fillings stacked upward, newest on top.
  for (const item of fillings) {
    drawIngredient(ctx, item.id, cx, y - 9, 50);
    y -= 17;
  }
  if (hasBun) {
    // Top bun dome.
    ctx.fillStyle = '#e8a54b';
    ctx.beginPath();
    ctx.ellipse(cx, y - 2, 62, 26, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-30, -16], [0, -22], [30, -16], [-14, -10], [16, -10]]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx, y - 2 + dy, 4, 2.6, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function draw(ctx, world, t) {
  const hot = [];
  world._hot = hot;
  const state = world.state;

  // --- Wall: warm tiles + teal backsplash. ---
  ctx.fillStyle = '#f3e2c7';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(180,140,90,0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 64; y <= H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Backsplash band behind the board.
  ctx.fillStyle = '#2e6f6a';
  ctx.fillRect(0, 64, W, 8);

  // --- Top bar. ---
  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(0, 0, W, 64);
  text(ctx, 'EMBER & THYME', 24, 40, 'bold 30px Georgia, serif', '#ffd23f');
  text(ctx, 'bistro kitchen', 322, 42, 'italic 15px Georgia, serif', '#d9a066');
  // Shift timer.
  const tl = world.timeLeft;
  const mm = Math.floor(tl / 60);
  const ss = Math.floor(tl % 60).toString().padStart(2, '0');
  const tfrac = clamp(tl / GAME.shiftSeconds, 0, 1);
  text(ctx, 'SHIFT', 560, 24, 'bold 12px system-ui, sans-serif', '#d9a066', 'center');
  rr(ctx, 470, 30, 180, 16, 8);
  ctx.fillStyle = '#5d4632';
  ctx.fill();
  rr(ctx, 470, 30, 180 * tfrac, 16, 8);
  ctx.fillStyle = tfrac > 0.3 ? '#ffd23f' : '#e53935';
  ctx.fill();
  text(ctx, `${mm}:${ss}`, 560, 58, 'bold 13px system-ui, sans-serif', '#ffffff', 'center');
  // Money + served.
  text(ctx, `$${world.money}`, 760, 40, 'bold 28px Georgia, serif', '#7bc950');
  text(ctx, `served ${world.served}  •  missed ${world.missed}`, 872, 40, '14px system-ui, sans-serif', '#f3e2c7');
  if (world.combo > 1) {
    text(ctx, `COMBO x${Math.min(GAME.comboCap, 1 + GAME.comboStep * (world.combo - 1)).toFixed(2).replace(/0$/, '')}`, 1140, 40, 'bold 16px system-ui, sans-serif', '#ff9d00', 'right');
  }
  // Pause + mute buttons.
  rr(ctx, 1150, 14, 52, 36, 8);
  ctx.fillStyle = '#5d4632';
  ctx.fill();
  text(ctx, state === 'paused' ? '▶' : '❚❚', 1176, 38, 'bold 15px system-ui, sans-serif', '#ffffff', 'center');
  hot.push({ kind: 'pause', x: 1150, y: 14, w: 52, h: 36 });
  rr(ctx, 1210, 14, 52, 36, 8);
  ctx.fillStyle = '#5d4632';
  ctx.fill();
  text(ctx, world.muted ? '✕♪' : '♪', 1236, 38, 'bold 15px system-ui, sans-serif', '#ffffff', 'center');
  hot.push({ kind: 'mute', x: 1210, y: 14, w: 52, h: 36 });

  // --- Order board (chalkboard). ---
  const b = LAYOUT.board;
  ctx.fillStyle = '#2f3b33';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + 16, b.y + 24, 'bold 14px system-ui, sans-serif', '#ffd23f');
  if (world.orders.length === 0 && state === 'playing') {
    text(ctx, 'No orders right now — the next ticket is coming…', b.x + 220, b.y + 74, 'italic 17px Georgia, serif', '#b8c4b2', 'center');
  }
  world.orders.forEach((o, i) => {
    const tx = b.x + 16 + i * 404;
    drawTicket(ctx, world, o, tx, b.y + 30, 388, 88, t);
    hot.push({ kind: 'order', uid: o.uid, x: tx, y: b.y + 30, w: 388, h: 88 });
  });

  // --- Grill. ---
  const g = LAYOUT.grill;
  ctx.fillStyle = '#e8d9bd';
  rr(ctx, g.x, g.y, g.w, g.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'GRILL', g.x + 18, g.y + 28, 'bold 16px system-ui, sans-serif', '#7a4a26');
  text(ctx, 'click a cooked item to plate it', g.x + 90, g.y + 28, 'italic 13px Georgia, serif', '#8a6d3b');
  world.grill.forEach((slot, i) => {
    const sx = g.x + 24 + i * 188;
    const sy = g.y + 44;
    const sw = 164;
    const sh = 150;
    // Grate.
    ctx.fillStyle = '#3f3f46';
    rr(ctx, sx, sy, sw, sh, 10);
    ctx.fill();
    ctx.strokeStyle = '#232328';
    ctx.lineWidth = 3;
    for (let gy = sy + 24; gy < sy + sh - 8; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(sx + 8, gy);
      ctx.lineTo(sx + sw - 8, gy);
      ctx.stroke();
    }
    hot.push({ kind: 'grill', slot: i, x: sx, y: sy, w: sw, h: sh });
    if (slot.state === 'empty') {
      text(ctx, 'empty', sx + sw / 2, sy + sh / 2 + 5, 'italic 14px Georgia, serif', '#8a8a92', 'center');
    } else {
      const ing = ING_BY_ID[slot.id];
      if (slot.state === 'cooking') {
        drawFlame(ctx, sx + 30, sy + sh - 6, 16, t, i);
        drawFlame(ctx, sx + sw - 30, sy + sh - 6, 13, t, i + 3);
        drawIngredient(ctx, slot.id, sx + sw / 2, sy + 62, 62);
        // Progress ring.
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(sx + sw / 2, sy + 62, 44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#ffd23f';
        ctx.beginPath();
        ctx.arc(sx + sw / 2, sy + 62, 44, -Math.PI / 2, -Math.PI / 2 + slot.progress * Math.PI * 2);
        ctx.stroke();
        text(ctx, `${Math.ceil((1 - slot.progress) * ing.cookSeconds)}s`, sx + sw / 2, sy + 128, 'bold 14px system-ui, sans-serif', '#ffffff', 'center');
      } else if (slot.state === 'ready') {
        const pulse = 0.7 + 0.3 * Math.sin(t * 6);
        ctx.save();
        ctx.globalAlpha = pulse;
        rr(ctx, sx, sy, sw, sh, 10);
        ctx.strokeStyle = '#43a047';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
        drawIngredient(ctx, slot.id, sx + sw / 2, sy + 58, 62);
        rr(ctx, sx + 22, sy + 108, sw - 44, 26, 13);
        ctx.fillStyle = '#43a047';
        ctx.fill();
        text(ctx, 'READY ✓', sx + sw / 2, sy + 126, 'bold 13px system-ui, sans-serif', '#ffffff', 'center');
      } else {
        // Burnt.
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(sx + sw / 2, sy + 58, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        text(ctx, 'BURNT!', sx + sw / 2, sy + 112, 'bold 16px system-ui, sans-serif', '#ff6b5e', 'center');
        text(ctx, 'click to toss', sx + sw / 2, sy + 132, '13px system-ui, sans-serif', '#d7d7d7', 'center');
      }
    }
  });

  // --- Plate (assembly). ---
  const p = LAYOUT.plate;
  ctx.fillStyle = '#e8d9bd';
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'YOUR PLATE', p.x + 18, p.y + 28, 'bold 16px system-ui, sans-serif', '#7a4a26');
  const matchDish = world.plate.length ? DISHES.find((d) => {
    const ids = new Set([...world.plate.map((x) => x.id), ...Object.keys(d.recipe)]);
    return [...ids].every((id) => world.plate.filter((x) => x.id === id).length === (d.recipe[id] ?? 0));
  }) : null;
  if (matchDish) {
    text(ctx, `= ${matchDish.name}`, p.x + 140, p.y + 28, 'bold 15px Georgia, serif', '#2e7d32');
  }
  drawPlateStack(ctx, world, p.x + p.w / 2, p.y + 178);
  // Serve flash.
  if (world.time - world.serveFlashAt < 0.5) {
    ctx.save();
    ctx.globalAlpha = 1 - (world.time - world.serveFlashAt) * 2;
    rr(ctx, p.x, p.y, p.w, p.h, 12);
    ctx.strokeStyle = '#43a047';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  // --- Side panel: serve / trash / menu. ---
  const s = LAYOUT.side;
  ctx.fillStyle = '#e8d9bd';
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  const canServe = matchingOrderUid(world) !== null;
  rr(ctx, s.x + 20, s.y + 18, s.w - 40, 56, 10);
  ctx.fillStyle = canServe ? '#2e7d32' : '#9a8f7a';
  ctx.fill();
  text(ctx, canServe ? 'SERVE — READY!  (Space)' : 'SERVE  (Space)', s.x + s.w / 2, s.y + 53, 'bold 19px system-ui, sans-serif', '#ffffff', 'center');
  hot.push({ kind: 'serve', x: s.x + 20, y: s.y + 18, w: s.w - 40, h: 56 });
  rr(ctx, s.x + 20, s.y + 86, 150, 38, 8);
  ctx.fillStyle = '#8d6e63';
  ctx.fill();
  text(ctx, '🗑 Trash plate (T)', s.x + 95, s.y + 111, 'bold 14px system-ui, sans-serif', '#ffffff', 'center');
  hot.push({ kind: 'trash', x: s.x + 20, y: s.y + 86, w: 150, h: 38 });
  text(ctx, `MENU  •  ${DISHES.length} dishes`, s.x + 20, s.y + 146, 'bold 13px system-ui, sans-serif', '#7a4a26');
  // Two-column menu, 3 rows.
  DISHES.forEach((d, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const mx = s.x + 20 + col * 190;
    const my = s.y + 168 + row * 18;
    text(ctx, `${d.name} — $${d.price}`, mx, my, '13px system-ui, sans-serif', '#3a2a1e');
  });

  // --- Counter: ingredient bins. ---
  const c = LAYOUT.counter;
  ctx.fillStyle = '#d9a066';
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#b97a28';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'INGREDIENTS — click to add  •  grill items go to the grill first', c.x + 18, c.y + 26, 'bold 15px system-ui, sans-serif', '#5d3a17');
  const binW = 140;
  const gap = 16;
  INGREDIENTS.forEach((ing, i) => {
    const bx = c.x + 16 + i * (binW + gap);
    const by = c.y + 40;
    const bh = 144;
    ctx.fillStyle = '#f7ead0';
    rr(ctx, bx, by, binW, bh, 10);
    ctx.fill();
    ctx.strokeStyle = '#c9b896';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawIngredient(ctx, ing.id, bx + binW / 2, by + 52, 58);
    text(ctx, ing.name, bx + binW / 2, by + 104, 'bold 15px system-ui, sans-serif', '#3a2a1e', 'center');
    // Key badge.
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath();
    ctx.arc(bx + 20, by + 20, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ing.key, bx + 20, by + 25, 'bold 13px system-ui, sans-serif', '#ffd23f', 'center');
    if (ing.cook === 'grill') {
      rr(ctx, bx + binW - 52, by + 10, 42, 20, 10);
      ctx.fillStyle = '#ff5e00';
      ctx.fill();
      text(ctx, 'GRILL', bx + binW - 31, by + 24, 'bold 10px system-ui, sans-serif', '#ffffff', 'center');
    }
    hot.push({ kind: 'ingredient', id: ing.id, x: bx, y: by, w: binW, h: bh });
  });

  // --- Footer: message + keys. ---
  const f = LAYOUT.footer;
  const msgAge = world.time - world.messageAt;
  if (world.message && msgAge < 6) {
    text(ctx, world.message, W / 2, f.y + 30, 'bold 18px Georgia, serif', '#3a2a1e', 'center');
  } else {
    text(ctx, 'Build the dish on the ticket, grill what needs grilling, serve before the patience bar runs out.', W / 2, f.y + 30, 'italic 16px Georgia, serif', '#8a6d3b', 'center');
  }
  text(ctx, 'Keys:  1–8 ingredients  •  Space serve  •  T trash plate  •  P pause  •  M sound', W / 2, f.y + 62, '14px system-ui, sans-serif', '#8a6d3b', 'center');

  // --- Overlays. ---
  if (state === 'title') drawTitle(ctx, world);
  else if (state === 'paused') drawPaused(ctx, world);
  else if (state === 'over') drawOver(ctx, world);
}

function overlayDim(ctx) {
  ctx.fillStyle = 'rgba(30,20,12,0.55)';
  ctx.fillRect(0, 0, W, H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = '#fff8e7';
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTitle(ctx, world) {
  overlayDim(ctx);
  panel(ctx, 290, 120, 700, 540);
  text(ctx, 'EMBER & THYME', 640, 200, 'bold 52px Georgia, serif', '#7a4a26', 'center');
  text(ctx, 'a timed bistro cooking game', 640, 236, 'italic 20px Georgia, serif', '#8a6d3b', 'center');
  // Menu preview.
  text(ctx, 'TONIGHT’S MENU', 640, 292, 'bold 14px system-ui, sans-serif', '#b97a28', 'center');
  DISHES.forEach((d, i) => {
    const y = 320 + i * 26;
    text(ctx, d.name, 400, y, '16px Georgia, serif', '#3a2a1e');
    text(ctx, `$${d.price}`, 880, y, 'bold 16px Georgia, serif', '#2e7d32', 'right');
    const ids = Object.entries(d.recipe).flatMap(([id, n]) => Array(n).fill(id));
    let ix = 620;
    for (const id of ids) {
      drawIngredient(ctx, id, ix, y - 5, 24);
      ix += 26;
    }
  });
  text(ctx, 'Orders land on the board. Grill the patty, egg and bacon —', 640, 508, '15px system-ui, sans-serif', '#3a2a1e', 'center');
  text(ctx, 'everything else goes straight on the plate. Serve fast for tips!', 640, 530, '15px system-ui, sans-serif', '#3a2a1e', 'center');
  if (world.bestScore > 0) {
    text(ctx, `Best shift so far: $${world.bestScore}`, 640, 566, 'bold 16px Georgia, serif', '#2e7d32', 'center');
  }
  text(ctx, 'Click or press Space to start your shift', 640, 612, 'bold 18px system-ui, sans-serif', '#c0392b', 'center');
}

function drawPaused(ctx, world) {
  overlayDim(ctx);
  panel(ctx, 440, 300, 400, 160);
  text(ctx, 'PAUSED', 640, 360, 'bold 36px Georgia, serif', '#7a4a26', 'center');
  text(ctx, 'Press P or click ▶ to keep cooking', 640, 410, '15px system-ui, sans-serif', '#8a6d3b', 'center');
}

function drawOver(ctx, world) {
  overlayDim(ctx);
  const o = world.over;
  panel(ctx, 340, 150, 600, 500);
  text(ctx, 'SHIFT OVER!', 640, 220, 'bold 44px Georgia, serif', '#7a4a26', 'center');
  text(ctx, 'The bistro closes its doors…', 640, 254, 'italic 17px Georgia, serif', '#8a6d3b', 'center');
  text(ctx, `$${o.money}`, 640, 330, 'bold 64px Georgia, serif', '#2e7d32', 'center');
  text(ctx, 'earned tonight', 640, 362, '15px system-ui, sans-serif', '#8a6d3b', 'center');
  const rows = [
    [`Dishes served`, `${o.served}`],
    [`Orders walked out`, `${o.missed}`],
    [`Best combo`, `x${Math.min(GAME.comboCap, 1 + GAME.comboStep * Math.max(0, o.bestCombo - 1)).toFixed(2).replace(/0$/, '')}  (${o.bestCombo} in a row)`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 410 + i * 30;
    text(ctx, k, 440, y, '16px system-ui, sans-serif', '#3a2a1e');
    text(ctx, v, 840, y, 'bold 16px system-ui, sans-serif', '#3a2a1e', 'right');
  });
  if (o.newBest) {
    rr(ctx, 520, 510, 240, 36, 18);
    ctx.fillStyle = '#ffd23f';
    ctx.fill();
    text(ctx, '★ NEW BEST SHIFT ★', 640, 534, 'bold 15px system-ui, sans-serif', '#7a4a26', 'center');
  }
  text(ctx, 'Press Space to cook another shift', 640, 606, 'bold 17px system-ui, sans-serif', '#c0392b', 'center');
}
