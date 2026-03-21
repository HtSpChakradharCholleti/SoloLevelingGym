import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, STAT_LABELS, STAT_DESCRIPTIONS, RANK_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import { getRequiredXP, getLevelProgress, getStatLevel, getStatProgress, RANK_TITLES } from '../utils/leveling';
import SystemPanel from '../components/SystemPanel';
import StatBar from '../components/StatBar';
import RankBadge from '../components/RankBadge';
import NotificationManager from '../utils/NotificationManager';

const { width } = Dimensions.get('window');

export default function HunterProfileScreen() {
  const {
    playerName, level, xp, rank, stats,
    totalWorkouts, currentStreak, bestStreak,
  } = usePlayer();

  const requiredXP = getRequiredXP(level);
  const progress = getLevelProgress(level, xp);
  const rankColor = RANK_COLORS[rank] || COLORS.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Section */}
      <LinearGradient
        colors={['#0a0a0f', COLORS.surfaceLight]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {/* Avatar Area */}
          <View style={styles.avatarArea}>
            <View style={[styles.avatarGlow, { shadowColor: rankColor }]}>
              <LinearGradient
                colors={GRADIENTS[`rank${rank}`] || GRADIENTS.rankE}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="sword-cross" size={40} color="#fff" />
              </LinearGradient>
            </View>
            <RankBadge rank={rank} size="small" showLabel={false} />
          </View>

          {/* Name & Title */}
          <Text style={styles.playerName}>{playerName}</Text>
          <Text style={[styles.rankTitle, { color: rankColor }]}>
            {RANK_TITLES[rank]}
          </Text>

          {/* Level & XP */}
          <View style={styles.levelSection}>
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>LEVEL</Text>
              <Text style={[styles.levelValue, { color: rankColor }]}>{level}</Text>
            </View>
            <View style={styles.xpBarOuter}>
              <View style={[styles.xpBarFill, { width: `${progress * 100}%` }]}>
                <LinearGradient
                  colors={GRADIENTS[`rank${rank}`] || GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.xpBarGradient}
                />
              </View>
            </View>
            <Text style={styles.xpText}>{xp} / {requiredXP} XP</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{totalWorkouts}</Text>
          <Text style={styles.quickStatLabel}>Workouts</Text>
        </View>
        <View style={[styles.quickStatDivider]} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{currentStreak}</Text>
          <Text style={styles.quickStatLabel}>Streak 🔥</Text>
        </View>
        <View style={[styles.quickStatDivider]} />
        <View style={styles.quickStat}>
          <Text style={styles.quickStatValue}>{bestStreak}</Text>
          <Text style={styles.quickStatLabel}>Best Streak</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <SystemPanel glowColor={COLORS.primary}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="chart-bar" size={18} color={COLORS.primary} />
          <Text style={styles.statsPanelTitle}>HUNTER STATS</Text>
        </View>

        <View style={styles.statsGrid}>
          {Object.entries(stats).map(([stat, value]) => (
            <View key={stat} style={styles.statItem}>
              <StatBar
                label={stat}
                value={value}
                maxValue={200}
                color={STAT_COLORS[stat]}
                level={getStatLevel(value)}
              />
              <Text style={styles.statDescription}>{STAT_DESCRIPTIONS[stat]}</Text>
            </View>
          ))}
        </View>
      </SystemPanel>

      {/* Notification Settings (Debug/Testing) */}
      <SystemPanel glowColor={COLORS.accent} style={{ marginTop: SPACING.lg }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="bell-cog" size={18} color={COLORS.accent} />
          <Text style={[styles.statsPanelTitle, { color: COLORS.accent }]}>SYSTEM NOTIFICATIONS</Text>
        </View>

        <View style={styles.notificationButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: COLORS.accent }]}
            onPress={async () => {
              await NotificationManager.scheduleTestNotification();
              Alert.alert("System Notification", "Test notification scheduled for 5 seconds from now.");
            }}
          >
            <MaterialCommunityIcons name="bell-ring" size={20} color={COLORS.accent} />
            <Text style={[styles.actionButtonText, { color: COLORS.accent }]}>Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { borderColor: COLORS.error }]}
            onPress={async () => {
              await NotificationManager.cancelAllNotifications();
              Alert.alert("System Notification", "All scheduled notifications have been cleared.");
            }}
          >
            <MaterialCommunityIcons name="bell-off" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Clear All Reminders</Text>
          </TouchableOpacity>
        </View>
      </SystemPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxxl,
  },
  headerGradient: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  avatarArea: {
    alignItems: 'center',
    marginBottom: SPACING.base,
    position: 'relative',
  },
  avatarGlow: {
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  rankTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  levelSection: {
    width: '100%',
    alignItems: 'center',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  levelLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  levelValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  xpBarOuter: {
    width: '100%',
    height: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  xpBarGradient: {
    flex: 1,
  },
  xpText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.base,
  },
  quickStat: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quickStatLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surfaceBorder,
  },
  statsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  statsPanelTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  statsGrid: {
    gap: SPACING.sm,
  },
  statItem: {
    marginBottom: SPACING.xs,
  },
  statDescription: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: -SPACING.xs,
    marginLeft: 2,
  },
  notificationButtons: {
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButtonText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
