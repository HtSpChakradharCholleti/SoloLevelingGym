import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';

const CHART_HEIGHT = 160;
const DOT_SIZE = 7;
const ACTIVE_DOT_SIZE = 9;
const BAR_WIDTH = 3;

/**
 * Pure-RN weight progress chart — vertical bars with dot tips and gradient fill.
 * No SVG / charting library required.
 *
 * @param {Array<{date: string, weight: number, unit: string}>} data
 *   Weight history entries — newest-first. The component reverses internally.
 * @param {number} [maxPoints=14]
 */
export default function WeightChart({ data = [], maxPoints = 14 }) {
  if (data.length < 2) return null;

  // Chronological (oldest → newest), limited
  const chronological = [...data].reverse().slice(-maxPoints);
  const weights = chronological.map(d => d.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const range = rawMax - rawMin || 1;
  const pad = range * 0.18;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yRange = yMax - yMin;

  const normalise = (w) => Math.max(0, Math.min(1, (w - yMin) / yRange));

  // Change indicator
  const latest = weights[weights.length - 1];
  const previous = weights[weights.length - 2];
  const diff = latest - previous;
  const absDiff = Math.abs(diff).toFixed(1);
  const isUp = diff > 0.05;
  const isDown = diff < -0.05;
  const unit = chronological[chronological.length - 1]?.unit || 'kg';

  // Y-axis labels (3 values)
  const yLabels = [rawMin.toFixed(1), ((rawMin + rawMax) / 2).toFixed(1), rawMax.toFixed(1)];

  // X-axis: show first, last, and ~2 middle labels
  const xLabelSet = new Set([0, chronological.length - 1]);
  if (chronological.length > 4) {
    const mid = Math.floor(chronological.length / 2);
    xLabelSet.add(mid);
  }

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="chart-line" size={14} color={COLORS.accent} />
          <Text style={styles.chartTitle}>WEIGHT TREND</Text>
        </View>
        {(isUp || isDown) && (
          <View style={[styles.changeBadge, isDown ? styles.badgeDown : styles.badgeUp]}>
            <MaterialCommunityIcons
              name={isDown ? 'trending-down' : 'trending-up'}
              size={12}
              color={isDown ? COLORS.success : COLORS.danger}
            />
            <Text style={[styles.changeText, isDown ? styles.changeDown : styles.changeUp]}>
              {absDiff} {unit}
            </Text>
          </View>
        )}
      </View>

      {/* Chart body */}
      <View style={styles.chartBody}>
        {/* Y-axis */}
        <View style={styles.yAxis}>
          {[...yLabels].reverse().map((label, i) => (
            <Text key={i} style={styles.yLabel}>{label}</Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((frac, i) => (
            <View
              key={'g' + i}
              style={[styles.gridLine, { bottom: `${frac * 100}%` }]}
            />
          ))}

          {/* Bars + dots */}
          <View style={styles.barsRow}>
            {chronological.map((entry, i) => {
              const frac = normalise(entry.weight);
              const heightPct = `${(frac * 100).toFixed(1)}%`;
              const isLast = i === chronological.length - 1;
              const dotSz = isLast ? ACTIVE_DOT_SIZE : DOT_SIZE;

              return (
                <View key={i} style={styles.barColumn}>
                  {/* Column with gradient fill */}
                  <View style={[styles.barWrapper, { height: heightPct }]}>
                    <LinearGradient
                      colors={
                        isLast
                          ? [COLORS.accent, COLORS.accent + '30']
                          : [COLORS.accentDark + 'AA', COLORS.accentDark + '15']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.barFill}
                    />
                    {/* Dot at top */}
                    <View
                      style={[
                        styles.dot,
                        {
                          width: dotSz,
                          height: dotSz,
                          borderRadius: dotSz / 2,
                          marginTop: -dotSz / 2,
                          backgroundColor: isLast ? COLORS.accent : COLORS.accentDark,
                          borderColor: isLast ? COLORS.accent : COLORS.surface,
                          borderWidth: isLast ? 2 : 1.5,
                        },
                        isLast && styles.dotGlow,
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis */}
      <View style={[styles.xAxis, { marginLeft: 32 }]}>
        {chronological.map((entry, i) => (
          <View key={i} style={styles.xLabelSlot}>
            {xLabelSet.has(i) && (
              <Text style={styles.xLabel}>{formatShortDate(entry.date)}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Latest weight callout */}
      <View style={styles.latestRow}>
        <Text style={styles.latestLabel}>Latest</Text>
        <Text style={styles.latestValue}>
          {latest} <Text style={styles.latestUnit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  chartTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeUp: { backgroundColor: COLORS.danger + '18' },
  badgeDown: { backgroundColor: COLORS.success + '18' },
  changeText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  changeUp: { color: COLORS.danger },
  changeDown: { color: COLORS.success },

  // Chart body
  chartBody: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 32,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: SPACING.xs,
  },
  yLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.surfaceBorder,
  },

  // Bars
  barsRow: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    width: BAR_WIDTH,
    alignItems: 'center',
    minHeight: 4,
  },
  barFill: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  dot: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  dotGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },

  // X-axis
  xAxis: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  xLabelSlot: {
    flex: 1,
    alignItems: 'center',
  },
  xLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
  },

  // Latest callout
  latestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceBorder,
  },
  latestLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  latestValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.accent,
  },
  latestUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
});
