// React & React Native
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

// Third-party
import Animated, { FadeInLeft, Layout, useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, interpolateColor } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS, LETTER_SPACING, LINE_HEIGHTS } from '../theme';
import { usePlayer } from '../store/PlayerContext';

/**
 * Quest card with animated glow border and completion state.
 * Shows quest text, stat badge, XP reward, and completion checkbox.
 * @param {{ id: string, text: string, stat: string, xpReward: number, completed: bool, isBonus: bool }} quest - Quest data
 * @param { function } onComplete - Callback when quest is tapped to complete
 * @param { number } index - Position index for staggered entry animation
 */

const QuestCard = ({ quest, onComplete, index = 0 }) => {
  const statColor = quest.stat === 'ALL' ? COLORS.warning : STAT_COLORS[quest.stat] || COLORS.primary;
  const { settings } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);

  React.useEffect(() => {
    if (!animationsEnabled) return;
    glowOpacity.value = withRepeat(
      withTiming(0.5, { duration: 1500 }),
      -1,
      true
    );
  }, [animationsEnabled]);

  const animatedStyle = useAnimatedStyle(() => ({ 
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      glowOpacity.value,
      [0.2, 0.5],
      ['rgba(255,255,255,0.05)', statColor]
    ),
  }));

  return (
    <Animated.View
      entering={animationsEnabled ? FadeInLeft.delay(index * 100).duration(500) : undefined}
      layout={animationsEnabled ? Layout.duration(400) : undefined}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, SHADOWS.card, quest.completed && styles.completed, animatedStyle]}>
        <Pressable
          onPress={() => {
            if (quest.completed) return;
            // Spring pop micro-interaction — immediate visual confirmation of the action
            scale.value = withSpring(1.04, { damping: 6, stiffness: 300 }, () => {
              scale.value = withSpring(1, { damping: 10, stiffness: 200 });
            });
            onComplete(quest);
          }}
          onPressIn={() => !quest.completed && (scale.value = withTiming(0.98, { duration: 100 }))}
          onPressOut={() => {}}
          disabled={quest.completed}
        >
          <View style={[styles.inner, SHADOWS.inner]}>
            <View style={styles.checkboxArea}>
              <View style={[styles.checkbox, quest.completed && { backgroundColor: statColor, borderColor: statColor }]}>
                {quest.completed && <MaterialCommunityIcons name="check" size={16} color={COLORS.background} />}
              </View>
            </View>
            <View style={styles.content}>
              <Text style={[styles.questText, quest.completed && styles.questTextCompleted]}>
                {quest.isBonus && '⭐ '}{quest.text}
              </Text>
              <View style={styles.metaRow}>
                {quest.stat !== 'ALL' && (
                  <View style={styles.statTag}>
                    <View style={[styles.statDot, { backgroundColor: statColor }]} />
                    <Text style={styles.statBadge}>{quest.stat}</Text>
                  </View>
                )}
                {quest.isBonus && (
                  <View style={styles.statTag}>
                    <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
                    <Text style={[styles.statBadge, { color: COLORS.warning }]}>BONUS</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.xpArea}>
              <Text style={[styles.xpValue, { color: statColor }]}>+{quest.xpReward}</Text>
              <Text style={styles.xpLabel}>XP</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm },
  container: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.background },
  inner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  completed: { opacity: 0.5 },
  checkboxArea: { marginRight: SPACING.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  content: { flex: 1 },
  questText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    letterSpacing: LETTER_SPACING.snug,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.body,
  },
  questTextCompleted: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  statTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statBadge: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1, color: COLORS.textSecondary },
  xpArea: { alignItems: 'center', marginLeft: SPACING.md, paddingLeft: SPACING.sm, borderLeftWidth: 1, borderLeftColor: COLORS.surfaceBorder },
  xpValue: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  xpLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
});
QuestCard.propTypes = {
  quest: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    stat: PropTypes.string,
    xpReward: PropTypes.number,
    completed: PropTypes.bool,
    isBonus: PropTypes.bool,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  index: PropTypes.number,
};

QuestCard.defaultProps = {
  index: 0,
};

export default QuestCard;
