import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInLeft, Layout, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const QuestCard = ({ quest, onComplete, index = 0 }) => {
  const statColor = quest.stat === 'ALL' ? COLORS.warning : STAT_COLORS[quest.stat] || COLORS.primary;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInLeft.delay(index * 150).springify().damping(14)}
      layout={Layout.springify().damping(14)}
      style={styles.wrapper}
    >
      <Animated.View style={[styles.container, SHADOWS.soft, quest.completed && styles.completed, animatedStyle]}>
        <Pressable
          onPress={() => !quest.completed && onComplete(quest)}
          onPressIn={() => !quest.completed && (scale.value = withSpring(0.96, { damping: 12 }))}
          onPressOut={() => scale.value = withSpring(1, { damping: 12 })}
          disabled={quest.completed}
        >
          <View style={[styles.inner, SHADOWS.inner]}>
            <View style={styles.checkboxArea}>
              <View style={[styles.checkbox, quest.completed && { backgroundColor: statColor, borderColor: statColor }]}>
                {quest.completed && <MaterialCommunityIcons name="check" size={14} color={COLORS.background} />}
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
  checkbox: { width: 20, height: 20, borderRadius: BORDER_RADIUS.sm, borderWidth: 1.5, borderColor: COLORS.textMuted, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceLight },
  content: { flex: 1 },
  questText: { fontFamily: FONTS.body, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '500', marginBottom: SPACING.xs },
  questTextCompleted: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  statTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statBadge: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs, fontWeight: '700', letterSpacing: 1, color: COLORS.textSecondary },
  xpArea: { alignItems: 'center', marginLeft: SPACING.md, paddingLeft: SPACING.sm, borderLeftWidth: 1, borderLeftColor: COLORS.surfaceBorder },
  xpValue: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  xpLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, color: COLORS.textMuted },
});
export default QuestCard;
