import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RANK_COLORS, STAT_COLORS, GRADIENTS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { getExercisesForDungeon } from '../data/exercises';

const DungeonCard = ({ dungeon, onPress }) => {
  const rankColor = RANK_COLORS[dungeon.rank] || COLORS.textSecondary;
  const statColor = STAT_COLORS[dungeon.stat] || COLORS.primary;
  const exercises = getExercisesForDungeon(dungeon.id);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(dungeon)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.surfaceLight + 'aa']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top glow line */}
        <View style={[styles.glowLine, { backgroundColor: statColor }]} />

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: statColor + '20' }]}>
          <MaterialCommunityIcons
            name={dungeon.icon}
            size={28}
            color={statColor}
          />
        </View>

        {/* Name & Info */}
        <Text style={styles.name} numberOfLines={1}>{dungeon.name}</Text>
        <Text style={styles.subtitle}>{dungeon.subtitle}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[styles.rankTag, { borderColor: rankColor + '60' }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>
              {dungeon.rank}
            </Text>
          </View>
          <Text style={styles.exerciseCount}>{exercises.length} exercises</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  gradient: {
    padding: SPACING.base,
    alignItems: 'center',
  },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  name: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rankTag: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  rankText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  exerciseCount: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});

export default DungeonCard;
