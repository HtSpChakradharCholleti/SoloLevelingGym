import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Alert, Switch, AppState } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, STAT_COLORS, STAT_LABELS, STAT_DESCRIPTIONS, RANK_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import useShapeStyles from '../utils/useShapeStyles';
import { getRequiredXP, getLevelProgress, getStatLevel, getStatProgress, RANK_TITLES } from '../utils/leveling';
import SystemPanel from '../components/SystemPanel';
import StatBar from '../components/StatBar';
import RankBadge from '../components/RankBadge';
import NotificationManager from '../utils/NotificationManager';
import GeofenceManager from '../utils/GeofenceManager';
import { formatDistance } from '../utils/geo';
import WeightLogModal from '../components/WeightLogModal';
import { testOTAConnectivity, checkForOTAUpdate } from '../utils/otaDiagnostics';
import { HotUpdater } from '@hot-updater/react-native';
import XPRing from '../components/XPRing';
import StatRadarChart from '../components/StatRadarChart';
import {
  initializeHealthConnect,
  getHealthConnectStatus,
  getHealthPermissions,
  requestHealthPermissions,
  getTodaySteps,
  getTodayHeartRate,
  getTodaySleep,
  getTodayExercise,
  getTodayActiveCalories,
  DEFAULT_DAILY_STEP_TARGET,
  formatTimeAgo,
  formatTime,
  formatDurationHoursMinutes,
} from '../services/healthConnect';

const { width } = Dimensions.get('window');

export default function HunterProfileScreen() {
  const router = useRouter();
  const {
    playerName, level, xp, rank, stats,
    totalWorkouts, currentStreak, bestStreak, weightHistory, measurementsHistory,
    workoutHistory,
    settings, updateSetting,
    gymLocation, setGymLocation,
    activeWorkout,
  } = usePlayer();
  const styles = useShapeStyles(makeStyles);

  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [isHcExpanded, setIsHcExpanded] = useState(false);

  // Gym geofence state — current inside/outside + distance, updated on mount
  // and whenever the stored gym location changes.
  const [gymStatus, setGymStatus] = useState(null); // { inside, distanceMeters }
  const [isSettingGym, setIsSettingGym] = useState(false);

  const geofenceEnabled = settings?.geofenceEnabled ?? true;

  // Refresh inside/outside status for the stored gym.
  const refreshGymStatus = async () => {
    if (!gymLocation) {
      setGymStatus(null);
      return;
    }
    try {
      const state = await GeofenceManager.getInsideState(gymLocation);
      setGymStatus({ inside: state.inside, distanceMeters: state.distanceMeters });
    } catch (e) {
      setGymStatus(null);
    }
  };

  useEffect(() => {
    refreshGymStatus();
  }, [gymLocation]);

  /**
   * "Set my gym": request location permission, capture the current position
   * as the gym center (with a fixed radius), and persist it. The geofence
   * region is (re)armed by the effect in app/_layout.tsx reacting to
   * `gymLocation`.
   */
  const handleSetGym = async () => {
    if (isSettingGym) return;
    setIsSettingGym(true);
    try {
      const { foreground, background } = await GeofenceManager.requestPermissions();
      if (!foreground) {
        Alert.alert('Location Permission Needed', 'Allow location access to set your gym.');
        return;
      }
      const gym = await GeofenceManager.captureGymLocation(200);
      setGymLocation(gym);
      if (!background) {
        Alert.alert(
          'Gym Set 📍',
          'Background location wasn’t granted. The arrival alert only works while the app is running. Allow "Always" location in Settings for the full experience.'
        );
      } else {
        Alert.alert('Gym Set 📍', 'We’ll let you know when you get to the gym so you can start your warmup.');
      }
      refreshGymStatus();
    } catch (e) {
      console.warn('Failed to set gym location:', e?.message || e);
      Alert.alert('Couldn’t Set Gym', 'We couldn’t get an accurate location. Try again with GPS on.');
    } finally {
      setIsSettingGym(false);
    }
  };

  const handleClearGym = () => {
    Alert.alert('Clear Gym Location?', 'Arrival alerts will be turned off.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setGymLocation(null) },
    ]);
  };

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

  // ── Health Connect state ───────────────────────────────────────────────────
  const [hcStatus, setHcStatus] = useState('idle'); // idle | loading | ready | unavailable | error
  const [hcData, setHcData] = useState(null); // { steps, heartRate, sleep, exercise, calories }
  const [grantedPermissions, setGrantedPermissions] = useState([]);
  const inFlightRef = useRef(false);

  const hasPerm = useCallback((recordType) => {
    return grantedPermissions.some(p => p.recordType === recordType);
  }, [grantedPermissions]);

  const loadHcData = useCallback(async (silent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!silent) {
      setHcStatus('loading');
    }
    try {
      const [steps, heartRate, sleep, exercise, calories, granted] = await Promise.all([
        getTodaySteps(),
        getTodayHeartRate(),
        getTodaySleep(),
        getTodayExercise(),
        getTodayActiveCalories(),
        getHealthPermissions(),
      ]);
      setGrantedPermissions(granted ?? []);
      setHcData({ steps, heartRate, sleep, exercise, calories });
      setHcStatus('ready');
    } catch {
      if (!silent) {
        setHcStatus('error');
      }
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const handleConnectHealth = useCallback(async () => {
    setHcStatus('loading');
    try {
      const available = await initializeHealthConnect();
      if (!available) {
        setHcStatus('unavailable');
        return;
      }
      await requestHealthPermissions();
      const granted = await getHealthPermissions();
      setGrantedPermissions(granted ?? []);
      if (!granted || granted.length === 0) {
        setHcStatus('error');
        return;
      }
      await loadHcData();
    } catch {
      setHcStatus('error');
    }
  }, [loadHcData]);

  // Auto-load if already initialised (permissions previously granted)
  useEffect(() => {
    (async () => {
      const status = await getHealthConnectStatus();
      // SdkAvailabilityStatus.SDK_AVAILABLE = 3
      if (status === 3) {
        const granted = await getHealthPermissions();
        if (granted.length > 0) {
          setGrantedPermissions(granted);
          await initializeHealthConnect();
          await loadHcData();
        }
      }
    })();
  }, [loadHcData]);

  // Auto-refresh every 5 seconds while screen is active and app is in foreground
  useEffect(() => {
    if (hcStatus !== 'ready') return;

    let intervalId = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        loadHcData(true);
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (AppState.currentState === 'active') {
      startPolling();
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadHcData(true);
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [hcStatus, loadHcData]);

  const hasAnyHcData = useMemo(() => {
    if (!hcData) return false;
    return (
      hcData.steps?.count != null ||
      hcData.heartRate?.latest != null ||
      hcData.sleep?.totalMinutes != null ||
      hcData.exercise?.hasRecords ||
      hcData.calories?.calories != null
    );
  }, [hcData]);

  const summaryMetricsLine = useMemo(() => {
    if (!hcData) return '';
    const parts = [];
    if (hcData.steps?.count != null) {
      parts.push(`${hcData.steps.count.toLocaleString()} steps`);
    }
    if (hcData.exercise?.hasRecords && hcData.exercise.totalMinutes > 0) {
      parts.push(`${hcData.exercise.totalMinutes} active min`);
    }
    if (hcData.calories?.calories != null && hcData.calories.calories > 0) {
      parts.push(`${Math.round(hcData.calories.calories)} kcal`);
    }
    return parts.join(' • ');
  }, [hcData]);

  const sleepSummaryLine = useMemo(() => {
    if (!hcData?.sleep?.totalMinutes) return null;
    return `${formatDurationHoursMinutes(hcData.sleep.totalMinutes)} sleep`;
  }, [hcData]);

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
                onPress={() => router.push('/weight-history')}
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

      {/* ── Daily Status (Health Connect) ───────────────────────────── */}
      <SystemPanel glowColor={COLORS.info} style={styles.dailyStatusPanel}>
        <View style={styles.dailyStatusHeaderRow}>
          <View style={styles.dailyStatusTitleGroup}>
            <View style={styles.dailyStatusTitleLine}>
              <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.info} />
              <Text style={styles.dailyStatusHeading}>DAILY STATUS</Text>
            </View>
            <Text style={styles.dailyStatusSubHeading}>Synced with Health Connect</Text>
          </View>
          {hcStatus === 'ready' && (
            <TouchableOpacity onPress={() => loadHcData(true)} style={styles.dailyStatusRefreshBtn}>
              <MaterialCommunityIcons name="refresh" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {(hcStatus === 'idle' || hcStatus === 'unavailable' || hcStatus === 'error') && (
          <View style={styles.hcConnectRow}>
            {hcStatus === 'unavailable' && (
              <Text style={styles.hcStatusText}>Health Connect not available on this device.</Text>
            )}
            {hcStatus === 'error' && (
              <Text style={styles.hcStatusText}>Could not load health data. Check permissions.</Text>
            )}
            <TouchableOpacity style={styles.hcConnectBtn} onPress={handleConnectHealth}>
              <MaterialCommunityIcons name="link-variant" size={16} color={COLORS.background} />
              <Text style={styles.hcConnectBtnText}>Connect Health Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {hcStatus === 'loading' && (
          <Text style={styles.hcStatusText}>Loading health data…</Text>
        )}

        {hcStatus === 'ready' && hcData && (
          <View style={styles.dailyStatusBody}>
            {/* 1. Compact 2-column Grid (prioritized at-a-glance status) */}
            <View style={styles.compactGrid}>
              <View style={styles.compactRow}>
                {/* Steps */}
                <View style={styles.compactCell}>
                  <View style={styles.compactCellHeader}>
                    <MaterialCommunityIcons name="walk" size={16} color={COLORS.info} />
                    <Text style={styles.compactCellLabel}>STEPS</Text>
                  </View>
                  <Text style={styles.compactCellValue}>
                    {hcData.steps?.count != null ? hcData.steps.count.toLocaleString() : 'No data'}
                  </Text>
                  <Text style={styles.compactCellSub}>
                    {!hasPerm('Steps')
                      ? 'Permission needed'
                      : hcData.steps?.count != null
                      ? `${Math.round((hcData.steps.count / DEFAULT_DAILY_STEP_TARGET) * 100)}% target`
                      : 'No step data'}
                  </Text>
                </View>

                {/* Heart Rate */}
                <View style={styles.compactCell}>
                  <View style={styles.compactCellHeader}>
                    <MaterialCommunityIcons name="heart-pulse" size={16} color={COLORS.danger} />
                    <Text style={styles.compactCellLabel}>HEART RATE</Text>
                  </View>
                  <Text style={styles.compactCellValue}>
                    {hcData.heartRate?.latest != null ? `${hcData.heartRate.latest} bpm` : 'No reading'}
                  </Text>
                  <Text style={styles.compactCellSub}>
                    {!hasPerm('HeartRate')
                      ? 'Permission needed'
                      : hcData.heartRate?.latest != null
                      ? 'Latest HR'
                      : 'No recent reading'}
                  </Text>
                </View>
              </View>

              <View style={styles.compactRow}>
                {/* Sleep */}
                <View style={styles.compactCell}>
                  <View style={styles.compactCellHeader}>
                    <MaterialCommunityIcons name="moon-waning-crescent" size={16} color={COLORS.accent} />
                    <Text style={styles.compactCellLabel}>SLEEP</Text>
                  </View>
                  <Text style={styles.compactCellValue}>
                    {hcData.sleep?.totalMinutes != null
                      ? formatDurationHoursMinutes(hcData.sleep.totalMinutes)
                      : 'No data'}
                  </Text>
                  <Text style={styles.compactCellSub}>
                    {!hasPerm('SleepSession')
                      ? 'Permission needed'
                      : hcData.sleep?.totalMinutes != null
                      ? (hcData.sleep.sessionsCount > 1 ? `${hcData.sleep.sessionsCount} sessions` : 'Last night')
                      : 'No sleep data'}
                  </Text>
                </View>

                {/* Active Energy */}
                <View style={styles.compactCell}>
                  <View style={styles.compactCellHeader}>
                    <MaterialCommunityIcons name="fire" size={16} color={COLORS.warning} />
                    <Text style={styles.compactCellLabel}>ACTIVE</Text>
                  </View>
                  <Text style={styles.compactCellValue}>
                    {hcData.calories?.calories != null
                      ? `${Math.round(hcData.calories.calories)} kcal`
                      : 'No data'}
                  </Text>
                  <Text style={styles.compactCellSub}>
                    {!hasPerm('ActiveCaloriesBurned')
                      ? 'Permission needed'
                      : hcData.calories?.calories != null
                      ? 'Active energy'
                      : 'No active data'}
                  </Text>
                </View>
              </View>

              {/* Exercise Bar */}
              <View style={styles.compactExerciseBar}>
                <View style={styles.compactExerciseLeft}>
                  <MaterialCommunityIcons name="dumbbell" size={18} color={COLORS.success} />
                  <View style={styles.compactExerciseTextGroup}>
                    <Text style={styles.compactExerciseTitle}>
                      {!hasPerm('ExerciseSession')
                        ? 'Exercise permission required'
                        : hcData.exercise?.hasRecords
                        ? `${hcData.exercise.totalMinutes} min exercise`
                        : 'No workout recorded today'}
                    </Text>
                    <Text style={styles.compactExerciseSub}>
                      {hcData.exercise?.hasRecords
                        ? `${hcData.exercise.sessionsCount} workout${hcData.exercise.sessionsCount > 1 ? 's' : ''}${hcData.exercise.latest ? ` • ${hcData.exercise.latest.name}` : ''}`
                        : 'Tracked via Health Connect'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Expand / Collapse Details Toggle */}
            <TouchableOpacity
              style={styles.detailsToggleBtn}
              onPress={() => setIsHcExpanded(prev => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsToggleText}>
                {isHcExpanded ? 'COLLAPSE DETAILS' : 'VIEW DETAILS'}
              </Text>
              <MaterialCommunityIcons
                name={isHcExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.info}
              />
            </TouchableOpacity>

            {/* Progressive Detail: Expanded Cards */}
            {isHcExpanded && (
              <View style={styles.expandedCardsContainer}>
                {/* Steps Detail Card */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <View style={styles.metricCardTitleGroup}>
                      <MaterialCommunityIcons name="walk" size={18} color={COLORS.info} />
                      <Text style={styles.metricCardTitle}>STEPS</Text>
                    </View>
                    {hcData.steps?.lastUpdated ? (
                      <Text style={styles.metricFreshness}>
                        Updated • {formatTimeAgo(hcData.steps.lastUpdated)}
                      </Text>
                    ) : null}
                  </View>

                  {!hasPerm('Steps') ? (
                    <Text style={styles.permRequiredText}>Steps permission required</Text>
                  ) : hcData.steps?.count == null ? (
                    <Text style={styles.metricNoDataText}>No step data</Text>
                  ) : (
                    <View style={styles.metricCardBody}>
                      <View style={styles.metricMainRow}>
                        <Text style={styles.metricPrimaryNumber}>
                          {hcData.steps.count.toLocaleString()}
                        </Text>
                        <Text style={styles.metricTargetPercent}>
                          {Math.round((hcData.steps.count / DEFAULT_DAILY_STEP_TARGET) * 100)}% of 10k target
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(100, Math.round((hcData.steps.count / DEFAULT_DAILY_STEP_TARGET) * 100))}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.metricTargetRemaining,
                          hcData.steps.count >= DEFAULT_DAILY_STEP_TARGET && styles.metricTargetReached,
                        ]}
                      >
                        {hcData.steps.count >= DEFAULT_DAILY_STEP_TARGET
                          ? 'Daily target reached'
                          : `${(DEFAULT_DAILY_STEP_TARGET - hcData.steps.count).toLocaleString()} steps to target`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Heart Rate Detail Card */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <View style={styles.metricCardTitleGroup}>
                      <MaterialCommunityIcons name="heart-pulse" size={18} color={COLORS.danger} />
                      <Text style={styles.metricCardTitle}>HEART RATE</Text>
                    </View>
                    {hcData.heartRate?.latestTime ? (
                      <Text style={styles.metricFreshness}>
                        Last reading • {formatTimeAgo(hcData.heartRate.latestTime)}
                      </Text>
                    ) : null}
                  </View>

                  {!hasPerm('HeartRate') ? (
                    <Text style={styles.permRequiredText}>Heart rate permission required</Text>
                  ) : hcData.heartRate?.latest == null ? (
                    <Text style={styles.metricNoDataText}>No heart rate data</Text>
                  ) : (
                    <View style={styles.metricCardBody}>
                      <View style={styles.hrMainRow}>
                        <View style={styles.hrLatestGroup}>
                          <Text style={styles.metricSubLabel}>Latest</Text>
                          <Text style={styles.metricPrimaryNumber}>
                            {hcData.heartRate.latest} <Text style={styles.metricUnit}>bpm</Text>
                          </Text>
                        </View>
                        {hcData.heartRate.count > 1 ? (
                          <View style={styles.hrStatsGroup}>
                            <View style={styles.hrStatItem}>
                              <Text style={styles.metricSubLabel}>Today</Text>
                              <Text style={styles.metricSubValue}>
                                {hcData.heartRate.min}–{hcData.heartRate.max} bpm
                              </Text>
                            </View>
                            <View style={styles.hrStatItem}>
                              <Text style={styles.metricSubLabel}>Average</Text>
                              <Text style={styles.metricSubValue}>
                                {hcData.heartRate.avg} bpm
                              </Text>
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.metricSecondaryDetail}>Single reading recorded today</Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>

                {/* Sleep Detail Card */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <View style={styles.metricCardTitleGroup}>
                      <MaterialCommunityIcons name="moon-waning-crescent" size={18} color={COLORS.accent} />
                      <Text style={styles.metricCardTitle}>SLEEP</Text>
                    </View>
                    {hcData.sleep?.lastUpdated ? (
                      <Text style={styles.metricFreshness}>
                        Sleep synced • {formatTime(hcData.sleep.lastUpdated)}
                      </Text>
                    ) : null}
                  </View>

                  {!hasPerm('SleepSession') ? (
                    <Text style={styles.permRequiredText}>Sleep permission required</Text>
                  ) : hcData.sleep?.totalMinutes == null ? (
                    <Text style={styles.metricNoDataText}>No sleep data</Text>
                  ) : (
                    <View style={styles.metricCardBody}>
                      <Text style={styles.metricPrimaryNumber}>
                        {formatDurationHoursMinutes(hcData.sleep.totalMinutes)}
                      </Text>
                      <View style={styles.sleepSpanRow}>
                        {hcData.sleep.startTime && hcData.sleep.endTime ? (
                          <Text style={styles.sleepSpanText}>
                            {formatTime(hcData.sleep.startTime)} → {formatTime(hcData.sleep.endTime)}
                          </Text>
                        ) : null}
                        <Text style={styles.sleepSessionsCount}>
                          {hcData.sleep.sessionsCount} sleep session{hcData.sleep.sessionsCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                      {hcData.sleep.stages ? (
                        <View style={styles.sleepStagesRow}>
                          {hcData.sleep.stages.deepMin > 0 ? (
                            <Text style={styles.sleepStagePill}>Deep {formatDurationHoursMinutes(hcData.sleep.stages.deepMin)}</Text>
                          ) : null}
                          {hcData.sleep.stages.lightMin > 0 ? (
                            <Text style={styles.sleepStagePill}>Light {formatDurationHoursMinutes(hcData.sleep.stages.lightMin)}</Text>
                          ) : null}
                          {hcData.sleep.stages.remMin > 0 ? (
                            <Text style={styles.sleepStagePill}>REM {formatDurationHoursMinutes(hcData.sleep.stages.remMin)}</Text>
                          ) : null}
                          {hcData.sleep.stages.awakeMin > 0 ? (
                            <Text style={styles.sleepStagePill}>Awake {formatDurationHoursMinutes(hcData.sleep.stages.awakeMin)}</Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Exercise Detail Card */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <View style={styles.metricCardTitleGroup}>
                      <MaterialCommunityIcons name="dumbbell" size={18} color={COLORS.success} />
                      <Text style={styles.metricCardTitle}>EXERCISE</Text>
                    </View>
                    {hcData.exercise?.latest?.startTime ? (
                      <Text style={styles.metricFreshness}>
                        Latest • {formatTime(hcData.exercise.latest.startTime)}
                      </Text>
                    ) : null}
                  </View>

                  {!hasPerm('ExerciseSession') ? (
                    <Text style={styles.permRequiredText}>Exercise permission required</Text>
                  ) : !hcData.exercise?.hasRecords ? (
                    <Text style={styles.metricNoDataText}>No workout recorded today</Text>
                  ) : (
                    <View style={styles.metricCardBody}>
                      <View style={styles.exerciseTopRow}>
                        <Text style={styles.metricPrimaryNumber}>
                          {hcData.exercise.totalMinutes} min today
                        </Text>
                        <Text style={styles.exerciseSessionsBadge}>
                          {hcData.exercise.sessionsCount} workout{hcData.exercise.sessionsCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                      {hcData.exercise.latest ? (
                        <View style={styles.exerciseLatestCard}>
                          <Text style={styles.exerciseLatestName}>{hcData.exercise.latest.name}</Text>
                          <Text style={styles.exerciseLatestTime}>
                            {hcData.exercise.latest.durationMinutes} min • {formatTime(hcData.exercise.latest.startTime)} – {formatTime(hcData.exercise.latest.endTime)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>

                {/* Active Energy Detail Card */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <View style={styles.metricCardTitleGroup}>
                      <MaterialCommunityIcons name="fire" size={18} color={COLORS.warning} />
                      <Text style={styles.metricCardTitle}>ACTIVE ENERGY</Text>
                    </View>
                    {hcData.calories?.lastUpdated ? (
                      <Text style={styles.metricFreshness}>
                        Updated • {formatTimeAgo(hcData.calories.lastUpdated)}
                      </Text>
                    ) : null}
                  </View>

                  {!hasPerm('ActiveCaloriesBurned') ? (
                    <Text style={styles.permRequiredText}>Active calories permission required</Text>
                  ) : hcData.calories?.calories == null ? (
                    <Text style={styles.metricNoDataText}>No active energy data</Text>
                  ) : (
                    <View style={styles.metricCardBody}>
                      <Text style={styles.metricPrimaryNumber}>
                        {Math.round(hcData.calories.calories)} <Text style={styles.metricUnit}>kcal today</Text>
                      </Text>
                      <Text style={styles.metricSubLabel}>Movement & exercise</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </SystemPanel>

      {/* ── Primary Workout Action ────────────────────────────────────────── */}
      <View style={styles.primaryWorkoutContainer}>
        <TouchableOpacity
          style={styles.primaryWorkoutBtn}
          onPress={() => router.push(activeWorkout ? '/(tabs)/workout' : '/(tabs)/dungeons')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={activeWorkout ? [COLORS.danger, COLORS.accentDark] : [COLORS.accentDark, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryWorkoutGradient}
          >
            <MaterialCommunityIcons
              name={activeWorkout ? 'sword-cross' : 'gate'}
              size={24}
              color={COLORS.textPrimary}
            />
            <View style={styles.primaryWorkoutTextWrap}>
              <Text style={styles.primaryWorkoutTitle}>
                {activeWorkout ? 'CONTINUE WORKOUT' : 'START TODAY’S WORKOUT'}
              </Text>
              <Text style={styles.primaryWorkoutSubTitle}>
                {activeWorkout ? 'Workout in progress • Tap to resume' : 'Enter Dungeons & Level Up'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={COLORS.textPrimary}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Workout Time Stats */}
      <SystemPanel glowColor={COLORS.success} style={{ marginHorizontal: SPACING.base, marginTop: SPACING.sectionGap, marginBottom: SPACING.sectionGap }}>
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
            style={[styles.actionButton, { borderColor: COLORS.accent },
              !(settings?.notificationsEnabled ?? true) && { opacity: 0.5 }]}
            onPress={async () => {
              if (!(settings?.notificationsEnabled ?? true)) {
                Alert.alert("Notifications Disabled", "Enable notifications in Settings to test them.");
                return;
              }
              await NotificationManager.scheduleTestNotification();
              Alert.alert("System Notification", "Test notification scheduled for 5 seconds from now.");
            }}
          >
            <MaterialCommunityIcons name="bell-ring" size={20} color={COLORS.accent} />
            <Text style={[styles.actionButtonText, { color: COLORS.accent }]}>Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: COLORS.danger }]}
            onPress={async () => {
              await NotificationManager.cancelAllNotifications();
              Alert.alert("System Notification", "All scheduled notifications have been cleared.");
            }}
          >
            <MaterialCommunityIcons name="bell-off" size={20} color={COLORS.danger} />
            <Text style={[styles.actionButtonText, { color: COLORS.danger }]}>Clear All Reminders</Text>
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
              <MaterialCommunityIcons name="bell" size={20} color={COLORS.accent} />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingDesc}>Daily reminders & timer alerts</Text>
              </View>
            </View>
            <Switch
              value={settings?.notificationsEnabled ?? true}
              onValueChange={(val) => updateSetting('notificationsEnabled', val)}
              trackColor={{ false: COLORS.surfaceBorder, true: COLORS.accent + '80' }}
              thumbColor={settings?.notificationsEnabled ? COLORS.accent : COLORS.textMuted}
              ios_backgroundColor={COLORS.surfaceBorder}
            />
          </View>

          <View style={styles.settingDivider} />

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

          <View style={styles.settingDivider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="rectangle-outline" size={20} color={COLORS.accent} />
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Corners</Text>
                <Text style={styles.settingDesc}>Rounded or square card edges</Text>
              </View>
            </View>
            <View style={styles.unitToggle}>
              {[
                { mode: 'rounded', label: 'Rounded' },
                { mode: 'square', label: 'Square' },
              ].map(({ mode, label }) => {
                const active = (settings?.shapeMode ?? 'rounded') === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.unitBtn, active && styles.unitBtnActive]}
                    onPress={() => updateSetting('shapeMode', mode)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.unitBtnText, active && styles.unitBtnTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </SystemPanel>

      {/* ── Gym Location / Geofence Panel ──────────────────────────── */}
      <SystemPanel glowColor={COLORS.accent} style={{ marginTop: SPACING.lg }}>
        <View style={styles.statsPanelHeader}>
          <MaterialCommunityIcons name="map-marker-radius" size={18} color={COLORS.accent} />
          <Text style={[styles.statsPanelTitle, { color: COLORS.accent }]}>GYM LOCATION</Text>
        </View>

        <Text style={styles.gymPanelDesc}>
          Get an alert to start your warmup when you arrive at the gym.
        </Text>

        {gymLocation ? (
          <View>
            <View style={[styles.gymStatusCard, gymStatus?.inside && styles.gymStatusCardInside]}>
              <MaterialCommunityIcons
                name={gymStatus?.inside ? 'check-circle' : 'map-marker-distance'}
                size={22}
                color={gymStatus?.inside ? COLORS.success : COLORS.textMuted}
              />
              <View style={styles.gymStatusTextWrap}>
                <Text style={[styles.gymStatusLabel, { color: gymStatus?.inside ? COLORS.success : COLORS.textPrimary }]}>
                  {gymStatus ? (gymStatus.inside ? "You’re at the gym" : `Not at the gym`) : 'Gym saved'}
                </Text>
                <Text style={styles.gymStatusDesc}>
                  {gymStatus ? `~${formatDistance(gymStatus.distanceMeters)} from gym · ${Math.round(gymLocation.radius)}m radius` : 'Tap refresh below'}
                </Text>
              </View>
              <TouchableOpacity style={styles.gymRefreshBtn} onPress={refreshGymStatus} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} testID="gym-refresh">
                <MaterialCommunityIcons name="refresh" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.gymActionsRow}>
              <TouchableOpacity style={[styles.gymActionBtn, { borderColor: COLORS.textMuted }]} onPress={handleSetGym} disabled={isSettingGym}>
                <MaterialCommunityIcons name="crosshairs-gps" size={18} color={COLORS.textSecondary} />
                <Text style={[styles.gymActionBtnText, { color: COLORS.textSecondary }]}>Re-set</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gymActionBtn, { borderColor: COLORS.danger }]} onPress={handleClearGym}>
                <MaterialCommunityIcons name="delete" size={18} color={COLORS.danger} />
                <Text style={[styles.gymActionBtnText, { color: COLORS.danger }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: COLORS.accent }, isSettingGym && { opacity: 0.5 }]}
            onPress={handleSetGym}
            testID="gym-set-button"
          >
            <MaterialCommunityIcons name={isSettingGym ? 'radar' : 'crosshairs-gps'} size={20} color={COLORS.accent} />
            <Text style={[styles.actionButtonText, { color: COLORS.accent }]}>
              {isSettingGym ? 'Setting gym…' : 'Set my gym'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={[styles.settingDivider, { marginVertical: SPACING.sm }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color={COLORS.accent} />
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Gym Arrival Alerts</Text>
              <Text style={styles.settingDesc}>Notify when you enter the gym radius</Text>
            </View>
          </View>
          <Switch
            value={geofenceEnabled}
            onValueChange={(val) => updateSetting('geofenceEnabled', val)}
            trackColor={{ false: COLORS.surfaceBorder, true: COLORS.accent + '80' }}
            thumbColor={geofenceEnabled ? COLORS.accent : COLORS.textMuted}
            ios_backgroundColor={COLORS.surfaceBorder}
          />
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

const makeStyles = () => StyleSheet.create({
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

  // Gym location / geofence panel
  gymPanelDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  gymStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  gymStatusCardInside: {
    borderColor: COLORS.success + '66',
    backgroundColor: COLORS.success + '14',
  },
  gymStatusTextWrap: {
    flex: 1,
  },
  gymStatusLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  gymStatusDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  gymRefreshBtn: {
    padding: 4,
  },
  gymActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  gymActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  gymActionBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
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

  // ── Daily Status (Health Connect) ──────────────────────────────────────────
  dailyStatusPanel: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
  },
  dailyStatusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  dailyStatusTitleGroup: {
    flex: 1,
  },
  dailyStatusTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dailyStatusHeading: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.info,
    letterSpacing: 1.5,
  },
  dailyStatusSubHeading: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  dailyStatusRefreshBtn: {
    padding: SPACING.xs,
  },
  dailyStatusBody: {
    gap: SPACING.md,
  },
  compactGrid: {
    gap: SPACING.sm,
  },
  compactRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  compactCell: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'space-between',
  },
  compactCellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  compactCellLabel: {
    fontFamily: FONTS.headingMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  compactCellValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  compactCellSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  compactExerciseBar: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  compactExerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  compactExerciseTextGroup: {
    flex: 1,
  },
  compactExerciseTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  compactExerciseSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  detailsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  detailsToggleText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
    letterSpacing: 1,
  },
  expandedCardsContainer: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  primaryWorkoutContainer: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    marginBottom: SPACING.xs,
  },
  primaryWorkoutBtn: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  primaryWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  primaryWorkoutTextWrap: {
    flex: 1,
  },
  primaryWorkoutTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  primaryWorkoutSubTitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryBanner: {
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  summaryTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.info,
  },
  summaryTag: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryPrimaryLine: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  summarySecondaryLine: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  overviewSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  overviewHeaderLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewItemValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  overviewItemLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  overviewSep: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.surfaceBorder,
  },
  cardsColumn: {
    gap: SPACING.md,
  },
  metricCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  metricCardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metricCardTitle: {
    fontFamily: FONTS.headingMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metricFreshness: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  metricCardBody: {
    gap: SPACING.xs,
  },
  metricMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  metricPrimaryNumber: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metricUnit: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  metricTargetPercent: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.info,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginVertical: SPACING.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: BORDER_RADIUS.sm,
  },
  metricTargetRemaining: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  metricTargetReached: {
    color: COLORS.success,
    fontFamily: FONTS.bodySemiBold,
  },
  hrMainRow: {
    gap: SPACING.xs,
  },
  hrLatestGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  hrStatsGroup: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginTop: SPACING.xs,
  },
  hrStatItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  metricSubLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  metricSubValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  metricSecondaryDetail: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  sleepSpanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  sleepSpanText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  sleepSessionsCount: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  sleepStagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sleepStagePill: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  exerciseSessionsBadge: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  exerciseLatestCard: {
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  exerciseLatestName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  exerciseLatestTime: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  permRequiredText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    paddingVertical: SPACING.xs,
  },
  metricNoDataText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    paddingVertical: SPACING.xs,
  },
  hcConnectRow: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
  },
  hcStatusText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  hcConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.info,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  hcConnectBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});
