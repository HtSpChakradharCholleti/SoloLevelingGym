import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RANK_COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { getExercisesForDungeon } from '../data/exercises';

const DungeonCard = ({ dungeon, onPress, index = 0 }) => {
  const rankColor = RANK_COLORS[dungeon.rank] || COLORS.textSecondary;
  const statColor = STAT_COLORS[dungeon.stat] || COLORS.primary;
  const exercises = getExercisesForDungeon(dungeon.id);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify().damping(14)}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, SHADOWS.soft, animatedStyle]}>
        <Pressable
          onPress={() => onPress(dungeon)}
          onPressIn={() => scale.value = withSpring(0.95, { damping: 12 })}
          onPressOut={() => scale.value = withSpring(1, { damping: 12 })}
        >
          <View style={[styles.inner, SHADOWS.inner]}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={dungeon.icon} size={24} color={statColor} />
            </View>
            <Text style={styles.name} numberOfLines={1}>{dungeon.name}</Text>
            <Text style={styles.subtitle}>{dungeon.subtitle}</Text>
            <View style={styles.footer}>
              <View style={styles.rankTag}>
                <View style={[styles.dot, { backgroundColor: rankColor }]} />
                <Text style={[styles.rankText, { color: COLORS.textSecondary }]}>
                  Rank {dungeon.rank}
                </Text>
              </View>
              <Text style={styles.exerciseCount}>{exercises.length} Excs</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  wrapper: { width: '48%', marginBottom: SPACING.md },
  container: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  inner: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', overflow: 'hidden' },
  iconContainer: { width: 44, height: 44, borderRadius: BORDER_RADIUS.round, backgroundColor: COLORS.surfaceLight, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  name: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder },
  rankTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  rankText: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  exerciseCount: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
});
export default DungeonCard;
