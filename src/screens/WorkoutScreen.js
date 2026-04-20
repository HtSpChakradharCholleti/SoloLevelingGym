import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import SystemPanel from '../components/SystemPanel';
import ExerciseItem from '../components/ExerciseItem';
import XPToast from '../components/XPToast';

export default function WorkoutScreen({ navigation }) {
  // Opt out of React Compiler — beta hoists activeWorkout.exercises past the
  // null guard below, crashing on initial render when no workout is active.
  'use no memo';

  const { activeWorkout, completeExerciseSet, finishWorkout, cancelWorkout } = usePlayer();
  useKeepAwake(); // Prevent screen from sleeping during workout
  const [elapsed, setElapsed] = useState(0);
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (activeWorkout) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeWorkout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = (exerciseId, setIndex) => {
    const exercise = activeWorkout.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    completeExerciseSet(exerciseId, setIndex, exercise.baseXP, exercise.stat);

    // Show toast
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, amount: exercise.baseXP, stat: exercise.stat }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFinish = () => {
    const completedAnything = Object.values(activeWorkout.completedSets || {}).some(
      sets => sets && sets.some(Boolean)
    );
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
        { text: 'Abandon', style: 'destructive', onPress: () => {
          cancelWorkout();
          navigation.navigate('Dungeons');
        }},
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
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
              <View style={[styles.progressFill, { width: `${(totalSetsCompleted / totalSets) * 100}%` }]}>
                <LinearGradient
                  colors={[COLORS.accentDark, COLORS.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </SystemPanel>

        {/* Exercise List */}
        <Text style={styles.sectionTitle}>EXERCISES</Text>
        {activeWorkout.exercises.map((exercise, index) => (
          <ExerciseItem
            key={exercise.id}
            exercise={exercise}
            completedSets={activeWorkout.completedSets[exercise.id] || []}
            totalSets={exercise.sets}
            onCompleteSet={handleCompleteSet}
            index={index}
          />
        ))}

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
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
              <Text style={styles.stretchButtonText}>Stretch & Cooldown</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelText}>Abandon Dungeon</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
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
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  goButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  goButtonGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
  },
  goButtonText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  timerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  timerArea: {},
  timerLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  timerValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  xpArea: {
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  xpValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressArea: {},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  statXPTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  statXPRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  statXPLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  statXPValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  finishButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.success,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
  },
  actionText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
    fontWeight: '500',
  },
  stretchButton: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    overflow: 'hidden',
  },
  stretchButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.accentGlow,
  },
  stretchButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.accent,
  },
});
