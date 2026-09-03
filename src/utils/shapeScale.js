import { ROUNDED_RADIUS, SQUARE_RADIUS, BORDER_RADIUS } from '../theme';

/**
 * Live, animatable corner-scale store.
 *
 * Instead of snapping between the two radius scales, this module eases the
 * per-corner values from their current numbers to the target scale over a
 * short duration. Consumers (useShapeStyles) subscribe via
 * useSyncExternalStore and rebuild their StyleSheet on each frame, so card
 * corners visibly morph between rounded and square.
 *
 * The shared BORDER_RADIUS token is mirrored on every frame too, so the
 * handful of inline (non-hook) styles that read the token stay consistent.
 */

const DURATION_MS = 280;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Frame driver: a 16ms timer (~60fps) is visually indistinguishable from RAF
// for a 280ms morph, and it is controlled deterministically by jest's fake
// timers (the RN jest preset stubs requestAnimationFrame, which would leave
// the animation hanging in tests).
const scheduleFrame = (fn) => setTimeout(fn, 16);
const cancelFrame = (id) => clearTimeout(id);

let scale = { ...ROUNDED_RADIUS }; // current (possibly fractional) values
let mode = 'rounded';
let settled = false; // a mount-time snap has happened yet
let rafId = 0;
const listeners = new Set();

function publish(next) {
  scale = { ...next };
  Object.assign(BORDER_RADIUS, scale); // keep the token in lockstep
  listeners.forEach((listener) => listener());
}

function snapTo(nextMode) {
  mode = nextMode;
  settled = true;
  cancelFrame(rafId);
  rafId = 0;
  publish(nextMode === 'square' ? SQUARE_RADIUS : ROUNDED_RADIUS);
}

function animateTo(nextMode) {
  const from = { ...scale };
  const to = nextMode === 'square' ? SQUARE_RADIUS : ROUNDED_RADIUS;
  mode = nextMode;
  settled = true;
  cancelFrame(rafId);
  const start = Date.now();

  const step = () => {
    const t = Math.min(1, (Date.now() - start) / DURATION_MS);
    const k = easeOutCubic(t);
    if (t < 1) {
      const next = {};
      Object.keys(to).forEach((key) => {
        next[key] = from[key] + (to[key] - from[key]) * k;
      });
      publish(next);
      rafId = scheduleFrame(step);
    } else {
      // Land exactly on the target scale (no float drift).
      publish(to);
      rafId = 0;
    }
  };
  rafId = scheduleFrame(step);
}

/**
 * Drive the scale toward `nextMode`. First call after app start snaps (avoids
 * an unwanted morph during cold launch with a persisted 'square' setting);
 * subsequent calls animate from the current values. Rapid re-toggles
 * restart the animation from wherever it is, so it never jumps.
 */
export function setShapeMode(nextMode) {
  if (!settled) {
    snapTo(nextMode);
    return;
  }
  if (nextMode === mode) return;
  animateTo(nextMode);
}

export function subscribeShapeScale(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getShapeScale = () => scale;
export const getShapeMode = () => mode;

/** Test-only: restore the initial rounded/settled=false state. */
export function resetShapeScale() {
  cancelFrame(rafId);
  rafId = 0;
  mode = 'rounded';
  settled = false;
  scale = { ...ROUNDED_RADIUS };
  Object.assign(BORDER_RADIUS, scale);
}
