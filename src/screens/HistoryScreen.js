// React & React Native
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

// Third-party
import Svg, {
  Rect, Defs,
  LinearGradient as SvgGradient, Stop,
  Line, Text as SvgText,
} from 'react-native-svg';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';

// Components
import SystemPanel from '../components/SystemPanel';

// ─── XP Per-Day Bar Chart ─────────────────────────────────────────────────────
const CHART_DAYS = 14;
const BAR_CHART_HEIGHT = 120;
const BAR_RADIUS = 3;

/**
 * SVG bar chart showing XP earned per day for the last 14 days.
 * Purple gradient bars match the Shadow Army theme; today is highlighted in gold.
 * @param { Array<{ date: string, xpEarned: number }> } workoutHistory - Workout entries with date and XP
 */
function XPBarChart({ workoutHistory }) {
  // Build daily XP map for the last CHART_DAYS days
  const { dailyData, maxXP, totalXP } = useMemo(() => {
    const map = {};
    // Aggregate XP per date
    workoutHistory.forEach(w => {
      map[w.date] = (map[w.date] || 0) + (w.xpEarned || 0);
    });

    // Build array for last N days (oldest → newest)
    const days = [];
    const today = new Date();
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W…
      const xp = map[dateStr] || 0;
      days.push({ dateStr, dayLabel, xp, isToday: i === 0 });
    }

    const max = Math.max(...days.map(d => d.xp), 1);
    const total = days.reduce((s, d) => s + d.xp, 0);
    return { dailyData: days, maxXP: max, totalXP: total };
  }, [workoutHistory]);

  if (workoutHistory.length === 0) return null;

  // Average XP per active day (days with > 0 XP)
  const activeDays = dailyData.filter(d => d.xp > 0).length;
  const avgXP = activeDays > 0 ? Math.round(totalXP / activeDays) : 0;

  const SVG_WIDTH = 300;
  const barGap = 3;
  const barWidth = (SVG_WIDTH - barGap * (CHART_DAYS - 1)) / CHART_DAYS;
  const minBarHeight = 3; // show a tiny mark for zero-XP days

  return (
    <View style={chartStyles.container}>
      {/* Header */}
      <View style={chartStyles.headerRow}>
        <View style={chartStyles.headerLeft}>
          <MaterialCommunityIcons name="chart-bar" size={14} color="#6b3fa0" />
          <Text style={chartStyles.title}>XP PER DAY</Text>
        </View>
        <View style={chartStyles.headerRight}>
          <Text style={chartStyles.avgLabel}>AVG </Text>
          <Text style={chartStyles.avgValue}>{avgXP} XP</Text>
        </View>
      </View>

      {/* SVG Bar Chart */}
      <View style={chartStyles.svgWrap}>
        <Svg
          width="100%"
          height={BAR_CHART_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${BAR_CHART_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <SvgGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#9b6fd4" stopOpacity="1" />
              <Stop offset="100%" stopColor="#6b3fa0" stopOpacity="0.7" />
            </SvgGradient>
            <SvgGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.accent} stopOpacity="1" />
              <Stop offset="100%" stopColor={COLORS.accentDark} stopOpacity="0.8" />
            </SvgGradient>
          </Defs>

          {/* Bars */}
          {dailyData.map((day, i) => {
            const barH = day.xp > 0
              ? Math.max((day.xp / maxXP) * (BAR_CHART_HEIGHT - 20), minBarHeight)
              : minBarHeight;
            const x = i * (barWidth + barGap);
            const y = BAR_CHART_HEIGHT - barH;

            return (
              <React.Fragment key={day.dateStr}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={day.isToday ? 'url(#barGradToday)' : (day.xp > 0 ? 'url(#barGrad)' : COLORS.surfaceLight)}
                  opacity={day.xp > 0 ? 1 : 0.4}
                />
                {/* XP label on top of bar for high-XP days */}
                {day.xp > 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 3}
                    fontSize="8"
                    fill={COLORS.textMuted}
                    textAnchor="middle"
                    fontFamily="Outfit_400Regular"
                  >
                    {day.xp}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Day labels */}
      <View style={chartStyles.dayLabelsRow}>
        {dailyData.map((day, i) => (
          <Text
            key={i}
            style={[
              chartStyles.dayLabel,
              day.isToday && chartStyles.dayLabelToday,
            ]}
          >
            {day.dayLabel}
          </Text>
        ))}
      </View>

      {/* Footer summary */}
      <View style={chartStyles.footerRow}>
        <Text style={chartStyles.footerLabel}>Last {CHART_DAYS} days</Text>
        <Text style={chartStyles.footerValue}>
          {totalXP} <Text style={chartStyles.footerUnit}>XP total</Text>
        </Text>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
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
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  avgLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  avgValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: '#9b6fd4',
  },
  svgWrap: {
    height: BAR_CHART_HEIGHT,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  dayLabelToday: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceBorder,
  },
  footerLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  footerValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#9b6fd4',
  },
  footerUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
});

XPBarChart.propTypes = {
  workoutHistory: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      xpEarned: PropTypes.number,
    })
  ).isRequired,
};

// ─── Workout Time Per-Day Bar Chart ───────────────────────────────────────────
const TIME_CHART_HEIGHT = 120;

/**
 * SVG bar chart showing workout duration per day for the last 14 days.
 * Green gradient bars; today is highlighted in gold.
 * @param { Array<{ date: string, duration: number }> } workoutHistory - Entries with date and duration (ms)
 */
function WorkoutTimeChart({ workoutHistory }) {
  const { dailyData, maxMinutes, totalMinutes } = useMemo(() => {
    const map = {};
    workoutHistory.forEach(w => {
      const mins = Math.round((w.duration || 0) / 60000);
      map[w.date] = (map[w.date] || 0) + mins;
    });

    const days = [];
    const today = new Date();
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      const mins = map[dateStr] || 0;
      days.push({ dateStr, dayLabel, mins, isToday: i === 0 });
    }

    const max = Math.max(...days.map(d => d.mins), 1);
    const total = days.reduce((s, d) => s + d.mins, 0);
    return { dailyData: days, maxMinutes: max, totalMinutes: total };
  }, [workoutHistory]);

  if (workoutHistory.length === 0) return null;

  const activeDays = dailyData.filter(d => d.mins > 0).length;
  const avgMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;

  const formatDur = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  };

  const SVG_WIDTH = 300;
  const barGap = 3;
  const barWidth = (SVG_WIDTH - barGap * (CHART_DAYS - 1)) / CHART_DAYS;
  const minBarHeight = 3;

  return (
    <View style={timeChartStyles.container}>
      {/* Header */}
      <View style={timeChartStyles.headerRow}>
        <View style={timeChartStyles.headerLeft}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.success} />
          <Text style={timeChartStyles.title}>WORKOUT TIME</Text>
        </View>
        <View style={timeChartStyles.headerRight}>
          <Text style={timeChartStyles.avgLabel}>AVG </Text>
          <Text style={timeChartStyles.avgValue}>{formatDur(avgMinutes)}</Text>
        </View>
      </View>

      {/* SVG Bar Chart */}
      <View style={timeChartStyles.svgWrap}>
        <Svg
          width="100%"
          height={TIME_CHART_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${TIME_CHART_HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <SvgGradient id="timeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.success} stopOpacity="1" />
              <Stop offset="100%" stopColor="#065f46" stopOpacity="0.7" />
            </SvgGradient>
            <SvgGradient id="timeBarGradToday" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.accent} stopOpacity="1" />
              <Stop offset="100%" stopColor={COLORS.accentDark} stopOpacity="0.8" />
            </SvgGradient>
          </Defs>

          {dailyData.map((day, i) => {
            const barH = day.mins > 0
              ? Math.max((day.mins / maxMinutes) * (TIME_CHART_HEIGHT - 20), minBarHeight)
              : minBarHeight;
            const x = i * (barWidth + barGap);
            const y = TIME_CHART_HEIGHT - barH;

            return (
              <React.Fragment key={day.dateStr}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={BAR_RADIUS}
                  ry={BAR_RADIUS}
                  fill={day.isToday ? 'url(#timeBarGradToday)' : (day.mins > 0 ? 'url(#timeBarGrad)' : COLORS.surfaceLight)}
                  opacity={day.mins > 0 ? 1 : 0.4}
                />
                {day.mins > 0 && (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 3}
                    fontSize="8"
                    fill={COLORS.textMuted}
                    textAnchor="middle"
                    fontFamily="Outfit_400Regular"
                  >
                    {formatDur(day.mins)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Day labels */}
      <View style={timeChartStyles.dayLabelsRow}>
        {dailyData.map((day, i) => (
          <Text
            key={i}
            style={[
              timeChartStyles.dayLabel,
              day.isToday && timeChartStyles.dayLabelToday,
            ]}
          >
            {day.dayLabel}
          </Text>
        ))}
      </View>

      {/* Footer summary */}
      <View style={timeChartStyles.footerRow}>
        <Text style={timeChartStyles.footerLabel}>Last {CHART_DAYS} days</Text>
        <Text style={timeChartStyles.footerValue}>
          {formatDur(totalMinutes)} <Text style={timeChartStyles.footerUnit}>total</Text>
        </Text>
      </View>
    </View>
  );
}

const timeChartStyles = StyleSheet.create({
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
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  avgLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  avgValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.success,
  },
  svgWrap: {
    height: TIME_CHART_HEIGHT,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  dayLabelToday: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceBorder,
  },
  footerLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  footerValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  footerUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
});

WorkoutTimeChart.propTypes = {
  workoutHistory: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      duration: PropTypes.number,
    })
  ).isRequired,
};

// ─── Main HistoryScreen ───────────────────────────────────────────────────────

/**
 * Shadow Army tab screen — displays workout history, streak stats,
 * and an XP-per-day bar chart for the last 14 days.
 */
export default function HistoryScreen() {
  const { workoutHistory, totalWorkouts, currentStreak, bestStreak, settings } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;

  const [showAllHistory, setShowAllHistory] = useState(false);
  const INITIAL_ITEMS = 10;
  const visibleHistory = showAllHistory ? workoutHistory : workoutHistory.slice(0, INITIAL_ITEMS);
  const hasMore = workoutHistory.length > INITIAL_ITEMS;

  const formatDuration = (ms) => {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderWorkoutItem = (entry, index) => (
    <Animated.View
      key={entry.id}
      entering={animationsEnabled && index < 5 ? FadeInUp.delay(index * 80).duration(400) : undefined}
      style={styles.historyItem}
    >
      {/* Date & Duration */}
      <View style={styles.itemHeader}>
        <View style={styles.dateArea}>
          <MaterialCommunityIcons name="sword" size={16} color={COLORS.accent} />
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
        </View>
        <View style={styles.durationArea}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.durationText}>{formatDuration(entry.duration)}</Text>
        </View>
      </View>

      {/* Exercises */}
      <View style={styles.exercisesList}>
        {entry.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseTag}>
            <Text style={styles.exerciseTagText}>
              {ex.name} ({ex.completedSets}/{ex.totalSets})
            </Text>
          </View>
        ))}
      </View>

      {/* XP Footer */}
      <View style={styles.itemFooter}>
        <Text style={styles.xpEarned}>+{entry.xpEarned} XP</Text>
        {entry.statXPEarned && Object.entries(entry.statXPEarned).map(([stat, xp]) => (
          <Text key={stat} style={[styles.statXPTag, { color: STAT_COLORS[stat] }]}>
            {stat} +{xp}
          </Text>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <SystemPanel glowColor={COLORS.shadowViolet ? '#6b3fa0' : COLORS.accent}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="ghost" size={22} color="#6b3fa0" />
          <Text style={styles.headerTitle}>SHADOW ARMY</Text>
        </View>
        <Text style={styles.headerSub}>Your conquered dungeons and battle records</Text>
      </SystemPanel>

      {/* Stats Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{totalWorkouts}</Text>
          <Text style={styles.summaryLabel}>BATTLES</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{currentStreak}</Text>
          <Text style={styles.summaryLabel}>STREAK</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{bestStreak}</Text>
          <Text style={styles.summaryLabel}>BEST</Text>
        </View>
      </View>

      {/* XP Per Day Chart */}
      <XPBarChart workoutHistory={workoutHistory} />

      {/* Workout Time Per Day Chart */}
      <WorkoutTimeChart workoutHistory={workoutHistory} />

      {/* History List */}
      {workoutHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="sword-cross" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Battle Records</Text>
          <Text style={styles.emptySubtitle}>Complete your first dungeon to build your shadow army</Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          <Text style={styles.listTitle}>BATTLE LOG</Text>
          {visibleHistory.map((entry, index) => renderWorkoutItem(entry, index))}
          {hasMore && !showAllHistory && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowAllHistory(true)}
            >
              <Text style={styles.showMoreText}>
                Show {workoutHistory.length - INITIAL_ITEMS} more battles
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#6b3fa0',
    letterSpacing: 3,
  },
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  summaryValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  historyList: {},
  listTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  historyItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  durationArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  durationText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  exercisesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  exerciseTag: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  exerciseTagText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  xpEarned: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statXPTag: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xxl,
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  showMoreText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    letterSpacing: 1,
  },
});
