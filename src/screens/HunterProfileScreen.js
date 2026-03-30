import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, STAT_LABELS, STAT_DESCRIPTIONS, RANK_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import { getRequiredXP, getLevelProgress, getStatLevel, getStatProgress, RANK_TITLES } from '../utils/leveling';
import SystemPanel from '../components/SystemPanel';
import StatBar from '../components/StatBar';
import RankBadge from '../components/RankBadge';
import NotificationManager from '../utils/NotificationManager';
import WeightLogModal from '../components/WeightLogModal';

const { width } = Dimensions.get('window');

export default function HunterProfileScreen({ navigation }) {
  const {
    playerName, level, xp, rank, stats,
    totalWorkouts, currentStreak, bestStreak, weightHistory,
    settings, updateSetting,
  } = usePlayer();

  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);

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

            {/* Weight Actions */}
            <View style={styles.weightActionsRow}>
              <TouchableOpacity
                style={styles.weightLogBtn}
                onPress={() => setIsWeightModalVisible(true)}
              >
                <LinearGradient
                  colors={[COLORS.accentDark, COLORS.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.weightLogGradient}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                  <Text style={styles.weightLogText}>LOG TODAY</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.weightHistoryBtn}
                onPress={() => navigation.navigate('WeightHistory')}
              >
                <View style={styles.weightHistoryBtnInner}>
                  <MaterialCommunityIcons name="history" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.weightHistoryBtnText}>HISTORY</Text>
                </View>
              </TouchableOpacity>
            </View>
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

      {/* Daily Weight Tracker */}
      <SystemPanel glowColor={COLORS.accent} style={{ marginBottom: SPACING.base }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="scale-bathroom" size={18} color={COLORS.accent} />
          <Text style={[styles.statsPanelTitle, { color: COLORS.accent }]}>DAILY WEIGHT</Text>
        </View>

        <View style={styles.weightCard}>
          <View style={styles.weightInfoPrimary}>
            {weightHistory.length > 0 ? (
              <>
                <Text style={styles.weightValueLarge}>
                  {weightHistory[0].weight} <Text style={styles.weightUnit}>{weightHistory[0].unit}</Text>
                </Text>
                <Text style={styles.weightDateLabel}>
                  Last logged: {weightHistory[0].date}
                </Text>
              </>
            ) : (
              <Text style={styles.weightDateLabel}>No weight logged yet</Text>
            )}
          </View>
          {/* The logWeightBtn was moved to the header section */}
        </View>

        {weightHistory.length > 1 && (
          <View style={styles.weightHistoryMini}>
            <Text style={styles.historyMiniTitle}>Recent Logs</Text>
            {weightHistory.slice(1, 4).map((entry, idx) => (
              <View key={idx} style={styles.historyMiniRow}>
                <Text style={styles.historyMiniDate}>{entry.date}</Text>
                <Text style={styles.historyMiniValue}>
                  {entry.weight} {entry.unit}
                </Text>
              </View>
            ))}
          </View>
        )}
      </SystemPanel>

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

      {/* Settings */}
      <SystemPanel glowColor={COLORS.textMuted} style={{ marginTop: SPACING.lg }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="cog" size={18} color={COLORS.textSecondary} />
          <Text style={[styles.statsPanelTitle, { color: COLORS.textSecondary }]}>SETTINGS</Text>
        </View>

        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="animation-play" size={20} color={COLORS.accent} />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Animations</Text>
                <Text style={styles.settingDesc}>UI transition effects</Text>
              </View>
            </View>
            <Switch
              value={settings?.animationsEnabled ?? true}
              onValueChange={(val) => updateSetting('animationsEnabled', val)}
              trackColor={{ false: COLORS.surfaceBorder, true: COLORS.accent + '80' }}
              thumbColor={settings?.animationsEnabled ? COLORS.accent : COLORS.textMuted}
              ios_backgroundColor={COLORS.surfaceBorder}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="music" size={20} color={COLORS.accent} />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Background Music</Text>
                <Text style={styles.settingDesc}>Ambient BGM during use</Text>
              </View>
            </View>
            <Switch
              value={settings?.bgmEnabled ?? true}
              onValueChange={(val) => updateSetting('bgmEnabled', val)}
              trackColor={{ false: COLORS.surfaceBorder, true: COLORS.accent + '80' }}
              thumbColor={settings?.bgmEnabled ? COLORS.accent : COLORS.textMuted}
              ios_backgroundColor={COLORS.surfaceBorder}
            />
          </View>
        </View>
      </SystemPanel>

      <WeightLogModal 
        visible={isWeightModalVisible} 
        onClose={() => setIsWeightModalVisible(false)} 
      />
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
    marginBottom: SPACING.md, // Added margin to separate from new buttons
  },
  weightActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  weightLogBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  weightLogGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  weightLogText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  weightHistoryBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  weightHistoryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  weightHistoryBtnText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
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

  // Settings
  settingsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  settingDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: SPACING.base,
  },

  // Weight Log Styles
  weightCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.base,
  },
  weightInfoPrimary: {
    flex: 1,
  },
  weightValueLarge: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  weightUnit: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },
  weightDateLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Removed old logWeightBtn style as it's replaced by weightLogBtn
  weightHistoryMini: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  historyMiniTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  historyMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  historyMiniDate: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  historyMiniValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
});
