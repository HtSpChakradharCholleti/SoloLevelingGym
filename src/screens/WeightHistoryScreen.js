import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import SystemPanel from '../components/SystemPanel';

export default function WeightHistoryScreen({ navigation }) {
  const { weightHistory } = usePlayer();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  // Calculate stats
  const weights = weightHistory.map(h => h.weight);
  const maxWeight = Math.max(...weights, 1);
  const minWeight = Math.min(...weights, maxWeight);
  const avgWeight = weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SystemPanel>
          <View style={styles.header}>
            <MaterialCommunityIcons name="history" size={22} color={COLORS.accent} />
            <Text style={styles.headerTitle}>WEIGHT LOG HISTORY</Text>
          </View>
          <Text style={styles.headerSub}>
            Tracking your physical vessel's evolution through the system.
          </Text>
        </SystemPanel>

        {/* Stats Summary Area */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AVERAGE</Text>
            <Text style={styles.statValue}>{avgWeight}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LOWEST</Text>
            <Text style={styles.statValue}>{minWeight}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>HIGHEST</Text>
            <Text style={styles.statValue}>{maxWeight}</Text>
          </View>
        </View>

        {/* History List */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>BATTLE RECORDS (WEIGHT)</Text>
          
          {weightHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="scale-off" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No logs found in the system archives.</Text>
            </View>
          ) : (
            weightHistory.map((entry, index) => {
              // Calculate relative "power bar" width
              const barWidth = ((entry.weight / maxWeight) * 100).toFixed(0) + '%';
              
              return (
                <Animated.View 
                  key={entry.date} 
                  entering={FadeInDown.delay(index * 50).duration(400)}
                  style={styles.historyCard}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardDate}>{formatDate(entry.date)}</Text>
                    <Text style={styles.cardWeight}>{entry.weight} {entry.unit}</Text>
                  </View>
                  
                  {/* "System" Power Bar */}
                  <View style={styles.powerBarBg}>
                    <LinearGradient
                      colors={[COLORS.accentDark, COLORS.accent]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.powerBarFill, { width: barWidth }]}
                    />
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={[COLORS.surfaceLight, COLORS.surface]}
            style={styles.backGradient}
          >
            <Text style={styles.backText}>RETURN TO PROFILE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
    letterSpacing: 2,
  },
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  statLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  listContainer: {
    marginTop: SPACING.md,
  },
  listTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 2,
    marginBottom: SPACING.base,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardDate: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  cardWeight: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.accent,
  },
  powerBarBg: {
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  powerBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  backGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  backText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});
