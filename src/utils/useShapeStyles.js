import { useContext, useMemo } from 'react';
import PlayerContext from '../store/PlayerContext';
import { applyShapeMode } from '../theme';

const DEFAULT_SHAPE_MODE = 'rounded';

/**
 * Returns a `StyleSheet.create` replacement that bakes in the active corner
 * shape (settings.shapeMode: 'rounded' | 'square').
 *
 * Usage (component):
 *   const styles = useShapeStyles(() => StyleSheet.create({ ... }));
 *
 * The factory is re-run only when the shape mode changes, and it reads the
 * `BORDER_RADIUS.*` tokens at build time — so token-driven corners square or
 * round live, while raw-numeric radii (circular avatars, glow-circles) stay
 * untouched. Reading the raw context (not usePlayer) keeps this safe to call
 * from components rendered outside a provider, where it defaults to rounded.
 */
export default function useShapeStyles(makeStyles) {
  // Opt out of React Compiler — the beta collapses the useMemo below to a
  // cache keyed only on `makeStyles` (stable across renders) and never
  // re-runs it when `mode` flips, because it can't see that applyShapeMode()
  // mutates the global BORDER_RADIUS that makeStyles() reads. Standard
  // useMemo deps (rebuild on mode change) are the correct behavior here.
  // Same opt-out already used in WorkoutScreen.
  'use no memo';
  const context = useContext(PlayerContext);
  const mode = context?.settings?.shapeMode ?? DEFAULT_SHAPE_MODE;

  return useMemo(() => {
    // Centralize the scale mutation here — the only place styles are rebuilt —
    // so the shared BORDER_RADIUS always reflects the one global setting.
    applyShapeMode(mode);
    return makeStyles();
  }, [makeStyles, mode]);
}
