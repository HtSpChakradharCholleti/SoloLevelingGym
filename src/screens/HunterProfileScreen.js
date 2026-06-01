import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Alert, Switch } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
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
import { testOTAConnectivity, checkForOTAUpdate } from '../utils/otaDiagnostics';
import { HotUpdater } from '@hot-updater/react-native';
import XPRing from '../components/XPRing';
import StatRadarChart from '../components/StatRadarChart';

const { width } = Dimensions.get('window');

export default function HunterProfileScreen({ navigation }) {
  const {
    playerName, level, xp, rank, stats,
    totalWorkouts, currentStreak, bestStreak, weightHistory, measurementsHistory,
    workoutHistory,
    settings, updateSetting,
  } = usePlayer();

  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);

  // OTA state machine: idle | testing | checking | downloading | success | up_to_date | error
  const [otaStatus, setOtaStatus] = useState('idle');
  const [otaLatency, setOtaLatency] = useState(null);
  const [updateProgress, setUpdateProgress] = useState(0);

  const handleTestOTA = async () => {
    setOtaStatus('testing');
    setOtaLatency(null);
    try {
      const result = await testOTAConnectivity();
      if (result.isReachable) {
        setOtaLatency(result.latencyMs);
        setOtaStatus('success');
      } else {
        setOtaStatus('error');
        Alert.alert(
          'Connection Failed',
          `${result.hasInternet ? 'Internet OK but OTA server unreachable' : 'No internet connection'}\n\n${result.error}`,
        );
      }
    } catch (error) {
      setOtaStatus('error');
    }
    // Auto-reset to idle after 4s
    setTimeout(() => setOtaStatus(s => (s === 'success' || s === 'error') ? 'idle' : s), 4000);
  };

  const handleCheckUpdate = async () => {
    setOtaStatus('checking');
    setUpdateProgress(0);
    try {
      const result = await checkForOTAUpdate((progress) => {
        setOtaStatus('downloading');
        setUpdateProgress(progress);
      });

      if (result.status === 'UP_TO_DATE') {
        setOtaStatus('up_to_date');
        setTimeout(() => setOtaStatus('idle'), 3000);
      } else if (result.status === 'ERROR') {
        setOtaStatus('error');
        Alert.alert('Update Failed', result.message);
        setTimeout(() => setOtaStatus('idle'), 3000);
      }
      // 'UPDATED' case triggers reload via checkForOTAUpdate
    } catch (error) {
      setOtaStatus('error');
      setTimeout(() => setOtaStatus('idle'), 3000);
    }
  };

  const requiredXP = getRequiredXP(level);
  const progress = getLevelProgress(level, xp);
  const rankColor = RANK_COLORS[rank] || COLORS.primary;

  // XP bar fill animation — ease-out-cubic for smooth decel with no overshoot
  const xpFillProgress = useSharedValue(0);
  useEffect(() => {
    xpFillProgress.value = withDelay(
      300,
      withTiming(progress, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [progress]);
  const xpBarAnimStyle = useAnimatedStyle(() => ({
    width: `${xpFillProgress.value * 100}%`,
  }));

  // ── Workout time stats ──────────────────────────────────────────────────
  const { todayTimeStr, avgTimeStr } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const history = workoutHistory || [];

    // Today's total duration (ms)
    const todayMs = history
      .filter(w => w.date === today)
      .reduce((sum, w) => sum + (w.duration || 0), 0);

    // Average duration across all workout entries
    const totalMs = history.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgMs = history.length > 0 ? totalMs / history.length : 0;

    const fmtDur = (ms) => {
      const mins = Math.round(ms / 60000);
      if (mins === 0) return '0m';
      if (mins < 60) return `${mins}m`;
      const h = Math.floor(mins / 60);
      return `${h}h ${mins % 60}m`;
    };

    return {
      todayTimeStr: fmtDur(todayMs),
      avgTimeStr: fmtDur(avgMs),
    };
  }, [workoutHistory]);

  /** Returns the status dot color based on OTA state */
  const getOtaDotColor = () => {
    switch (otaStatus) {
      case 'success': case 'up_to_date': return COLORS.success;
      case 'error': return COLORS.danger;
      case 'testing': case 'checking': case 'downloading': return COLORS.warning;
      default: return COLORS.textMuted;
    }
  };

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
            <XPRing progress={progress} rankColor={rankColor} size={100} style={{ marginBottom: SPACING.sm }}>
              <LinearGradient
                colors={GRADIENTS[`rank${rank}`] || GRADIENTS.rankE}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="sword-cross" size={40} color="#fff" />
              </LinearGradient>
            </XPRing>
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
              <Animated.View style={[styles.xpBarFill, xpBarAnimStyle]}>
                <LinearGradient
                  colors={GRADIENTS[`rank${rank}`] || GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.xpBarGradient}
                />
              </Animated.View>
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

      {/* Workout Time Stats */}
      <SystemPanel glowColor={COLORS.success} style={{ marginHorizontal: SPACING.base, marginBottom: SPACING.base }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.success} />
          <Text style={[styles.statsPanelTitle, { color: COLORS.success }]}>WORKOUT TIME</Text>
        </View>
        <View style={styles.workoutTimeRow}>
          <View style={styles.workoutTimeStat}>
            <Text style={styles.workoutTimeValue}>{todayTimeStr}</Text>
            <Text style={styles.workoutTimeLabel}>Today</Text>
          </View>
          <View style={styles.workoutTimeDivider} />
          <View style={styles.workoutTimeStat}>
            <Text style={styles.workoutTimeValue}>{avgTimeStr}</Text>
            <Text style={styles.workoutTimeLabel}>Average</Text>
          </View>
        </View>
      </SystemPanel>

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

      {/* Body Measurements Panel */}
      <SystemPanel glowColor={COLORS.primary} style={{ marginBottom: SPACING.base }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="tape-measure" size={18} color={COLORS.primary} />
          <Text style={styles.statsPanelTitle}>BODY MEASUREMENTS</Text>
        </View>

        {(() => {
          const METRICS = [
            { key: 'bicep', label: 'Bicep', icon: 'arm-flex', color: '#7c91ff' },
            { key: 'chest', label: 'Chest', icon: 'human-handsup', color: '#ff7c7c' },
            { key: 'belly', label: 'Belly', icon: 'human', color: '#7cffb8' },
          ];
          const latest = (measurementsHistory || [])[0];
          return (
            <View style={styles.measurementsRow}>
              {METRICS.map(({ key, label, icon, color }) => {
                const val = latest?.[key];
                return (
                  <View key={key} style={[styles.measurementChip, { borderColor: color + '40' }]}>
                    <MaterialCommunityIcons name={icon} size={16} color={color} />
                    <Text style={[styles.measurementChipLabel, { color }]}>{label}</Text>
                    <Text style={styles.measurementChipValue}>
                      {val !== undefined ? `${val} cm` : '–'}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })()}

        {(measurementsHistory || []).length > 0 && (
          <Text style={styles.measurementDate}>
            Last logged: {measurementsHistory[0].date}
          </Text>
        )}
      </SystemPanel>

      {/* Stats Grid */}
      <SystemPanel glowColor={COLORS.primary}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="chart-bar" size={18} color={COLORS.primary} />
          <Text style={styles.statsPanelTitle}>HUNTER STATS</Text>
        </View>

        {/* Dynamic Skia Spider/Radar Chart */}
        <StatRadarChart stats={stats} maxValue={200} />

        <View style={styles.statsGrid}>
          {Object.entries(stats).map(([stat, value], i) => (
            <View key={stat} style={styles.statItem}>
              <StatBar
                label={stat}
                value={value}
                maxValue={200}
                color={STAT_COLORS[stat]}
                level={getStatLevel(value)}
                index={i}
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

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="vibrate" size={20} color={COLORS.accent} />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingDesc}>Vibration during timers & alerts</Text>
              </View>
            </View>
            <Switch
              value={settings?.hapticsEnabled ?? true}
              onValueChange={(val) => updateSetting('hapticsEnabled', val)}
              trackColor={{ false: COLORS.surfaceBorder, true: COLORS.accent + '80' }}
              thumbColor={settings?.hapticsEnabled ? COLORS.accent : COLORS.textMuted}
              ios_backgroundColor={COLORS.surfaceBorder}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color={COLORS.accent} />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Weight Unit</Text>
                <Text style={styles.settingDesc}>Used during workout logging</Text>
              </View>
            </View>
            <View style={styles.unitToggle}>
              {['kg', 'lbs'].map((unit) => {
                const active = (settings?.weightUnit || 'kg') === unit;
                return (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitBtn, active && styles.unitBtnActive]}
                    onPress={() => updateSetting('weightUnit', unit)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.unitBtnText, active && styles.unitBtnTextActive]}>{unit}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </SystemPanel>

      {/* ── System Updates Panel ─────────────────────────────────── */}
      <SystemPanel glowColor="#6b3fa0" style={{ marginTop: SPACING.lg }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="cloud-sync" size={18} color="#9b6fd4" />
          <Text style={[styles.statsPanelTitle, { color: '#9b6fd4' }]}>SYSTEM UPDATES</Text>
        </View>

        {/* Status Card */}
        <View style={styles.otaStatusCard}>
          {/* Connection Status Row */}
          <View style={styles.otaStatusRow}>
            <View style={[styles.otaStatusDot, { backgroundColor: getOtaDotColor() }]} />
            <Text style={styles.otaStatusLabel}>
              {otaStatus === 'idle' && 'Ready to check'}
              {otaStatus === 'testing' && 'Testing connection…'}
              {otaStatus === 'checking' && 'Checking for updates…'}
              {otaStatus === 'downloading' && `Downloading… ${Math.round(updateProgress * 100)}%`}
              {otaStatus === 'success' && 'Connected'}
              {otaStatus === 'up_to_date' && 'Up to date'}
              {otaStatus === 'error' && 'Connection failed'}
            </Text>
            {otaLatency !== null && otaStatus === 'success' && (
              <Text style={styles.otaLatencyBadge}>{otaLatency}ms</Text>
            )}
          </View>

          {/* Progress Bar (visible during download) */}
          {otaStatus === 'downloading' && (
            <View style={styles.otaProgressOuter}>
              <View style={[styles.otaProgressFill, { width: `${updateProgress * 100}%` }]} />
            </View>
          )}

          {/* Bundle Info */}
          <View style={styles.otaBundleInfo}>
            <View style={styles.otaBundleItem}>
              <Text style={styles.otaBundleKey}>VERSION</Text>
              <Text style={styles.otaBundleVal}>{HotUpdater.getAppVersion() || '—'}</Text>
            </View>
            <View style={styles.otaBundleSep} />
            <View style={styles.otaBundleItem}>
              <Text style={styles.otaBundleKey}>BUNDLE</Text>
              <Text style={styles.otaBundleVal} numberOfLines={1}>
                {HotUpdater.getBundleId()?.slice(0, 8) || 'base'}
              </Text>
            </View>
            <View style={styles.otaBundleSep} />
            <View style={styles.otaBundleItem}>
              <Text style={styles.otaBundleKey}>CHANNEL</Text>
              <Text style={styles.otaBundleVal}>{HotUpdater.getChannel() || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.otaActions}>
          <TouchableOpacity
            style={[styles.otaBtn, styles.otaBtnSecondary]}
            onPress={handleTestOTA}
            disabled={otaStatus === 'testing' || otaStatus === 'checking' || otaStatus === 'downloading'}
          >
            <MaterialCommunityIcons
              name={otaStatus === 'testing' ? 'loading' : 'wifi-check'}
              size={18}
              color={COLORS.accent}
            />
            <Text style={styles.otaBtnTextSecondary}>
              {otaStatus === 'testing' ? 'Testing…' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.otaBtn, styles.otaBtnPrimary]}
            onPress={handleCheckUpdate}
            disabled={otaStatus === 'testing' || otaStatus === 'checking' || otaStatus === 'downloading'}
          >
            <MaterialCommunityIcons
              name={otaStatus === 'checking' ? 'loading' : otaStatus === 'downloading' ? 'download' : 'update'}
              size={18}
              color="#040405"
            />
            <Text style={styles.otaBtnTextPrimary}>
              {otaStatus === 'checking' ? 'Checking…' : otaStatus === 'downloading' ? 'Downloading…' : 'Check for Updates'}
            </Text>
          </TouchableOpacity>
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

  // Workout Time Stats
  workoutTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.lg,
  },
  workoutTimeStat: {
    flex: 1,
    alignItems: 'center',
  },
  workoutTimeValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  workoutTimeLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  workoutTimeDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: SPACING.md,
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
  unitToggle: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
  },
  unitBtnActive: {
    backgroundColor: COLORS.accent,
  },
  unitBtnText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  unitBtnTextActive: {
    color: COLORS.background,
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

  // Body Measurements Panel
  measurementsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  measurementChip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 3,
  },
  measurementChipLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  measurementChipValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  measurementDate: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },

  // ── System Updates Panel ──────────────────────────
  otaStatusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  otaStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  otaStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  otaStatusLabel: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  otaLatencyBadge: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    backgroundColor: COLORS.successGlow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  otaProgressOuter: {
    height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  otaProgressFill: {
    height: '100%',
    backgroundColor: '#9b6fd4',
    borderRadius: 2,
  },
  otaBundleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  otaBundleItem: {
    flex: 1,
    alignItems: 'center',
  },
  otaBundleKey: {
    fontFamily: FONTS.heading,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  otaBundleVal: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  otaBundleSep: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.surfaceBorder,
  },
  otaActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  otaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  otaBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.accent + '50',
  },
  otaBtnPrimary: {
    backgroundColor: COLORS.accent,
  },
  otaBtnTextSecondary: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    letterSpacing: 1,
    fontWeight: '700',
  },
  otaBtnTextPrimary: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    color: '#040405',
    letterSpacing: 1,
    fontWeight: '700',
  },
});
