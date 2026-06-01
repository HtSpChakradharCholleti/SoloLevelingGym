import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSharedValue, useDerivedValue, withSpring, withDelay } from 'react-native-reanimated';
import { Canvas, Path, Skia, vec, LinearGradient, BlurMask } from '@shopify/react-native-skia';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES } from '../theme';

const SIZE = 240;
const cx = SIZE / 2;
const cy = SIZE / 2;
const r = 80;

const STAT_ORDER = ['STR', 'VIT', 'AGI', 'END', 'INT', 'PER'];

// Helper to calculate grid hexagon paths
const getHexagonPath = (radius) => {
  const path = Skia.Path.Make();
  for (let i = 0; i < 6; i++) {
    const theta = (i * Math.PI) / 3 - Math.PI / 2;
    const x = cx + radius * Math.cos(theta);
    const y = cy + radius * Math.sin(theta);
    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  path.close();
  return path;
};

// Helper for radial axis lines
const getAxisPath = (i) => {
  const path = Skia.Path.Make();
  const theta = (i * Math.PI) / 3 - Math.PI / 2;
  const x = cx + r * Math.cos(theta);
  const y = cy + r * Math.sin(theta);
  path.moveTo(cx, cy);
  path.lineTo(x, y);
  return path;
};

export default function StatRadarChart({ stats, maxValue = 200, animate = true }) {
  // Shared values for the 6 stats (0.0 to 1.0 ratio)
  const animatedSTR = useSharedValue(0.05);
  const animatedVIT = useSharedValue(0.05);
  const animatedAGI = useSharedValue(0.05);
  const animatedEND = useSharedValue(0.05);
  const animatedINT = useSharedValue(0.05);
  const animatedPER = useSharedValue(0.05);

  useEffect(() => {
    const getRatio = (val) => Math.min(Math.max((val || 0) / maxValue, 0.05), 1.0);

    if (animate) {
      animatedSTR.value = withDelay(100, withSpring(getRatio(stats.STR)));
      animatedVIT.value = withDelay(180, withSpring(getRatio(stats.VIT)));
      animatedAGI.value = withDelay(260, withSpring(getRatio(stats.AGI)));
      animatedEND.value = withDelay(340, withSpring(getRatio(stats.END)));
      animatedINT.value = withDelay(420, withSpring(getRatio(stats.INT)));
      animatedPER.value = withDelay(500, withSpring(getRatio(stats.PER)));
    } else {
      animatedSTR.value = getRatio(stats.STR);
      animatedVIT.value = getRatio(stats.VIT);
      animatedAGI.value = getRatio(stats.AGI);
      animatedEND.value = getRatio(stats.END);
      animatedINT.value = getRatio(stats.INT);
      animatedPER.value = getRatio(stats.PER);
    }
  }, [stats, maxValue, animate]);

  // Derived path for the dynamic stat distribution polygon
  const animatedPolygonPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    
    const getVertex = (i, ratio) => {
      'worklet';
      const theta = (i * Math.PI) / 3 - Math.PI / 2;
      const radius = r * ratio;
      return {
        x: cx + radius * Math.cos(theta),
        y: cy + radius * Math.sin(theta),
      };
    };

    const p0 = getVertex(0, animatedSTR.value);
    const p1 = getVertex(1, animatedVIT.value);
    const p2 = getVertex(2, animatedAGI.value);
    const p3 = getVertex(3, animatedEND.value);
    const p4 = getVertex(4, animatedINT.value);
    const p5 = getVertex(5, animatedPER.value);

    path.moveTo(p0.x, p0.y);
    path.lineTo(p1.x, p1.y);
    path.lineTo(p2.x, p2.y);
    path.lineTo(p3.x, p3.y);
    path.lineTo(p4.x, p4.y);
    path.lineTo(p5.x, p5.y);
    path.close();

    return path;
  });

  // Derived paths for stat vertices/points to draw small glowing dots
  const getPointPosition = (i, animatedVal) => {
    'worklet';
    const theta = (i * Math.PI) / 3 - Math.PI / 2;
    return {
      cx: cx + r * animatedVal * Math.cos(theta),
      cy: cy + r * animatedVal * Math.sin(theta),
    };
  };

  const p0 = useDerivedValue(() => getPointPosition(0, animatedSTR.value));
  const p1 = useDerivedValue(() => getPointPosition(1, animatedVIT.value));
  const p2 = useDerivedValue(() => getPointPosition(2, animatedAGI.value));
  const p3 = useDerivedValue(() => getPointPosition(3, animatedEND.value));
  const p4 = useDerivedValue(() => getPointPosition(4, animatedINT.value));
  const p5 = useDerivedValue(() => getPointPosition(5, animatedPER.value));

  // Concentric hex paths (static)
  const hex1 = getHexagonPath(r * 0.25);
  const hex2 = getHexagonPath(r * 0.50);
  const hex3 = getHexagonPath(r * 0.75);
  const hex4 = getHexagonPath(r * 1.00);

  // Radial axes paths
  const axes = STAT_ORDER.map((_, i) => getAxisPath(i));

  // Precise label position helper
  const getLabelStyle = (i) => {
    const theta = (i * Math.PI) / 3 - Math.PI / 2;
    const lx = cx + (r + 24) * Math.cos(theta);
    const ly = cy + (r + 14) * Math.sin(theta);
    
    return {
      position: 'absolute',
      left: lx - 30,
      top: ly - 10,
      width: 60,
      alignItems: 'center',
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Canvas style={{ width: SIZE, height: SIZE }}>
          {/* Concentric grid lines */}
          <Path path={hex1} color={COLORS.surfaceBorder} style="stroke" strokeWidth={1} />
          <Path path={hex2} color={COLORS.surfaceBorder} style="stroke" strokeWidth={1} />
          <Path path={hex3} color={COLORS.surfaceBorder} style="stroke" strokeWidth={1} />
          <Path path={hex4} color={COLORS.surfaceBorder + '80'} style="stroke" strokeWidth={1.5} />

          {/* Radial axis lines */}
          {axes.map((axisPath, i) => (
            <Path key={i} path={axisPath} color={COLORS.surfaceBorder + '60'} style="stroke" strokeWidth={1} />
          ))}

          {/* Filled User Stat Polygon */}
          <Path path={animatedPolygonPath} style="fill">
            <LinearGradient
              start={vec(cx, cy - r)}
              end={vec(cx, cy + r)}
              colors={[COLORS.accent + '4D', COLORS.accent + '1A']}
            />
          </Path>

          {/* Glowing Stroke for the Polygon */}
          <Path path={animatedPolygonPath} color={COLORS.accent} style="stroke" strokeWidth={2.5}>
            <BlurMask blur={3} style="solid" />
          </Path>

          {/* Glowing vertices dots */}
          {[{p: p0}, {p: p1}, {p: p2}, {p: p3}, {p: p4}, {p: p5}].map((item, i) => {
            const circlePath = useDerivedValue(() => {
              const cp = Skia.Path.Make();
              cp.addCircle(item.p.value.cx, item.p.value.cy, 3);
              return cp;
            });
            return (
              <Path
                key={i}
                path={circlePath}
                color="#fff"
                style="fill"
              >
                <BlurMask blur={2} style="solid" />
              </Path>
            );
          })}
        </Canvas>

        {/* Absolutely positioned label overlay for crisp typography */}
        {STAT_ORDER.map((stat, i) => (
          <View key={stat} style={getLabelStyle(i)}>
            <Text style={[styles.labelText, { color: STAT_COLORS[stat] || COLORS.textSecondary }]}>
              {stat}
            </Text>
            <Text style={styles.labelValText}>{stats[stat] || 0}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  chartContainer: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  labelValText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: -2,
  },
});
