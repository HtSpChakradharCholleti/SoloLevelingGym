import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, FlatList, SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,

  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
  interpolateColor,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import { EXERCISES, DUNGEONS } from '../data/exercises';
import SystemPanel from '../components/SystemPanel';
import XPToast from '../components/XPToast';
import SparkleBurst from '../components/SparkleBurst';
import SoundManager from '../utils/SoundManager';
import NotificationManager from '../utils/NotificationManager';

// ─── Animated Timer Display ───────────────────────────────────────────────────
// Polls the shared value from the JS thread every 250ms to format MM:SS.
// Shared values are readable from JS via .value — no worklet crossing needed.
// 250ms polling is more than sufficient for a MM:SS display that changes ~1/s.
function AnimatedTimerDisplay({ sharedValue, style }) {
  const [display, setDisplay] = useState('00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const s = Math.max(0, Math.round(sharedValue.value));
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      setDisplay(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 250);
    return () => clearInterval(interval);
  }, [sharedValue]);

  return <Text style={style}>{display}</Text>;
}

// ─── Set Button ──────────────────────────────────────────────────────────────
// Tactile reward when a set is marked complete:
//   1. Spring scale-pop (1 → 1.35 → 1) on the UI thread
//   2. Animated check icon (fades + scales in)
//   3. SparkleBurst overlay anchored to the button
function SetButton({ index, completed, statColor, onPress }) {
  const scale = useSharedValue(1);
  const checkOpacity = useSharedValue(completed ? 1 : 0);
  const checkScale = useSharedValue(completed ? 1 : 0.4);

  // `burstKey` is bumped each time we transition into `completed` — the
  // SparkleBurst component is fresh-mounted (via key prop) so its
  // particle animation starts from t=0 every time.
  const [burstKey, setBurstKey] = React.useState(0);
  const wasCompletedRef = useRef(completed);

  useEffect(() => {
    if (completed && !wasCompletedRef.current) {
      // false → true transition: quick pop + settle (no bounce)
      scale.value = withSequence(
        withTiming(1.15, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) })
      );
      checkOpacity.value = withTiming(1, { duration: 150 });
      checkScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
      setBurstKey(k => k + 1);
    } else if (!completed && wasCompletedRef.current) {
      checkOpacity.value = withTiming(0, { duration: 120 });
      checkScale.value = withTiming(0.4, { duration: 120 });
    }
    wasCompletedRef.current = completed;
  }, [completed]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={!completed ? onPress : undefined}
      disabled={completed}
      activeOpacity={0.7}
    >
      <Animated.View style={wrapperStyle}>
        <View style={[rowStyles.setBtn, completed && { backgroundColor: statColor, borderColor: statColor }]}>
          {/* Number — fades out as check fades in */}
          {!completed && (
            <Text style={rowStyles.setNum}>{index + 1}</Text>
          )}
          {/* Animated check overlay */}
          <Animated.View style={[rowStyles.checkOverlay, checkStyle]}>
            <MaterialCommunityIcons name="check-bold" size={16} color={COLORS.background} />
          </Animated.View>
          {/* Sparkle burst — keyed so it re-mounts and replays on each completion */}
          {burstKey > 0 && (
            <View pointerEvents="none" style={rowStyles.burstAnchor}>
              <SparkleBurst
                key={burstKey}
                count={8}
                radius={28}
                duration={650}
                colors={[statColor, COLORS.accent]}
              />
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Weight Chip ─────────────────────────────────────────────────────────────
// Inline weight input sitting below the exercise name. Tapping opens the
// numeric keyboard; blurring saves automatically — no confirm button.
function WeightChip({ exerciseId, statColor, currentWeight, lastWeight, unit, onWeightChange }) {
  // Local draft so the user can edit freely without every keystroke hitting state
  const [draft, setDraft] = useState(
    currentWeight != null ? String(currentWeight) : ''
  );

  // Keep draft in sync if parent resets weight (e.g. workout cancel → restart)
  useEffect(() => {
    setDraft(currentWeight != null ? String(currentWeight) : '');
  }, [exerciseId]);

  const handleBlur = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) {
      onWeightChange(exerciseId, parsed);
    } else if (draft.trim() === '') {
      onWeightChange(exerciseId, null);
    } else {
      // Invalid input — revert to current
      setDraft(currentWeight != null ? String(currentWeight) : '');
    }
  };

  const placeholder = lastWeight != null ? String(lastWeight) : '0';

  return (
    <View style={[weightStyles.chip, { borderColor: statColor + '55' }]}>
      <MaterialCommunityIcons name="weight-kilogram" size={12} color={statColor} />
      <TextInput
        style={[weightStyles.input, { color: draft ? COLORS.textPrimary : COLORS.textMuted }]}
        value={draft}
        onChangeText={setDraft}
        onBlur={handleBlur}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="done"
        selectTextOnFocus
        maxLength={6}
      />
      <Text style={[weightStyles.unit, { color: statColor }]}>{unit}</Text>
    </View>
  );
}

const weightStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: COLORS.surfaceLight,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    minWidth: 32,
    padding: 0,
  },
  unit: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});

// ─── Treadmill Chip ──────────────────────────────────────────────────────────
// Compact dual-input shown for cardio exercises (treadmill walks / incline
// walks). Two inline numeric fields — speed (km/h) and incline (%) — saved
// to the active workout on blur. Pre-fills from the most recent session
// (passed via `lastSpeed` / `lastIncline`).
function TreadmillChip({
  exerciseId, statColor,
  currentSpeed, currentIncline,
  lastSpeed, lastIncline,
  onParamsChange,
}) {
  const [speedDraft, setSpeedDraft] = useState(
    currentSpeed != null ? String(currentSpeed) : ''
  );
  const [inclineDraft, setInclineDraft] = useState(
    currentIncline != null ? String(currentIncline) : ''
  );

  // Reset when switching between exercises (keyed by exerciseId)
  useEffect(() => {
    setSpeedDraft(currentSpeed != null ? String(currentSpeed) : '');
    setInclineDraft(currentIncline != null ? String(currentIncline) : '');
  }, [exerciseId]);

  const commit = (field, draft, setDraft, currentVal) => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onParamsChange(exerciseId, { [field]: null });
      return;
    }
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed) && parsed >= 0) {
      onParamsChange(exerciseId, { [field]: parsed });
    } else {
      // Invalid → revert
      setDraft(currentVal != null ? String(currentVal) : '');
    }
  };

  return (
    <View style={treadmillStyles.row}>
      {/* Speed */}
      <View style={[treadmillStyles.chip, { borderColor: statColor + '55' }]}>
        <MaterialCommunityIcons name="speedometer" size={12} color={statColor} />
        <TextInput
          style={[treadmillStyles.input, { color: speedDraft ? COLORS.textPrimary : COLORS.textMuted }]}
          value={speedDraft}
          onChangeText={setSpeedDraft}
          onBlur={() => commit('speed', speedDraft, setSpeedDraft, currentSpeed)}
          keyboardType="decimal-pad"
          placeholder={lastSpeed != null ? String(lastSpeed) : '0'}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="done"
          selectTextOnFocus
          maxLength={4}
        />
        <Text style={[treadmillStyles.unit, { color: statColor }]}>km/h</Text>
      </View>

      {/* Incline */}
      <View style={[treadmillStyles.chip, { borderColor: statColor + '55' }]}>
        <MaterialCommunityIcons name="slope-uphill" size={12} color={statColor} />
        <TextInput
          style={[treadmillStyles.input, { color: inclineDraft ? COLORS.textPrimary : COLORS.textMuted }]}
          value={inclineDraft}
          onChangeText={setInclineDraft}
          onBlur={() => commit('incline', inclineDraft, setInclineDraft, currentIncline)}
          keyboardType="decimal-pad"
          placeholder={lastIncline != null ? String(lastIncline) : '0'}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="done"
          selectTextOnFocus
          maxLength={4}
        />
        <Text style={[treadmillStyles.unit, { color: statColor }]}>%</Text>
      </View>
    </View>
  );
}

const treadmillStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    backgroundColor: COLORS.surfaceLight,
  },
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    minWidth: 28,
    padding: 0,
  },
  unit: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
});

// ─── Inline ExerciseRow with remove button ────────────────────────────────────
function ExerciseRow({
  exercise, completedSets = [], totalSets,
  onCompleteSet, onRemove,
  onWeightChange, currentWeight, lastWeight, weightUnit,
  onCardioChange, currentCardio, lastCardio,
  index,
}) {
  const statColor = STAT_COLORS[exercise.stat] || COLORS.primary;
  const completedCount = completedSets.filter(Boolean).length;
  const allDone = completedCount >= totalSets;

  return (
    <View style={[rowStyles.wrapper, allDone && rowStyles.wrapperDone]}>
      {/* Left meta */}
      <View style={rowStyles.left}>
        <View style={[rowStyles.iconBg, { borderColor: statColor + '40' }]}>
          <MaterialCommunityIcons name={exercise.icon || 'dumbbell'} size={18} color={statColor} />
        </View>
        <View style={rowStyles.info}>
          <Text style={[rowStyles.name, allDone && rowStyles.nameDone]}>{exercise.name}</Text>
          <Text style={rowStyles.meta}>
            {totalSets} sets × {exercise.repRange || `${exercise.reps} reps`} • +{exercise.baseXP} XP
          </Text>
          {exercise.muscle ? <Text style={rowStyles.muscle}>{exercise.muscle}</Text> : null}
          {exercise.cardio ? (
            <TreadmillChip
              exerciseId={exercise.id}
              statColor={statColor}
              currentSpeed={currentCardio?.speed ?? null}
              currentIncline={currentCardio?.incline ?? null}
              lastSpeed={lastCardio?.speed ?? null}
              lastIncline={lastCardio?.incline ?? null}
              onParamsChange={onCardioChange}
            />
          ) : (
            <WeightChip
              exerciseId={exercise.id}
              statColor={statColor}
              currentWeight={currentWeight}
              lastWeight={lastWeight}
              unit={weightUnit}
              onWeightChange={onWeightChange}
            />
          )}
        </View>
      </View>

      {/* Right side: set buttons + trash */}
      <View style={rowStyles.right}>
        <View style={rowStyles.setsRow}>
          {Array.from({ length: totalSets }, (_, i) => (
            <SetButton
              key={i}
              index={i}
              completed={!!completedSets[i]}
              statColor={statColor}
              onPress={() => onCompleteSet(exercise.id, i)}
            />
          ))}
        </View>

        {/* Remove button — only visible when no sets completed yet */}
        {completedCount === 0 && (
          <TouchableOpacity
            style={rowStyles.removeBtn}
            onPress={() => onRemove(exercise.id, exercise.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.danger + 'b0'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  wrapperDone: { opacity: 0.55 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBg: {
    width: 34, height: 34,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  info: { flex: 1 },
  name: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.md,
    fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2,
  },
  nameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  meta: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  muscle: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 1 },
  right: { flexDirection: 'column', alignItems: 'flex-end', gap: SPACING.xs },
  setsRow: { flexDirection: 'row', gap: SPACING.xs },
  setBtn: {
    width: 26, height: 26,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    overflow: 'visible',
  },
  // Animated check icon sits centered, fades + scales in on completion
  checkOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sparkle anchor — full-bleed container so the burst centres on the button
  burstAnchor: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  setBtnTouchArea: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 12,
    color: COLORS.background,
    fontWeight: '700',
  },
  setNum: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textPrimary, fontWeight: '600' },
  removeBtn: { paddingTop: SPACING.xs },
});

// ─── Add-Exercise Modal ───────────────────────────────────────────────────────
function AddExerciseModal({ visible, activeExerciseIds, onAdd, onClose }) {
  const [query, setQuery] = useState('');

  // Build sections grouped by dungeon, excluding already-added exercises
  const sections = DUNGEONS
    .filter(d => d.id !== 'warmup_stretching')
    .map(dungeon => {
      const exercises = EXERCISES.filter(e => {
        if (e.dungeonId !== dungeon.id) return false;
        if (activeExerciseIds.has(e.id)) return false;
        if (query.trim()) {
          return e.name.toLowerCase().includes(query.trim().toLowerCase());
        }
        return true;
      });
      return { title: dungeon.subtitle, splitLabel: dungeon.splitLabel, stat: dungeon.stat, data: exercises };
    })
    .filter(s => s.data.length > 0);

  const handleAdd = (exercise) => {
    onAdd(exercise);
    // Don't close — allow adding multiple
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={addStyles.overlay}>
        <View style={addStyles.sheet}>
          {/* Handle */}
          <View style={addStyles.handle} />

          {/* Header */}
          <View style={addStyles.header}>
            <View>
              <Text style={addStyles.title}>ADD EXERCISE</Text>
              <Text style={addStyles.subtitle}>Pick from any dungeon or split</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={addStyles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={addStyles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
            <TextInput
              style={addStyles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search exercises…"
              placeholderTextColor={COLORS.textMuted}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise list grouped by dungeon */}
          {sections.length === 0 ? (
            <View style={addStyles.emptyState}>
              <MaterialCommunityIcons name="check-all" size={36} color={COLORS.textMuted} />
              <Text style={addStyles.emptyText}>
                {query ? 'No exercises match your search.' : 'All exercises already added!'}
              </Text>
            </View>
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={item => item.id}
              contentContainerStyle={addStyles.listContent}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section }) => {
                const statColor = STAT_COLORS[section.stat] || COLORS.primary;
                return (
                  <View style={addStyles.sectionHeader}>
                    <View style={[addStyles.splitBadge, { backgroundColor: statColor + '22', borderColor: statColor + '50' }]}>
                      <Text style={[addStyles.splitLabel, { color: statColor }]}>{section.splitLabel}</Text>
                    </View>
                    <Text style={addStyles.sectionTitle}>{section.title}</Text>
                  </View>
                );
              }}
              renderItem={({ item }) => {
                const statColor = STAT_COLORS[item.stat] || COLORS.primary;
                return (
                  <TouchableOpacity
                    style={addStyles.exerciseRow}
                    onPress={() => handleAdd(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[addStyles.exIcon, { borderColor: statColor + '40' }]}>
                      <MaterialCommunityIcons name={item.icon || 'dumbbell'} size={16} color={statColor} />
                    </View>
                    <View style={addStyles.exInfo}>
                      <Text style={addStyles.exName}>{item.name}</Text>
                      <Text style={addStyles.exMeta}>
                        {item.defaultSets} sets × {item.repRange || `${item.defaultReps} reps`} • +{item.baseXP} XP
                      </Text>
                      {item.muscle && <Text style={addStyles.exMuscle}>{item.muscle}</Text>}
                    </View>
                    <View style={[addStyles.addBtn, { backgroundColor: statColor + '20', borderColor: statColor + '60' }]}>
                      <MaterialCommunityIcons name="plus" size={18} color={statColor} />
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const addStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '88%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.surfaceBorder,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xl,
    fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 2,
  },
  subtitle: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2,
  },
  closeBtn: { padding: SPACING.xs },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.md,
    color: COLORS.textMuted, textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  splitBadge: {
    borderWidth: 1, borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  splitLabel: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', letterSpacing: 1.5,
  },
  sectionTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm,
    fontWeight: '700', color: COLORS.textSecondary,
  },
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  exIcon: {
    width: 32, height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  exInfo: { flex: 1 },
  exName: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.md,
    fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2,
  },
  exMeta: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  exMuscle: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, fontStyle: 'italic', marginTop: 1 },
  addBtn: {
    width: 34, height: 34,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: SPACING.md,
  },
});


// ─── Empty Workout State — floating sword icon ────────────────────────────────
function EmptyWorkoutState() {
  const router = useRouter();
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Infinite gentle oscillation: 0 → -8px → 0 → 8px → 0, period ~2.4s
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 1200, easing: Easing.inOut(Easing.sin) })
      ),
      -1, // infinite
      true
    );
    // CRITICAL: cancel on unmount. withRepeat runs on the UI thread indefinitely.
    // If the component unmounts (workout starts) without cancelling, the UI thread
    // tries to write to the freed shared value → SIGSEGV use-after-free.
    return () => cancelAnimation(floatY);
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
      <Animated.View style={floatStyle}>
        <MaterialCommunityIcons name="sword-cross" size={64} color={COLORS.textMuted} />
      </Animated.View>
      <Text style={styles.emptyTitle}>No Active Dungeon</Text>
      <Text style={styles.emptySubtitle}>Select a dungeon to start your training</Text>
      <TouchableOpacity
        style={styles.goButton}
        onPress={() => router.push('/(tabs)/dungeons')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.accentDark, COLORS.accent]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.goButtonGradient}
        >
          <Text style={styles.goButtonText}>SELECT DUNGEON</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main WorkoutScreen ───────────────────────────────────────────────────────
export default function WorkoutScreen() {
  const router = useRouter();
  // Opt out of React Compiler — beta hoists activeWorkout.exercises past the
  // null guard below, crashing on initial render when no workout is active.
  'use no memo';

  const {
    activeWorkout,
    workoutHistory,
    settings,
    completeExerciseSet,
    setExerciseWeight,
    setExerciseCardioParams,
    finishWorkout,
    cancelWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
  } = usePlayer();

  /**
   * Look up the most recent recorded weight for a given exercise.
   * Searches workoutHistory newest-first and returns the first match.
   */
  const getLastWeight = useCallback((exerciseId) => {
    for (const entry of workoutHistory) {
      const found = entry.exercises?.find(e => e.id === exerciseId);
      if (found && found.weight != null) return found.weight;
    }
    return null;
  }, [workoutHistory]);

  /**
   * Find the most recent recorded speed / incline for a cardio exercise.
   * Returns an object so the two fields can be sourced from different
   * sessions if necessary.
   */
  const getLastCardioParams = useCallback((exerciseId) => {
    let speed = null;
    let incline = null;
    for (const entry of workoutHistory) {
      const found = entry.exercises?.find(e => e.id === exerciseId);
      if (!found) continue;
      if (speed   == null && found.speed   != null) speed   = found.speed;
      if (incline == null && found.incline != null) incline = found.incline;
      if (speed != null && incline != null) break;
    }
    return { speed, incline };
  }, [workoutHistory]);

  const weightUnit = settings?.weightUnit || 'kg';
  const notificationsEnabled = settings?.notificationsEnabled ?? true;

  useKeepAwake();
  const [toasts, setToasts] = useState([]);
  // Monotonic counter — avoids React key collisions if two sets are completed
  // within the same millisecond
  const toastIdRef = useRef(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [restDuration, setRestDuration] = useState(180); // 3 minutes default
  const [restRestartKey, setRestRestartKey] = useState(0);
  const [isResting, setIsResting] = useState(false); // JS-side flag for conditional rendering
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  const restEndTimeRef = useRef(null);

  // Shared values — written from JS interval, read on UI thread for jank-free display
  const elapsedShared = useSharedValue(0);
  const restRemainingShared = useSharedValue(0);

  // Elapsed timer — writes to shared value instead of React state
  useEffect(() => {
    if (activeWorkout) {
      timerRef.current = setInterval(() => {
        elapsedShared.value = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeWorkout]);

  // Rest timer — wall-clock based, writes to shared value for UI-thread rendering.
  // restRestartKey forces re-init even when the duration value doesn't change.
  useEffect(() => {
    if (restRestartKey === 0) return; // initial mount — no rest yet

    const duration = restDuration;
    restEndTimeRef.current = Date.now() + duration * 1000;
    restRemainingShared.value = duration;
    setIsResting(true);

    // Schedule push notification for when rest ends (background support)
    if (notificationsEnabled) {
      NotificationManager.scheduleRestNotification(duration);
    }

    restTimerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((restEndTimeRef.current - Date.now()) / 1000)
      );
      restRemainingShared.value = remaining;
      if (remaining <= 0) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
        restEndTimeRef.current = null;
        setIsResting(false);
        SoundManager.playTimerComplete();
        NotificationManager.cancelRestNotification();
      }
    }, 250);

    return () => {
      if (restTimerRef.current) {
        clearInterval(restTimerRef.current);
        restTimerRef.current = null;
      }
    };
  }, [restRestartKey]);

  // Animated style for rest progress bar — driven by shared value on UI thread
  const restProgressStyle = useAnimatedStyle(() => {
    const progress = restDuration > 0 ? restRemainingShared.value / restDuration : 0;
    // Color shifts: accent (resting) → warning (10s) → danger (0s)
    const urgencyColor = interpolateColor(
      restRemainingShared.value,
      [0, 5, 10, restDuration],
      [COLORS.danger, COLORS.danger, COLORS.warning, COLORS.accent]
    );
    return {
      width: `${progress * 100}%`,
      backgroundColor: urgencyColor,
    };
  });

  // Subtle opacity pulse when very low time remains (≤ 5s)
  const restBarPulseStyle = useAnimatedStyle(() => {
    if (restRemainingShared.value <= 5 && restRemainingShared.value > 0) {
      return { opacity: 0.75 };
    }
    return { opacity: 1 };
  });

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.round(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = useCallback((exerciseId, setIndex) => {
    if (!activeWorkout) return;
    const exercise = activeWorkout.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    completeExerciseSet(exerciseId, setIndex, exercise.baseXP, exercise.stat);
    const toastId = ++toastIdRef.current;
    setToasts(prev => [...prev, { id: toastId, amount: exercise.baseXP, stat: exercise.stat }]);

    // Restart rest timer — clear any existing, then bump restartKey to force useEffect re-run
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    restEndTimeRef.current = null;
    restRemainingShared.value = restDuration;
    setRestRestartKey(k => k + 1);
  }, [activeWorkout, completeExerciseSet, restDuration]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleRemoveExercise = useCallback((exerciseId, exerciseName) => {
    Alert.alert(
      'Remove Exercise?',
      `Remove "${exerciseName}" from this workout?`,
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => removeExerciseFromWorkout(exerciseId),
        },
      ]
    );
  }, [removeExerciseFromWorkout]);

  const handleFinish = () => {
    const completedAnything = Object.values(activeWorkout.completedSets || {})
      .some(sets => sets && sets.some(Boolean));
    if (!completedAnything) {
      Alert.alert('No Exercises Completed', 'Complete at least one set before finishing.');
      return;
    }
    // Clean up rest timer and notification
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
    restEndTimeRef.current = null;
    restRemainingShared.value = 0;
    setIsResting(false);
    NotificationManager.cancelRestNotification();
    finishWorkout();
    router.push('/(tabs)');
  };

  const handleCancel = () => {
    Alert.alert(
      'Abandon Dungeon?',
      'All progress in this workout will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Abandon', style: 'destructive',
          onPress: () => {
            // Clean up rest timer and notification
            if (restTimerRef.current) {
              clearInterval(restTimerRef.current);
              restTimerRef.current = null;
            }
            restEndTimeRef.current = null;
            restRemainingShared.value = 0;
            setIsResting(false);
            NotificationManager.cancelRestNotification();
            cancelWorkout();
            router.push('/(tabs)/dungeons');
          },
        },
      ]
    );
  };

  // No active workout
  if (!activeWorkout) {
    return <EmptyWorkoutState />;
  }

  const totalSetsCompleted = Object.values(activeWorkout.completedSets || {})
    .reduce((sum, sets) => sum + (sets ? sets.filter(Boolean).length : 0), 0);
  const totalSets = activeWorkout.exercises.reduce((sum, e) => sum + e.sets, 0);

  // Set of IDs already in the workout for the add-modal to exclude
  const activeExerciseIds = new Set(activeWorkout.exercises.map(e => e.id));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Timer & XP Panel */}
        <SystemPanel glowColor={COLORS.accent}>
          <View style={styles.timerSection}>
            <View style={styles.timerArea}>
              <Text style={styles.timerLabel}>DUNGEON TIME</Text>
              <AnimatedTimerDisplay sharedValue={elapsedShared} style={styles.timerValue} />
            </View>
            <View style={styles.xpArea}>
              <Text style={styles.xpLabel}>XP EARNED</Text>
              <Text style={styles.xpValue}>+{activeWorkout.xpEarned}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressArea}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{totalSetsCompleted}/{totalSets} sets</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: totalSets > 0 ? `${(totalSetsCompleted / totalSets) * 100}%` : '0%' }]}>
                <LinearGradient
                  colors={[COLORS.accentDark, COLORS.accent]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </SystemPanel>

        {/* Rest Timer */}
        {isResting && (
          <View style={styles.restTimerBar}>
            <View style={styles.restTimerContent}>
              <MaterialCommunityIcons name="timer-sand" size={18} color={COLORS.accent} />
              <View style={styles.restTimerTextRow}>
                <Text style={styles.restTimerLabel}>REST  </Text>
                <AnimatedTimerDisplay sharedValue={restRemainingShared} style={styles.restTimerText} />
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (restTimerRef.current) {
                    clearInterval(restTimerRef.current);
                    restTimerRef.current = null;
                  }
                  restEndTimeRef.current = null;
                  restRemainingShared.value = 0;
                  setIsResting(false);
                  NotificationManager.cancelRestNotification();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.restSkipText}>SKIP</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.restProgressOuter}>
              <Animated.View
                style={[
                  styles.restProgressFill,
                  restProgressStyle,
                  restBarPulseStyle,
                ]}
              />
            </View>
          </View>
        )}

        {/* Exercise List header row */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>EXERCISES</Text>
          <TouchableOpacity
            style={styles.addExBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={16} color={COLORS.accent} />
            <Text style={styles.addExText}>ADD</Text>
          </TouchableOpacity>
        </View>

        {/* Rest Duration Config */}
        <View style={styles.restConfigRow}>
          <Text style={styles.restConfigLabel}>REST TIMER</Text>
          <View style={styles.restConfigControls}>
            <TouchableOpacity
              onPress={() => setRestDuration(d => Math.max(30, d - 30))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="minus-circle-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.restConfigValue}>{formatTime(restDuration)}</Text>
            <TouchableOpacity
              onPress={() => setRestDuration(d => Math.min(300, d + 30))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {activeWorkout.exercises.length === 0 ? (
          <View style={styles.noExercises}>
            <MaterialCommunityIcons name="dumbbell" size={32} color={COLORS.textMuted} />
            <Text style={styles.noExercisesText}>No exercises — tap ADD to pick some</Text>
          </View>
        ) : (
          activeWorkout.exercises.map((exercise, index) => {
            const lastWeight = getLastWeight(exercise.id);
            const currentWeight = (activeWorkout.exerciseWeights || {})[exercise.id] ?? null;
            const currentCardio = (activeWorkout.exerciseCardioParams || {})[exercise.id] || null;
            const lastCardio = exercise.cardio ? getLastCardioParams(exercise.id) : null;
            return (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                completedSets={activeWorkout.completedSets[exercise.id] || []}
                totalSets={exercise.sets}
                onCompleteSet={handleCompleteSet}
                onRemove={handleRemoveExercise}
                onWeightChange={setExerciseWeight}
                onCardioChange={setExerciseCardioParams}
                currentWeight={currentWeight}
                lastWeight={lastWeight}
                currentCardio={currentCardio}
                lastCardio={lastCardio}
                weightUnit={weightUnit}
                index={index}
              />
            );
          })
        )}

        {/* Stat XP Earned */}
        {Object.keys(activeWorkout.statXPEarned).length > 0 && (
          <SystemPanel glowColor={COLORS.primary}>
            <Text style={styles.statXPTitle}>STAT XP GAINED</Text>
            {Object.entries(activeWorkout.statXPEarned).map(([stat, xp]) => (
              <View key={stat} style={styles.statXPRow}>
                <Text style={[styles.statXPLabel, { color: STAT_COLORS[stat] }]}>{stat}</Text>
                <Text style={[styles.statXPValue, { color: STAT_COLORS[stat] }]}>+{xp}</Text>
              </View>
            ))}
          </SystemPanel>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <LinearGradient
              colors={['#00c853', '#00e676']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.actionText}>COMPLETE DUNGEON</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stretchButton}
            onPress={() => router.push('/stretching')}
          >
            <View style={styles.stretchButtonInner}>
              <MaterialCommunityIcons name="yoga" size={18} color={COLORS.accent} />
              <Text style={styles.stretchButtonText}>Stretch &amp; Cooldown</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Abandon Dungeon</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        visible={showAddModal}
        activeExerciseIds={activeExerciseIds}
        onAdd={(exercise) => {
          addExerciseToWorkout(exercise);
        }}
        onClose={() => setShowAddModal(false)}
      />

      {/* XP Toasts */}
      {toasts.map(toast => (
        <XPToast
          key={toast.id}
          amount={toast.amount}
          stat={toast.stat}
          onDone={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  emptyContainer: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl,
  },
  emptyTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xl,
    fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.md,
    color: COLORS.textMuted, marginTop: SPACING.sm, marginBottom: SPACING.xxl,
  },
  goButton: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  goButtonGradient: {
    paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
  },
  goButtonText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.base,
    fontWeight: '700', color: '#fff', letterSpacing: 2,
  },
  timerSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.base },
  timerArea: {},
  timerLabel: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1,
  },
  timerValue: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xxxl,
    fontWeight: '700', color: COLORS.textPrimary,
  },
  xpArea: { alignItems: 'flex-end' },
  xpLabel: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1,
  },
  xpValue: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xxxl,
    fontWeight: '700', color: COLORS.accent,
  },
  progressArea: {},
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  progressLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  progressValue: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm,
    fontWeight: '700', color: COLORS.textPrimary,
  },
  progressBar: {
    height: 6, backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: BORDER_RADIUS.round, overflow: 'hidden' },

  // Section header row with ADD button
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md, marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.base,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 2,
  },
  addExBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    borderWidth: 1, borderColor: COLORS.accent + '60',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    backgroundColor: COLORS.accentGlow,
  },
  addExText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', color: COLORS.accent, letterSpacing: 1.5,
  },

  noExercises: {
    alignItems: 'center', paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  noExercisesText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.md, color: COLORS.textMuted,
  },

  statXPTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm,
    fontWeight: '700', color: COLORS.primary,
    letterSpacing: 2, marginBottom: SPACING.sm,
  },
  statXPRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  statXPLabel: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.md, fontWeight: '700' },
  statXPValue: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.md, fontWeight: '700' },

  actions: { marginTop: SPACING.xl, gap: SPACING.md },
  finishButton: {
    borderRadius: BORDER_RADIUS.lg, overflow: 'hidden',
    shadowColor: COLORS.success, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.base,
  },
  actionText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.base,
    fontWeight: '700', color: '#fff', letterSpacing: 1,
  },
  cancelButton: { alignItems: 'center', paddingVertical: SPACING.md },
  cancelText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.md, color: COLORS.danger, fontWeight: '500' },
  stretchButton: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.accent + '40', overflow: 'hidden',
  },
  stretchButtonInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, paddingVertical: SPACING.md, backgroundColor: COLORS.accentGlow,
  },
  stretchButtonText: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.md,
    fontWeight: '600', color: COLORS.accent,
  },

  // Rest Timer
  restTimerBar: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  restTimerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  restTimerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  restTimerLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  restTimerText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  restSkipText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: BORDER_RADIUS.sm,
  },
  restProgressOuter: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  restProgressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    // backgroundColor is driven by interpolateColor in restProgressStyle (UI thread)
  },
  restConfigRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  restConfigLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  restConfigControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  restConfigValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 48,
    textAlign: 'center',
  },
});
