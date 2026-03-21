import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';

const QuestCard = ({ quest, onComplete }) => {
  const statColor = quest.stat === 'ALL'
    ? COLORS.warning
    : STAT_COLORS[quest.stat] || COLORS.primary;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        quest.completed && styles.completed,
        { borderLeftColor: statColor },
      ]}
      onPress={() => !quest.completed && onComplete(quest)}
      activeOpacity={quest.completed ? 1 : 0.7}
      disabled={quest.completed}
    >
      <View style={styles.checkboxArea}>
        <View style={[
          styles.checkbox,
          quest.completed && { backgroundColor: statColor, borderColor: statColor },
        ]}>
          {quest.completed && (
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
          )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[
          styles.questText,
          quest.completed && styles.questTextCompleted,
        ]}>
          {quest.isBonus && '⭐ '}{quest.text}
        </Text>
        <View style={styles.metaRow}>
          {quest.stat !== 'ALL' && (
            <Text style={[styles.statBadge, { color: statColor }]}>
              {quest.stat}
            </Text>
          )}
          {quest.isBonus && (
            <Text style={[styles.statBadge, { color: COLORS.warning }]}>
              BONUS
            </Text>
          )}
        </View>
      </View>

      <View style={styles.xpArea}>
        <Text style={[styles.xpValue, { color: statColor }]}>
          +{quest.xpReward}
        </Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  completed: {
    opacity: 0.5,
  },
  checkboxArea: {
    marginRight: SPACING.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  questText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  questTextCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statBadge: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  xpArea: {
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  xpValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
  },
  xpLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});

export default QuestCard;
