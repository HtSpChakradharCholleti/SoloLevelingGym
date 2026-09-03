import { useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import PlayerContext from '../store/PlayerContext';
import { subscribeShapeScale, getShapeScale, setShapeMode } from './shapeScale';

const DEFAULT_SHAPE_MODE = 'rounded';

/**
 * Returns a `StyleSheet.create` replacement that bakes in the active corner
 * shape (settings.shapeMode: 'rounded' | 'square').
 *
 * Usage (component):
 *   const styles = useShapeStyles(() => StyleSheet.create({ ... }));
 *
 * The factory is re-run whenever the shape scale changes — on each animation
 * frame when toggling, or once on mode change — and it reads the live
 * `BORDER_RADIUS.*` tokens at build time. Token-driven corners morph between
 * rounded and square; raw-numeric radii (avatars, halos, control buttons)
 * stay untouched. Reading the raw context (not usePlayer) keeps this safe to
 * call from components rendered outside a provider, where it defaults to
 * rounded.
 */
export default function useShapeStyles(makeStyles) {
  // Opt out of React Compiler — the beta would collapse the useMemo below
  // and the useSyncExternalStore subscription in ways that skip re-renders
  // when the external scale changes. Standard hook semantics are required.
  'use no memo';
  const context = useContext(PlayerContext);
  const mode = context?.settings?.shapeMode ?? DEFAULT_SHAPE_MODE;

  // Drive the shared scale store toward the target mode.
  // First call after app start snaps (no animation); subsequent calls animate.
  // All mounted screens see the same context change and call this, but the
  // store's internal guard (mode unchanged → no-op) ensures only the first
  // call triggers work.
  useEffect(() => {
    setShapeMode(mode);
  }, [mode]);

  // Subscribe to the animatable scale. The store publishes a new object on
  // each frame; useSyncExternalStore re-renders the component and useMemo
  // rebuilds styles with the updated radii.
  const scale = useSyncExternalStore(subscribeShapeScale, getShapeScale);
  return useMemo(() => makeStyles(), [makeStyles, scale]);
}
