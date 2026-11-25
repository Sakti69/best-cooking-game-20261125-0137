// Ember & Thyme — original sounds, synthesized with WebAudio. No audio files.
let ctx = null;
let sizzleGain = null;
let sizzleSrc = null;

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensure();
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  const c = ensure();
  if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export function playAdd() {
  tone(520, 0.09, 'triangle', 0.1);
  tone(780, 0.08, 'triangle', 0.07, 0.05);
}

export function playGrill() {
  tone(220, 0.12, 'sawtooth', 0.05);
  tone(330, 0.1, 'triangle', 0.08, 0.04);
}

export function playReady() {
  tone(880, 0.12, 'sine', 0.1);
  tone(1174, 0.16, 'sine', 0.1, 0.09);
}

export function playServe() {
  tone(523, 0.12, 'triangle', 0.12);
  tone(659, 0.12, 'triangle', 0.12, 0.08);
  tone(784, 0.22, 'triangle', 0.12, 0.16);
}

export function playWrong() {
  tone(160, 0.18, 'square', 0.06);
  tone(120, 0.22, 'square', 0.06, 0.1);
}

export function playMiss() {
  tone(392, 0.15, 'sine', 0.09);
  tone(311, 0.2, 'sine', 0.09, 0.12);
  tone(233, 0.3, 'sine', 0.09, 0.24);
}

export function playClick() {
  tone(660, 0.05, 'triangle', 0.06);
}

// Looping grill sizzle while anything cooks; gain follows the cooking count.
export function setSizzle(count) {
  const c = ensure();
  if (!c) return;
  if (count > 0 && !sizzleSrc) {
    const len = c.sampleRate * 1;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 2500;
    sizzleGain = c.createGain();
    sizzleGain.gain.value = 0.015;
    src.connect(filt).connect(sizzleGain).connect(c.destination);
    src.start();
    sizzleSrc = src;
  } else if (count === 0 && sizzleSrc) {
    try {
      sizzleSrc.stop();
    } catch {
      /* already stopped */
    }
    sizzleSrc = null;
    sizzleGain = null;
  } else if (sizzleGain) {
    sizzleGain.gain.value = 0.015 * Math.min(2, count);
  }
}
