import React from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import SystemPanel from '../components/SystemPanel';

export default function HistoryScreen() {
  const { workoutHistory, totalWorkouts, currentStreak, bestStreak } = usePlayer();

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
    <Animated.View key={entry.id} entering={FadeInUp.delay(index * 100).duration(500)} style={styles.historyItem}>
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
          <Text style={styles.summaryLabel}>Total Battles</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{currentStreak} 🔥</Text>
          <Text style={styles.summaryLabel}>Current Streak</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{bestStreak}</Text>
          <Text style={styles.summaryLabel}>Best Streak</Text>
        </View>
      </View>

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
          {workoutHistory.map((entry, index) => renderWorkoutItem(entry, index))}
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
});
