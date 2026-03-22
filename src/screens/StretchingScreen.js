import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { STRETCH_DAYS, getStretchesForDay, getTotalTimeForDay } from '../data/stretches';
import SystemPanel from '../components/SystemPanel';
import SoundManager from '../utils/SoundManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_SIZE = SCREEN_WIDTH * 0.55;
const CIRCLE_STROKE = 6;

const REST_BETWEEN_STRETCHES = 5; // seconds

export default function StretchingScreen({ navigation }) {
  const [selectedDay, setSelectedDay] = useState('push');
  const [selectedStretchIds, setSelectedStretchIds] = useState(new Set());
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStretchIndex, setCurrentStretchIndex] = useState(0);
  const [currentSide, setCurrentSide] = useState(null); // null, 'left', 'right'
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);

  const timerRef = useRef(null);
  const allStretches = getStretchesForDay(selectedDay);

  // Active session stretches (only selected ones)
  const [sessionStretches, setSessionStretches] = useState([]);

  // Initialize selection when day changes
  useEffect(() => {
    const stretches = getStretchesForDay(selectedDay);
    setSelectedStretchIds(new Set(stretches.map((s) => s.id)));
  }, [selectedDay]);

  // Animated values
  const pulseScale = useSharedValue(1);

  // Pulse animation for active timer
  useEffect(() => {
    if (isTimerActive && !isPaused) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isTimerActive, isPaused]);

  // Timer logic
  useEffect(() => {
    if (isTimerActive && !isPaused && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRinging(true);
            SoundManager.playTimerCompleteLoop();
            return 0;
          }
          // Tick sound at 3, 2, 1
          if (prev <= 4 && prev > 1) {
            SoundManager.playTimerTick();
            Vibration.vibrate(100);
          }
          return prev - 1;
        });
        setTotalTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, isPaused, timeRemaining, currentStretchIndex, currentSide, isResting]);

  const handleTimerComplete = useCallback(() => {
    Vibration.vibrate(300);
    const currentStretch = sessionStretches[currentStretchIndex];

    if (isResting) {
      // Rest is done, start next stretch
      setIsResting(false);
      const nextStretch = sessionStretches[currentStretchIndex];
      if (nextStretch.sides) {
        setCurrentSide('left');
      } else {
        setCurrentSide(null);
      }
      setTimeRemaining(nextStretch.duration);
      return;
    }

    // Check if bilateral and need to do right side
    if (currentStretch.sides && currentSide === 'left') {
      setCurrentSide('right');
      setTimeRemaining(currentStretch.duration);
      return;
    }

    // Move to next stretch
    const nextIndex = currentStretchIndex + 1;
    if (nextIndex >= sessionStretches.length) {
      // All done!
      setIsTimerActive(false);
      setIsComplete(true);
      SoundManager.playTimerComplete();
      Vibration.vibrate([0, 200, 100, 200, 100, 400]);
      return;
    }

    // Start rest period before next stretch
    setCurrentStretchIndex(nextIndex);
    setIsResting(true);
    setCurrentSide(null);
    setTimeRemaining(REST_BETWEEN_STRETCHES);
  }, [currentStretchIndex, currentSide, isResting, sessionStretches]);

  const dismissAlarm = () => {
    setIsRinging(false);
    SoundManager.stopTimerComplete();
    handleTimerComplete();
  };

  // ─── Selection helpers ──────────────────
  const toggleStretchSelection = (stretchId) => {
    setSelectedStretchIds((prev) => {
      const next = new Set(prev);
      if (next.has(stretchId)) {
        next.delete(stretchId);
      } else {
        next.add(stretchId);
      }
      return next;
    });
    SoundManager.playTap();
  };

  const selectAll = () => {
    setSelectedStretchIds(new Set(allStretches.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedStretchIds(new Set());
  };

  // ─── Session control ────────────────────
  const startSession = () => {
    const selected = allStretches.filter((s) => selectedStretchIds.has(s.id));
    if (selected.length === 0) return;
    setSessionStretches(selected);
    setCurrentStretchIndex(0);
    setIsComplete(false);
    setTotalTimeElapsed(0);
    const firstStretch = selected[0];
    if (firstStretch.sides) {
      setCurrentSide('left');
    } else {
      setCurrentSide(null);
    }
    setTimeRemaining(firstStretch.duration);
    setIsResting(false);
    setIsPaused(false);
    setIsRinging(false);
    setIsTimerActive(true);
    SoundManager.stopTimerComplete();
    SoundManager.playTap();
  };

  // Start a single stretch directly
  const startSingleStretch = (stretch) => {
    setSessionStretches([stretch]);
    setCurrentStretchIndex(0);
    setIsComplete(false);
    setTotalTimeElapsed(0);
    if (stretch.sides) {
      setCurrentSide('left');
    } else {
      setCurrentSide(null);
    }
    setTimeRemaining(stretch.duration);
    setIsResting(false);
    setIsPaused(false);
    setIsRinging(false);
    setIsTimerActive(true);
    SoundManager.stopTimerComplete();
    SoundManager.playTap();
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    SoundManager.playTap();
  };

  const skipStretch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRinging(false);
    SoundManager.stopTimerComplete();

    if (isResting) {
      setIsResting(false);
      const nextStretch = sessionStretches[currentStretchIndex];
      if (nextStretch.sides) {
        setCurrentSide('left');
      } else {
        setCurrentSide(null);
      }
      setTimeRemaining(nextStretch.duration);
      return;
    }

    const currentStretch = sessionStretches[currentStretchIndex];
    if (currentStretch.sides && currentSide === 'left') {
      setCurrentSide('right');
      setTimeRemaining(currentStretch.duration);
      return;
    }

    const nextIndex = currentStretchIndex + 1;
    if (nextIndex >= sessionStretches.length) {
      setIsTimerActive(false);
      setIsComplete(true);
      SoundManager.playTimerComplete();
      return;
    }

    setCurrentStretchIndex(nextIndex);
    setIsResting(true);
    setCurrentSide(null);
    setTimeRemaining(REST_BETWEEN_STRETCHES);
  };

  const stopSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRinging(false);
    SoundManager.stopTimerComplete();
    setIsTimerActive(false);
    setIsPaused(false);
    setCurrentStretchIndex(0);
    setCurrentSide(null);
    setIsResting(false);
    setTimeRemaining(0);
  };

  const resetSession = () => {
    setIsComplete(false);
    setTotalTimeElapsed(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate selected total time
  const getSelectedTotalTime = () => {
    return allStretches
      .filter((s) => selectedStretchIds.has(s.id))
      .reduce((total, s) => total + (s.sides ? s.duration * 2 : s.duration), 0);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // ─── COMPLETION VIEW ────────────────────
  if (isComplete) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.completionContent}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.completionCard}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={styles.completionGradient}
            >
              <View style={styles.completionIconWrap}>
                <MaterialCommunityIcons name="check-decagram" size={60} color={COLORS.success} />
              </View>
              <Text style={styles.completionTitle}>SESSION COMPLETE</Text>
              <Text style={styles.completionSubtitle}>
                {STRETCH_DAYS.find((d) => d.id === selectedDay)?.label} Stretches
              </Text>

              <View style={styles.completionStats}>
                <View style={styles.completionStatItem}>
                  <Text style={styles.completionStatValue}>{formatTime(totalTimeElapsed)}</Text>
                  <Text style={styles.completionStatLabel}>Time Stretched</Text>
                </View>
                <View style={styles.completionDivider} />
                <View style={styles.completionStatItem}>
                  <Text style={styles.completionStatValue}>{sessionStretches.length}</Text>
                  <Text style={styles.completionStatLabel}>Stretches Done</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.restartButton} onPress={resetSession}>
                <LinearGradient
                  colors={[COLORS.accentDark, COLORS.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.restartGradient}
                >
                  <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
                  <Text style={styles.restartText}>START AGAIN</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backText}>Back to Dungeons</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ─── ACTIVE TIMER VIEW ──────────────────
  if (isTimerActive) {
    const currentStretch = sessionStretches[currentStretchIndex];
    const sideLabel =
      currentSide === 'left' ? '← LEFT SIDE' : currentSide === 'right' ? 'RIGHT SIDE →' : null;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.timerContent}>
          {/* Progress indicator */}
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.progressIndicator}>
              <Text style={styles.progressText}>
                {isResting
                  ? 'REST'
                  : `STRETCH ${currentStretchIndex + 1} OF ${sessionStretches.length}`}
              </Text>
              <View style={styles.progressDots}>
                {sessionStretches.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      i < currentStretchIndex && styles.progressDotDone,
                      i === currentStretchIndex && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Timer Circle */}
          <Animated.View style={[styles.timerCircleWrap, pulseStyle]}>
            <View style={styles.timerCircle}>
              {/* Background ring */}
              <View style={styles.svgContainer}>
                <View
                  style={[
                    styles.ringBackground,
                    {
                      width: TIMER_SIZE,
                      height: TIMER_SIZE,
                      borderRadius: TIMER_SIZE / 2,
                      borderWidth: CIRCLE_STROKE,
                      borderColor: isResting
                        ? COLORS.surfaceBorder
                        : timeRemaining <= 3
                        ? COLORS.danger + '60'
                        : COLORS.accent + '40',
                    },
                  ]}
                />
              </View>
              {/* Timer text */}
              <View style={styles.timerTextContainer}>
                <Text
                  style={[
                    styles.timerCountdown,
                    isResting && { color: COLORS.textSecondary },
                    timeRemaining <= 3 && !isResting && { color: COLORS.danger },
                  ]}
                >
                  {timeRemaining}
                </Text>
                <Text style={styles.timerUnit}>
                  {isResting ? 'REST' : 'sec'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Side indicator */}
          {sideLabel && !isResting && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.sideIndicator}>
              <LinearGradient
                colors={[COLORS.accentDark + '60', COLORS.accent + '30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sideBadge}
              >
                <Text style={styles.sideText}>{sideLabel}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Stretch Info */}
          {!isResting && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <SystemPanel>
                <Text style={styles.activeStretchName}>{currentStretch.name}</Text>
                <Text style={styles.activeStretchDesc}>{currentStretch.description}</Text>
                <View style={styles.stretchMeta}>
                  <MaterialCommunityIcons
                    name="timer-outline"
                    size={14}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.stretchMetaText}>
                    {currentStretch.duration}s
                    {currentStretch.sides ? ' per side' : ''}
                  </Text>
                </View>
              </SystemPanel>
            </Animated.View>
          )}

          {/* Next Up Preview */}
          {isResting && currentStretchIndex < sessionStretches.length && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <SystemPanel>
                <Text style={styles.nextUpLabel}>NEXT UP</Text>
                <Text style={styles.activeStretchName}>
                  {sessionStretches[currentStretchIndex].name}
                </Text>
                <Text style={styles.activeStretchDesc}>
                  {sessionStretches[currentStretchIndex].description}
                </Text>
              </SystemPanel>
            </Animated.View>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            {isRinging ? (
              <TouchableOpacity style={styles.dismissAlarmBtn} onPress={dismissAlarm}>
                <LinearGradient
                  colors={[COLORS.accentDark, COLORS.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dismissAlarmGradient}
                >
                  <MaterialCommunityIcons name="bell-ring" size={24} color="#fff" />
                  <Text style={styles.dismissAlarmText}>DISMISS ALARM</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.controlButton} onPress={skipStretch}>
                  <View style={styles.controlBtnInner}>
                    <MaterialCommunityIcons
                      name="skip-next"
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </View>
                  <Text style={styles.controlLabel}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButtonMain} onPress={togglePause}>
                  <LinearGradient
                    colors={
                      isPaused
                        ? [COLORS.success, COLORS.success + 'cc']
                        : [COLORS.accent, COLORS.accentDark]
                    }
                    style={styles.controlBtnMainInner}
                  >
                    <MaterialCommunityIcons
                      name={isPaused ? 'play' : 'pause'}
                      size={32}
                      color="#fff"
                    />
                  </LinearGradient>
                  <Text style={styles.controlLabel}>{isPaused ? 'Resume' : 'Pause'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={stopSession}>
                  <View style={styles.controlBtnInner}>
                    <MaterialCommunityIcons name="stop" size={24} color={COLORS.danger} />
                  </View>
                  <Text style={styles.controlLabel}>Stop</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── DAY SELECT + STRETCH LIST VIEW ─────
  const selectedCount = allStretches.filter((s) => selectedStretchIds.has(s.id)).length;
  const allSelected = selectedCount === allStretches.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <SystemPanel>
          <View style={styles.header}>
            <MaterialCommunityIcons name="yoga" size={22} color={COLORS.accent} />
            <Text style={styles.headerTitle}>STRETCH TIMER</Text>
          </View>
          <Text style={styles.headerSub}>
            Select your workout day, choose stretches, and start.
          </Text>
        </SystemPanel>

        {/* Day Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelectorScroll}
          contentContainerStyle={styles.daySelectorContent}
        >
          {STRETCH_DAYS.map((day) => {
            const isSelected = day.id === selectedDay;
            return (
              <TouchableOpacity
                key={day.id}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDay(day.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={day.icon}
                  size={18}
                  color={isSelected ? COLORS.accent : COLORS.textMuted}
                />
                <Text
                  style={[styles.dayChipLabel, isSelected && styles.dayChipLabelActive]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Day Info + Select All / None */}
        <View style={styles.dayInfoRow}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayInfoTitle}>
              {STRETCH_DAYS.find((d) => d.id === selectedDay)?.description}
            </Text>
            <Text style={styles.dayInfoMeta}>
              {selectedCount}/{allStretches.length} selected • ~{formatTime(getSelectedTotalTime())}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.selectToggle}
            onPress={allSelected ? deselectAll : selectAll}
          >
            <Text style={styles.selectToggleText}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stretch Cards with checkboxes + individual play */}
        {allStretches.map((stretch, index) => {
          const isSelected = selectedStretchIds.has(stretch.id);
          return (
            <Animated.View
              key={stretch.id}
              entering={FadeInDown.delay(index * 60).duration(400)}
              layout={Layout.duration(300)}
            >
              <View style={[styles.stretchCard, SHADOWS.soft, !isSelected && styles.stretchCardDeselected]}>
                <View style={[styles.stretchCardInner, SHADOWS.inner]}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[styles.checkbox, isSelected && styles.checkboxActive]}
                    onPress={() => toggleStretchSelection(stretch.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    )}
                  </TouchableOpacity>

                  {/* Info */}
                  <TouchableOpacity
                    style={styles.stretchCardLeft}
                    onPress={() => toggleStretchSelection(stretch.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stretchIconWrap}>
                      <MaterialCommunityIcons
                        name={stretch.icon}
                        size={20}
                        color={isSelected ? COLORS.accent : COLORS.textMuted}
                      />
                    </View>
                    <View style={styles.stretchCardInfo}>
                      <Text style={[styles.stretchCardName, !isSelected && styles.stretchCardNameDeselected]}>
                        {stretch.name}
                      </Text>
                      <Text style={styles.stretchCardDesc} numberOfLines={2}>
                        {stretch.description}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Duration + Solo play */}
                  <View style={styles.stretchCardRight}>
                    <Text style={[styles.stretchDuration, !isSelected && { color: COLORS.textMuted }]}>
                      {stretch.duration}s
                    </Text>
                    {stretch.sides && (
                      <Text style={styles.stretchSidesBadge}>per side</Text>
                    )}
                    <TouchableOpacity
                      style={styles.soloPlayBtn}
                      onPress={() => startSingleStretch(stretch)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <MaterialCommunityIcons name="play-circle-outline" size={22} color={COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startSessionButton, selectedCount === 0 && styles.startSessionDisabled]}
          onPress={startSession}
          activeOpacity={0.8}
          disabled={selectedCount === 0}
        >
          <LinearGradient
            colors={selectedCount > 0 ? [COLORS.accentDark, COLORS.accent] : [COLORS.surfaceLight, COLORS.surfaceLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startSessionGradient}
          >
            <MaterialCommunityIcons name="play-circle" size={22} color={selectedCount > 0 ? '#fff' : COLORS.textMuted} />
            <Text style={[styles.startSessionText, selectedCount === 0 && { color: COLORS.textMuted }]}>
              START {selectedCount} STRETCH{selectedCount !== 1 ? 'ES' : ''}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl + 20,
  },

  // ─── Header ──────────────────────────────
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
    color: COLORS.accent,
    letterSpacing: 3,
  },
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // ─── Day Selector ────────────────────────
  daySelectorScroll: {
    marginBottom: SPACING.base,
  },
  daySelectorContent: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dayChipActive: {
    borderColor: COLORS.accent + '80',
    backgroundColor: COLORS.accentGlow,
  },
  dayChipLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  dayChipLabelActive: {
    color: COLORS.accent,
  },

  // ─── Day Info Row ────────────────────────
  dayInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  dayInfo: {},
  dayInfoTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  dayInfoMeta: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  selectToggle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  selectToggleText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    fontWeight: '600',
  },

  // ─── Stretch Cards ───────────────────────
  stretchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.background,
    marginBottom: SPACING.sm,
  },
  stretchCardDeselected: {
    opacity: 0.5,
  },
  stretchCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  checkboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  stretchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stretchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stretchCardInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  stretchCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  stretchCardNameDeselected: {
    color: COLORS.textMuted,
  },
  stretchCardDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  stretchCardRight: {
    alignItems: 'center',
  },
  stretchDuration: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.accent,
  },
  stretchSidesBadge: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soloPlayBtn: {
    marginTop: SPACING.xs,
    padding: 2,
  },

  // ─── Start Button ────────────────────────
  startSessionButton: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  startSessionDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  startSessionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
  },
  startSessionText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },

  // ─── Timer View ──────────────────────────
  timerContent: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl + 20,
    alignItems: 'center',
  },

  // Progress Indicator
  progressIndicator: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  progressText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceBorder,
  },
  progressDotDone: {
    backgroundColor: COLORS.success,
  },
  progressDotActive: {
    backgroundColor: COLORS.accent,
    width: 18,
    borderRadius: 3,
  },

  // Timer Circle
  timerCircleWrap: {
    marginBottom: SPACING.xl,
  },
  timerCircle: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
    width: TIMER_SIZE,
    height: TIMER_SIZE,
  },
  ringBackground: {
    position: 'absolute',
  },
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCountdown: {
    fontFamily: FONTS.heading,
    fontSize: 72,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 80,
  },
  timerUnit: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Side Indicator
  sideIndicator: {
    marginBottom: SPACING.lg,
  },
  sideBadge: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  sideText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 2,
  },

  // Active Stretch Info
  activeStretchName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  activeStretchDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  stretchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stretchMetaText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  nextUpLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: SPACING.xxl,
    marginTop: SPACING.xl,
    width: '100%',
  },
  controlButton: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  controlBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonMain: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  controlBtnMainInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  controlLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  
  // ─── Dismiss Alarm Button ───────────────
  dismissAlarmBtn: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  dismissAlarmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  dismissAlarmText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },

  // ─── Completion View ─────────────────────
  completionContent: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  completionCard: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  completionGradient: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  completionIconWrap: {
    marginBottom: SPACING.lg,
  },
  completionTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 3,
    marginBottom: SPACING.xs,
  },
  completionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxl,
  },
  completionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  completionStatItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  completionStatValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.accent,
  },
  completionStatLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  completionDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.surfaceBorder,
  },
  restartButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    width: '100%',
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  restartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
  },
  restartText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  backButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
