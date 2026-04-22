import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInLeft, Layout } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const ExerciseItem = ({ exercise, completedSets = [], totalSets, onCompleteSet, showAction = true, index = 0 }) => {
  const statColor = STAT_COLORS[exercise.stat] || COLORS.primary;
  const completedCount = completedSets.filter(Boolean).length;
  const allDone = completedCount >= totalSets;

  return (
    <Animated.View 
      entering={FadeInLeft.delay(index * 100).duration(500)}
      layout={Layout.duration(400)}
      style={styles.wrapper}
    >
      <View style={[styles.container, SHADOWS.soft, allDone && styles.containerDone]}>
        <View style={[styles.inner, SHADOWS.inner]}>
          <View style={styles.left}>
            <View style={styles.iconBg}>
              <MaterialCommunityIcons name={exercise.icon || 'dumbbell'} size={18} color={statColor} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, allDone && styles.nameDone]}>{exercise.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.statDot, { backgroundColor: statColor }]} />
                <Text style={styles.meta}>
                  {totalSets} sets × {exercise.repRange || `${exercise.reps} reps`} • +{exercise.baseXP} XP
                </Text>
              </View>
              {exercise.muscle && (
                <Text style={styles.muscleTag}>{exercise.muscle}</Text>
              )}
            </View>
          </View>

          {showAction && (
            <View style={styles.setsRow}>
              {Array.from({ length: totalSets }, (_, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.setButton, completedSets[i] && { backgroundColor: statColor, borderColor: statColor }]}
                  onPress={() => !completedSets[i] && onCompleteSet(exercise.id, i)}
                  disabled={completedSets[i]}
                >
                  {completedSets[i] ? (
                    <MaterialCommunityIcons name="check" size={12} color={COLORS.background} />
                  ) : (
                    <Text style={styles.setNum}>{i + 1}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm },
  container: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.background },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  containerDone: { opacity: 0.6 },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBg: { width: 32, height: 32, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: COLORS.surfaceBorder, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  info: { flex: 1 },
  name: { fontFamily: FONTS.body, fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  nameDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDot: { width: 4, height: 4, borderRadius: 2 },
  meta: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  muscleTag: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs - 1, color: COLORS.textMuted, marginTop: 2, fontStyle: 'italic' },
  setsRow: { flexDirection: 'row', gap: SPACING.xs },
  setButton: { width: 24, height: 24, borderRadius: BORDER_RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.surfaceBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceLight },
  setNum: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '600' },
});
export default ExerciseItem;
