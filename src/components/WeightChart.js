import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';

const CHART_HEIGHT = 170;
const CHART_PADDING_TOP = 12;
const CHART_PADDING_BOTTOM = 4;
const DOT_RADIUS = 3.5;
const ACTIVE_DOT_RADIUS = 5;
const Y_AXIS_WIDTH = 38;

/**
 * SVG weight-progress line chart with gradient fill.
 *
 * @param {Array<{date: string, weight: number, unit: string}>} data
 *   Weight history entries — newest-first. Reversed internally.
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

  // Change indicator
  const latest = weights[weights.length - 1];
  const previous = weights[weights.length - 2];
  const diff = latest - previous;
  const absDiff = Math.abs(diff).toFixed(1);
  const isUp = diff > 0.05;
  const isDown = diff < -0.05;
  const unit = chronological[chronological.length - 1]?.unit || 'kg';

  // Y-axis labels (4 values)
  const yLabelCount = 4;
  const yLabels = [];
  for (let i = 0; i < yLabelCount; i++) {
    yLabels.push(yMin + (yRange / (yLabelCount - 1)) * i);
  }

  // X-axis labels (sparse)
  const xLabelSet = new Set([0, chronological.length - 1]);
  if (chronological.length > 5) {
    const mid = Math.floor(chronological.length / 2);
    xLabelSet.add(mid);
  }

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  // Chart drawable area
  const usableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Convert data to SVG coordinates
  const toX = (i, chartWidth) => {
    if (chronological.length === 1) return chartWidth / 2;
    return (i / (chronological.length - 1)) * chartWidth;
  };

  const toY = (weight) => {
    const frac = (weight - yMin) / yRange;
    return CHART_HEIGHT - CHART_PADDING_BOTTOM - frac * usableHeight;
  };

  // Build SVG path (smooth cubic bezier)
  const buildLinePath = (chartWidth) => {
    const points = chronological.map((d, i) => ({
      x: toX(i, chartWidth),
      y: toY(d.weight),
    }));

    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      // Catmull-Rom to cubic bezier control points
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Build area path (line path + close at bottom)
  const buildAreaPath = (chartWidth) => {
    const linePath = buildLinePath(chartWidth);
    if (!linePath) return '';
    const lastX = toX(chronological.length - 1, chartWidth);
    const firstX = toX(0, chartWidth);
    return `${linePath} L ${lastX} ${CHART_HEIGHT} L ${firstX} ${CHART_HEIGHT} Z`;
  };

  // We render at a fixed assumed width; the View handles layout
  const SVG_WIDTH = 300; // will stretch via viewBox / preserveAspectRatio

  return (
    <View style={styles.container} onLayout={() => {}}>
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
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[...yLabels].reverse().map((val, i) => (
            <Text key={i} style={styles.yLabel}>{val.toFixed(1)}</Text>
          ))}
        </View>

        {/* SVG Chart */}
        <View style={styles.svgWrap}>
          <Svg
            width="100%"
            height={CHART_HEIGHT}
            viewBox={`0 0 ${SVG_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={COLORS.accent} stopOpacity="0.02" />
              </SvgGradient>
              <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={COLORS.accentDark} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={COLORS.accent} stopOpacity="1" />
              </SvgGradient>
            </Defs>

            {/* Grid lines */}
            {yLabels.map((val, i) => {
              const y = toY(val);
              return (
                <Line
                  key={'grid-' + i}
                  x1={0}
                  y1={y}
                  x2={SVG_WIDTH}
                  y2={y}
                  stroke={COLORS.surfaceBorder}
                  strokeWidth={0.5}
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Area fill */}
            <Path
              d={buildAreaPath(SVG_WIDTH)}
              fill="url(#areaFill)"
            />

            {/* Line */}
            <Path
              d={buildLinePath(SVG_WIDTH)}
              stroke="url(#lineGrad)"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dots */}
            {chronological.map((entry, i) => {
              const cx = toX(i, SVG_WIDTH);
              const cy = toY(entry.weight);
              const isLast = i === chronological.length - 1;

              return (
                <React.Fragment key={'dot-' + i}>
                  {isLast && (
                    <Circle
                      cx={cx}
                      cy={cy}
                      r={ACTIVE_DOT_RADIUS + 4}
                      fill={COLORS.accent}
                      opacity={0.15}
                    />
                  )}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={isLast ? ACTIVE_DOT_RADIUS : DOT_RADIUS}
                    fill={isLast ? COLORS.accent : COLORS.surface}
                    stroke={isLast ? COLORS.accent : COLORS.accentDark}
                    strokeWidth={isLast ? 2 : 1.5}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
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
    width: Y_AXIS_WIDTH,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: SPACING.xs,
  },
  yLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  svgWrap: {
    flex: 1,
    height: CHART_HEIGHT,
  },

  // X-axis
  xAxis: {
    flexDirection: 'row',
    marginLeft: Y_AXIS_WIDTH,
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
