import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import SystemPanel from '../components/SystemPanel';
import QuestCard from '../components/QuestCard';
import XPToast from '../components/XPToast';

export default function DailyQuestsScreen() {
  const { dailyQuests, completeQuest } = usePlayer();
  const [toasts, setToasts] = useState([]);

  const completedCount = dailyQuests.filter(q => q.completed && !q.isBonus).length;
  const totalCount = dailyQuests.filter(q => !q.isBonus).length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const allCompleted = completedCount === totalCount;

  const handleCompleteQuest = (quest) => {
    completeQuest(quest.id, quest.xpReward, quest.stat);

    // Show toast
    const toastId = Date.now();
    setToasts(prev => [...prev, { id: toastId, amount: quest.xpReward, stat: quest.stat }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* System Window Header */}
        <SystemPanel glowColor={COLORS.primary}>
          <View style={styles.systemHeader}>
            <MaterialCommunityIcons name="alert-decagram" size={22} color={COLORS.primary} />
            <Text style={styles.systemTitle}>DAILY QUEST</Text>
          </View>

          {/* Warning Text */}
          <View style={styles.warningBox}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Failure to complete daily quests will result in penalties.
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Quest Progress</Text>
              <Text style={styles.progressValue}>{completedCount}/{totalCount}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]}>
                <LinearGradient
                  colors={allCompleted ? ['#00c853', '#00e676'] : [COLORS.primaryDark, COLORS.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </SystemPanel>

        {/* Quest Cards */}
        <View style={styles.questsSection}>
          {dailyQuests
            .filter(q => !q.isBonus)
            .map((quest, index) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleCompleteQuest}
                index={index}
              />
            ))}

          {/* Bonus Quest */}
          {dailyQuests
            .filter(q => q.isBonus)
            .map(quest => (
              <View key={quest.id} style={styles.bonusSection}>
                <Text style={styles.bonusLabel}>★ BONUS QUEST ★</Text>
                <QuestCard
                  quest={quest}
                  onComplete={handleCompleteQuest}
                  index={totalCount}
                />
              </View>
            ))}
        </View>

        {/* All Done Message */}
        {allCompleted && (
          <SystemPanel glowColor={COLORS.success}>
            <View style={styles.doneMessage}>
              <MaterialCommunityIcons name="check-decagram" size={32} color={COLORS.success} />
              <Text style={styles.doneTitle}>QUEST COMPLETE</Text>
              <Text style={styles.doneSubtitle}>All daily quests have been completed. Rest well, Hunter.</Text>
            </View>
          </SystemPanel>
        )}
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
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  systemTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 3,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warning + '10',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.warning + '20',
  },
  warningText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.warning,
    flex: 1,
    fontStyle: 'italic',
  },
  progressSection: {
    marginTop: SPACING.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  questsSection: {
    marginTop: SPACING.base,
  },
  bonusSection: {
    marginTop: SPACING.md,
  },
  bonusLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  doneMessage: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  doneTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 2,
    marginTop: SPACING.sm,
  },
  doneSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
