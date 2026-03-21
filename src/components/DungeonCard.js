import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, interpolateColor } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RANK_COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { getExercisesForDungeon } from '../data/exercises';

const DungeonCard = ({ dungeon, onPress, index = 0 }) => {
  const rankColor = RANK_COLORS[dungeon.rank] || COLORS.textSecondary;
  const statColor = STAT_COLORS[dungeon.stat] || COLORS.primary;
  const exercises = getExercisesForDungeon(dungeon.id);

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(0.7, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      glowOpacity.value,
      [0.3, 0.7],
      ['rgba(255,255,255,0.05)', rankColor]
    ),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    shadowColor: rankColor,
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(600)}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, SHADOWS.soft, animatedStyle]}>
        <Pressable
          onPress={() => onPress(dungeon)}
          onPressIn={() => scale.value = withTiming(0.97, { duration: 150 })}
          onPressOut={() => scale.value = withTiming(1, { duration: 150 })}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.03)', 'transparent']}
            style={styles.inner}
          >
            <Animated.View style={[styles.glowOverlay, glowStyle]} />
            
            <View style={[styles.iconContainer, { borderColor: `${statColor}33` }]}>
              <MaterialCommunityIcons name={dungeon.icon} size={24} color={statColor} />
            </View>
            
            <Text style={styles.name} numberOfLines={1}>{dungeon.name}</Text>
            <Text style={styles.subtitle}>{dungeon.subtitle}</Text>
            
            <View style={styles.footer}>
              <View style={styles.rankTag}>
                <View style={[styles.dot, { backgroundColor: rankColor }]} />
                <Text style={styles.rankText}>
                  Rank {dungeon.rank}
                </Text>
              </View>
              <Text style={styles.exerciseCount}>{exercises.length} Excs</Text>
            </View>
          </LinearGradient>
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
  inner: { 
    borderRadius: BORDER_RADIUS.lg, 
    padding: SPACING.md, 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: BORDER_RADIUS.round, 
    backgroundColor: COLORS.surfaceLight, 
    borderWidth: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.sm 
  },
  name: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.base, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder },
  rankTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  rankText: { 
    fontFamily: FONTS.heading, 
    fontSize: FONT_SIZES.xs, 
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  exerciseCount: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
});
export default DungeonCard;
