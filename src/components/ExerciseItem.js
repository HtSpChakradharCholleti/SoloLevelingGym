import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';

const ExerciseItem = ({ exercise, completedSets = [], totalSets, onCompleteSet, showAction = true }) => {
  const statColor = STAT_COLORS[exercise.stat] || COLORS.primary;
  const completedCount = completedSets.filter(Boolean).length;
  const allDone = completedCount >= totalSets;

  return (
    <View style={[styles.container, allDone && styles.containerDone]}>
      <View style={styles.left}>
        <View style={[styles.iconBg, { backgroundColor: statColor + '20' }]}>
          <MaterialCommunityIcons
            name={exercise.icon || 'dumbbell'}
            size={20}
            color={statColor}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, allDone && styles.nameDone]}>{exercise.name}</Text>
          <Text style={styles.meta}>
            {totalSets} sets × {exercise.reps} reps • +{exercise.baseXP} XP
          </Text>
        </View>
      </View>

      {showAction && (
        <View style={styles.setsRow}>
          {Array.from({ length: totalSets }, (_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.setButton,
                completedSets[i] && { backgroundColor: statColor, borderColor: statColor },
              ]}
              onPress={() => !completedSets[i] && onCompleteSet(exercise.id, i)}
              disabled={completedSets[i]}
            >
              {completedSets[i] ? (
                <MaterialCommunityIcons name="check" size={12} color="#fff" />
              ) : (
                <Text style={styles.setNum}>{i + 1}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  containerDone: {
    opacity: 0.6,
    borderColor: COLORS.success + '30',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  meta: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  setsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  setButton: {
    width: 26,
    height: 26,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNum: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});

export default ExerciseItem;
