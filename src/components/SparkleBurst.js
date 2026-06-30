// Reusable particle-burst overlay used to punctuate rewarding moments
// (set complete, quest complete, workout cleared, streak milestone…).
//
// All motion runs on the UI thread via Reanimated shared values — no JS-side
// per-frame work — so it stays smooth even when the JS thread is busy
// handling a state transition.

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../theme';

/**
 * A single particle that travels outward from the burst origin.
 * Memoised via React's structural sharing — the parent renders a fixed
 * number of these on mount.
 */
function Particle({ angle, distance, size, color, duration, delay }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
    // Fast pop in, slow fade out
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 80 }, () => {
        opacity.value = withTiming(0, { duration: duration - 80 });
      })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const tx = Math.cos(angle) * distance * progress.value;
    const ty = Math.sin(angle) * distance * progress.value;
    const scale = 1 - progress.value * 0.6;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        style,
      ]}
    />
  );
}

/**
 * SparkleBurst — emits N particles outward from the centre of its parent.
 *
 * @param {number}   count    Number of particles (default 10)
 * @param {number}   radius   Max distance each particle travels (px, default 60)
 * @param {string[]} colors   Pool of colours to pick from
 * @param {number}   duration Total burst length in ms (default 700)
 * @param {boolean}  active   When false, nothing renders. Re-mount the component
 *                            (via `key`) to retrigger.
 */
export default function SparkleBurst({
  count = 10,
  radius = 60,
  colors,
  duration = 700,
  active = true,
}) {
  const palette = colors && colors.length > 0
    ? colors
    : [COLORS.accent, COLORS.primary, COLORS.warning, COLORS.success];

  const particles = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Even angular distribution + slight jitter for organic feel
      const baseAngle = (i / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * (Math.PI / count);
      arr.push({
        angle: baseAngle + jitter,
        distance: radius * (0.6 + Math.random() * 0.4),
        size: 4 + Math.random() * 5,
        color: palette[i % palette.length],
        duration: duration * (0.7 + Math.random() * 0.4),
        delay: Math.random() * 80,
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hooks-rules: this guard must come after any hook calls above.
  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
});


