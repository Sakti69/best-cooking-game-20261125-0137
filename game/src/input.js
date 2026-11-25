// Ember & Thyme — mouse + keyboard input. Reads the hot regions render.js
// computed for the last frame; calls back into world actions.
import { ING_BY_ID } from './config.js';
import {
  addIngredient,
  grillClick,
  trashPlate,
  serveOrder,
  serveMatching,
  startShift,
} from './world.js';
import { playAdd, playGrill, playReady, playServe, playWrong, playClick, unlockAudio } from './audio.js';

export function attachInput(canvas, world, hooks) {
  const { onAction } = hooks;

  function soundFor(result, action) {
    if (world.muted) return;
    if (action === 'serve' && result.ok) playServe();
    else if (action === 'serve' && !result.ok) playWrong();
    else if (action === 'add' && result.ok) playAdd();
    else if (action === 'grill' && result.ok) playGrill();
    else if (action === 'wrong') playWrong();
  }

  function handleHot(hot) {
    if (!hot) return;
    unlockAudio();
    if (hot.kind === 'pause') {
      if (world.state === 'playing') {
        world.state = 'paused';
        playClick();
      } else if (world.state === 'paused') {
        world.state = 'playing';
        playClick();
      }
      return;
    }
    if (hot.kind === 'mute') {
      world.muted = !world.muted;
      playClick();
      return;
    }
    if (world.state === 'title' || world.state === 'over') return; // Space/click handled by key/canvas start
    if (world.state !== 'playing') return;
    if (hot.kind === 'ingredient') {
      const r = addIngredient(world, hot.id);
      soundFor(r, 'add');
      if (r.ok && ING_BY_ID[hot.id].cook === 'grill') playGrill();
      onAction?.('ingredient', hot.id, r);
    } else if (hot.kind === 'grill') {
      const before = world.grill[hot.slot].state;
      const r = grillClick(world, hot.slot);
      if (r.ok && before === 'ready') playAdd();
      else if (r.ok) playClick();
      onAction?.('grill', hot.slot, r);
    } else if (hot.kind === 'trash') {
      const r = trashPlate(world);
      if (r.ok) playClick();
      onAction?.('trash', null, r);
    } else if (hot.kind === 'serve') {
      const r = serveMatching(world);
      soundFor(r, 'serve');
      onAction?.('serve', null, r);
    } else if (hot.kind === 'order') {
      const r = serveOrder(world, hot.uid);
      soundFor(r, 'serve');
      onAction?.('order', hot.uid, r);
    }
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    if (world.state === 'title') {
      unlockAudio();
      startShift(world);
      playClick();
      onAction?.('start', null, { ok: true });
      return;
    }
    if (world.state === 'over') {
      unlockAudio();
      startShift(world);
      playClick();
      onAction?.('restart', null, { ok: true });
      return;
    }
    if (world.state === 'paused') {
      // Clicking anywhere resumes.
      world.state = 'playing';
      playClick();
      return;
    }
    const hot = (world._hot || []).find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
    handleHot(hot);
  });

  function onKey(e) {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'enter') {
      e.preventDefault();
      unlockAudio();
      if (world.state === 'title' || world.state === 'over') {
        startShift(world);
        playClick();
        onAction?.('start', null, { ok: true });
      } else if (world.state === 'playing') {
        const r = serveMatching(world);
        soundFor(r, 'serve');
        onAction?.('serve', null, r);
      } else if (world.state === 'paused') {
        world.state = 'playing';
        playClick();
      }
      return;
    }
    if (world.state !== 'playing') {
      if (k === 'p' && world.state === 'paused') {
        world.state = 'playing';
        playClick();
      }
      return;
    }
    if (k === 'p') {
      world.state = 'paused';
      playClick();
      return;
    }
    if (k === 'm') {
      world.muted = !world.muted;
      return;
    }
    if (k === 't') {
      const r = trashPlate(world);
      if (r.ok) playClick();
      onAction?.('trash', null, r);
      return;
    }
    if (k === 's') {
      const r = serveMatching(world);
      soundFor(r, 'serve');
      onAction?.('serve', null, r);
      return;
    }
    const ing = ING_BY_ID[Object.keys(ING_BY_ID).find((id) => ING_BY_ID[id].key === k)];
    if (ing) {
      unlockAudio();
      const r = addIngredient(world, ing.id);
      soundFor(r, 'add');
      if (r.ok && ing.cook === 'grill') playGrill();
      onAction?.('ingredient', ing.id, r);
    }
  }

  window.addEventListener('keydown', onKey);
  return { handleHot };
}
