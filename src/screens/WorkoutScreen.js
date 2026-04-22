import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, TextInput, FlatList, SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import { EXERCISES, DUNGEONS } from '../data/exercises';
import SystemPanel from '../components/SystemPanel';
import XPToast from '../components/XPToast';

// ─── Inline ExerciseRow with remove button ────────────────────────────────────
function ExerciseRow({ exercise, completedSets = [], totalSets, onCompleteSet, onRemove, index }) {
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
        </View>
      </View>

      {/* Right side: set buttons + trash */}
      <View style={rowStyles.right}>
        <View style={rowStyles.setsRow}>
          {Array.from({ length: totalSets }, (_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                rowStyles.setBtn,
                completedSets[i] && { backgroundColor: statColor, borderColor: statColor },
              ]}
              onPress={() => !completedSets[i] && onCompleteSet(exercise.id, i)}
              disabled={!!completedSets[i]}
            >
              {completedSets[i] ? (
                <MaterialCommunityIcons name="check" size={12} color={COLORS.background} />
              ) : (
                <Text style={rowStyles.setNum}>{i + 1}</Text>
              )}
            </TouchableOpacity>
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
  },
  setNum: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
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

// ─── Main WorkoutScreen ───────────────────────────────────────────────────────
export default function WorkoutScreen({ navigation }) {
  // Opt out of React Compiler — beta hoists activeWorkout.exercises past the
  // null guard below, crashing on initial render when no workout is active.
  'use no memo';

  const {
    activeWorkout,
    completeExerciseSet,
    finishWorkout,
    cancelWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
  } = usePlayer();

  useKeepAwake();
  const [elapsed, setElapsed] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (activeWorkout) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeWorkout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = useCallback((exerciseId, setIndex) => {
    if (!activeWorkout) return;
    const exercise = activeWorkout.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    completeExerciseSet(exerciseId, setIndex, exercise.baseXP, exercise.stat);
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, amount: exercise.baseXP, stat: exercise.stat }]);
  }, [activeWorkout, completeExerciseSet]);

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
    finishWorkout();
    navigation.navigate('Profile');
  };

  const handleCancel = () => {
    Alert.alert(
      'Abandon Dungeon?',
      'All progress in this workout will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Abandon', style: 'destructive',
          onPress: () => { cancelWorkout(); navigation.navigate('Dungeons'); },
        },
      ]
    );
  };

  // No active workout
  if (!activeWorkout) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="sword-cross" size={60} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No Active Dungeon</Text>
        <Text style={styles.emptySubtitle}>Select a dungeon to start your training</Text>
        <TouchableOpacity
          style={styles.goButton}
          onPress={() => navigation.navigate('Dungeons')}
        >
          <LinearGradient
            colors={[COLORS.accentDark, COLORS.accent]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.goButtonGradient}
          >
            <Text style={styles.goButtonText}>SELECT DUNGEON</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
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
              <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
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

        {activeWorkout.exercises.length === 0 ? (
          <View style={styles.noExercises}>
            <MaterialCommunityIcons name="dumbbell" size={32} color={COLORS.textMuted} />
            <Text style={styles.noExercisesText}>No exercises — tap ADD to pick some</Text>
          </View>
        ) : (
          activeWorkout.exercises.map((exercise, index) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              completedSets={activeWorkout.completedSets[exercise.id] || []}
              totalSets={exercise.sets}
              onCompleteSet={handleCompleteSet}
              onRemove={handleRemoveExercise}
              index={index}
            />
          ))
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
            onPress={() => navigation.navigate('Stretching')}
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
});
