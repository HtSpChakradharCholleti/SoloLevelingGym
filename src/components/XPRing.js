import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSharedValue, withSpring, withDelay } from 'react-native-reanimated';
import { Canvas, Path, Skia, BlurMask } from '@shopify/react-native-skia';
import { COLORS } from '../theme';

export default function XPRing({ progress, rankColor = COLORS.accent, size = 100, children, style, animate = true }) {
  const cx = size / 2;
  const cy = size / 2;
  
  // Radius: Fits perfectly between the 80px avatar and the 100px container boundary
  const strokeWidth = 4;
  const r = 43; 

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    const finalVal = Math.min(Math.max(progress || 0, 0), 1);
    if (animate) {
      animatedProgress.value = withDelay(
        300,
        withSpring(finalVal, {
          damping: 18,
          stiffness: 90,
        })
      );
    } else {
      animatedProgress.value = finalVal;
    }
  }, [progress, animate]);

  // Construct a circle path starting at -90 degrees (top center) sweeping clockwise
  const circlePath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc({ x: cx - r, y: cy - r, width: r * 2, height: r * 2 }, -90, 360);
    return p;
  }, [cx, cy, r]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Canvas style={styles.canvas}>
        {/* Dark background track */}
        <Path
          path={circlePath}
          color={COLORS.surfaceBorder}
          style="stroke"
          strokeWidth={strokeWidth}
        />

        {/* Glowing background halo under the active stroke */}
        <Path
          path={circlePath}
          color={rankColor}
          style="stroke"
          strokeWidth={strokeWidth}
          start={0}
          end={animatedProgress}
          strokeCap="round"
        >
          <BlurMask blur={5} style="solid" />
        </Path>

        {/* Crisp foreground active progress path */}
        <Path
          path={circlePath}
          color={rankColor}
          style="stroke"
          strokeWidth={strokeWidth}
          start={0}
          end={animatedProgress}
          strokeCap="round"
        />
      </Canvas>
      
      {/* Central avatar */}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
