import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, RANK_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { DUNGEONS, getExercisesForDungeon } from '../data/exercises';
import { usePlayer } from '../store/PlayerContext';
import { getWorkoutSuggestion } from '../utils/suggestions';
import DungeonCard from '../components/DungeonCard';
import SystemPanel from '../components/SystemPanel';
import SoundManager from '../utils/SoundManager';

export default function DungeonsScreen({ navigation }) {
  const { startWorkout, workoutHistory, stats } = usePlayer();
  const [selectedDungeon, setSelectedDungeon] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);

  // Compute workout suggestion
  const suggestion = useMemo(
    () => getWorkoutSuggestion(workoutHistory, stats),
    [workoutHistory, stats]
  );

  const openDungeon = (dungeon) => {
    SoundManager.playTap();
    const exercises = getExercisesForDungeon(dungeon.id);
    setSelectedDungeon(dungeon);
    setSelectedExercises(exercises.map(e => ({ ...e, selected: true })));
  };

  const closeDungeon = () => {
    SoundManager.playTap();
    setSelectedDungeon(null);
    setSelectedExercises([]);
  };

  const toggleExercise = (exerciseId) => {
    setSelectedExercises(prev =>
      prev.map(e => e.id === exerciseId ? { ...e, selected: !e.selected } : e)
    );
  };

  const handleStartWorkout = () => {
    const exercises = selectedExercises.filter(e => e.selected);
    if (exercises.length === 0) return;
    SoundManager.playDungeonEnter();
    startWorkout(exercises);
    closeDungeon();
    navigation.navigate('Workout');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <SystemPanel glowColor={COLORS.accent}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="gate" size={22} color={COLORS.accent} />
            <Text style={styles.headerTitle}>DUNGEON SELECT</Text>
          </View>
          <Text style={styles.headerSub}>
            Push · Pull · Legs rotation. Choose your training day and enter the dungeon.
          </Text>
        </SystemPanel>

        {/* Today's Suggestion */}
        {suggestion && suggestion.dungeon && (
          <TouchableOpacity
            style={styles.suggestionCard}
            onPress={() => openDungeon(suggestion.dungeon)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.accentGlow, COLORS.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.suggestionGradient}
            >
              <View style={styles.suggestionHeader}>
                <View style={styles.suggestionBadge}>
                  <MaterialCommunityIcons name="compass" size={14} color={COLORS.accent} />
                  <Text style={styles.suggestionBadgeText}>SYSTEM SUGGESTION</Text>
                </View>
                {suggestion.daysSinceLastWorked !== null && (
                  <Text style={styles.suggestionDays}>
                    {suggestion.daysSinceLastWorked === 0
                      ? 'Today'
                      : suggestion.daysSinceLastWorked === 1
                      ? '1 day ago'
                      : `${suggestion.daysSinceLastWorked}d ago`}
                  </Text>
                )}
              </View>

              <View style={styles.suggestionBody}>
                <View style={[
                  styles.suggestionIcon,
                  { borderColor: (STAT_COLORS[suggestion.dungeon.stat] || COLORS.accent) + '40' }
                ]}>
                  <MaterialCommunityIcons
                    name={suggestion.dungeon.icon}
                    size={28}
                    color={STAT_COLORS[suggestion.dungeon.stat] || COLORS.accent}
                  />
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{suggestion.dungeon.name}</Text>
                  <Text style={styles.suggestionSub}>{suggestion.dungeon.subtitle}</Text>
                  <Text style={styles.suggestionReason} numberOfLines={2}>
                    {suggestion.reason}
                  </Text>
                </View>
                <View style={styles.suggestionArrow}>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.accent} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Dungeon Grid */}
        <View style={styles.grid}>
          {DUNGEONS.map((dungeon, index) => (
            <DungeonCard
              key={dungeon.id}
              dungeon={dungeon}
              onPress={openDungeon}
              index={index}
            />
          ))}
        </View>

        {/* Stretching Entry Point */}
        <TouchableOpacity
          style={styles.stretchEntry}
          onPress={() => navigation.navigate('Stretching')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.surface, COLORS.surfaceLight]}
            style={styles.stretchEntryGradient}
          >
            <View style={styles.stretchEntryIcon}>
              <MaterialCommunityIcons name="yoga" size={24} color={COLORS.accent} />
            </View>
            <View style={styles.stretchEntryInfo}>
              <Text style={styles.stretchEntryTitle}>Stretch Timer</Text>
              <Text style={styles.stretchEntrySub}>Guided cooldown stretching for shoulders, triceps, forearms &amp; more</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Dungeon Detail Modal */}
      <Modal
        visible={!!selectedDungeon}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDungeon}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedDungeon && (
              <>
                {/* Modal Header */}
                <LinearGradient
                  colors={[COLORS.surface, COLORS.surfaceLight]}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalTopRow}>
                    <View>
                      <Text style={styles.modalTitle}>{selectedDungeon.name}</Text>
                      <Text style={styles.modalSubtitle}>{selectedDungeon.subtitle}</Text>
                    </View>
                    <TouchableOpacity onPress={closeDungeon} style={styles.closeBtn}>
                      <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalDesc}>{selectedDungeon.description}</Text>

                  <View style={styles.modalMeta}>
                    <View style={[styles.metaTag, { borderColor: RANK_COLORS[selectedDungeon.rank] + '60' }]}>
                      <Text style={[styles.metaText, { color: RANK_COLORS[selectedDungeon.rank] }]}>
                        Rank {selectedDungeon.rank}
                      </Text>
                    </View>
                    <View style={[styles.metaTag, { borderColor: STAT_COLORS[selectedDungeon.stat] + '60' }]}>
                      <Text style={[styles.metaText, { color: STAT_COLORS[selectedDungeon.stat] }]}>
                        {selectedDungeon.stat}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Exercise List */}
                <ScrollView style={styles.exerciseList}>
                  <Text style={styles.selectLabel}>Select exercises for your workout:</Text>
                  {selectedExercises.map(exercise => {
                    const statColor = STAT_COLORS[exercise.stat] || COLORS.primary;
                    return (
                      <TouchableOpacity
                        key={exercise.id}
                        style={[
                          styles.exerciseRow,
                          exercise.selected && { borderColor: statColor + '40' },
                        ]}
                        onPress={() => toggleExercise(exercise.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.exerciseCheck,
                          exercise.selected && { backgroundColor: statColor, borderColor: statColor },
                        ]}>
                          {exercise.selected && (
                            <MaterialCommunityIcons name="check" size={14} color="#fff" />
                          )}
                        </View>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseMeta}>
                            {exercise.defaultSets} sets × {exercise.repRange || `${exercise.defaultReps} reps`} • +{exercise.baseXP} XP
                          </Text>
                          {exercise.muscle && (
                            <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Start Workout Button */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStartWorkout}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.primaryDark, COLORS.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startButtonGradient}
                    >
                      <MaterialCommunityIcons name="sword" size={20} color="#fff" />
                      <Text style={styles.startButtonText}>
                        ENTER DUNGEON ({selectedExercises.filter(e => e.selected).length} exercises)
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.base,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.surfaceBorder,
  },
  modalHeader: {
    padding: SPACING.xl,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  modalDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  modalMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metaTag: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  metaText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  exerciseList: {
    paddingHorizontal: SPACING.xl,
  },
  selectLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  exerciseCheck: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseMeta: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  exerciseMuscle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  modalFooter: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  startButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.base,
  },
  startButtonText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },

  // ─── Suggestion Card ──────────────────────
  suggestionCard: {
    marginTop: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  suggestionGradient: {
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  suggestionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
  },
  suggestionBadgeText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  suggestionDays: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  suggestionBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 1,
  },
  suggestionSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  suggestionReason: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    fontStyle: 'italic',
  },
  suggestionArrow: {
    marginLeft: SPACING.sm,
  },

  // ─── Stretch Entry ───────────────────────
  stretchEntry: {
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  stretchEntryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
  },
  stretchEntryIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stretchEntryInfo: {
    flex: 1,
  },
  stretchEntryTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  stretchEntrySub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});
