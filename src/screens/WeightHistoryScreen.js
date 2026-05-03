import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { usePlayer } from '../store/PlayerContext';
import SystemPanel from '../components/SystemPanel';
import WeightChart from '../components/WeightChart';

// Colour per measurement metric — must match WeightLogModal
const METRIC_COLORS = {
  bicep: '#7c91ff',
  chest: '#ff7c7c',
  belly: '#7cffb8',
};

const METRIC_ICONS = {
  bicep: 'arm-flex',
  chest: 'human-handsup',
  belly: 'human',
};

const METRIC_LABELS = {
  bicep: 'Bicep',
  chest: 'Chest',
  belly: 'Belly / Waist',
};

const TAB_WEIGHT = 'weight';
const TAB_MEASUREMENTS = 'measurements';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export default function WeightHistoryScreen({ navigation }) {
  const { weightHistory, measurementsHistory } = usePlayer();
  const [activeTab, setActiveTab] = useState(TAB_WEIGHT);

  // ── Weight stats ──────────────────────────────────────────────────────────
  const weights = weightHistory.map(h => h.weight);
  const maxWeight = Math.max(...weights, 1);
  const minWeight = Math.min(...weights, maxWeight);
  const avgWeight = weights.length > 0
    ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
    : 0;

  // ── Measurement stats (latest value per metric) ───────────────────────────
  const latestMeasurements = {};
  ['bicep', 'chest', 'belly'].forEach(key => {
    const entry = measurementsHistory.find(e => e[key] !== undefined);
    if (entry) latestMeasurements[key] = entry[key];
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <SystemPanel>
          <View style={styles.header}>
            <MaterialCommunityIcons name="history" size={22} color={COLORS.accent} />
            <Text style={styles.headerTitle}>BODY STATS HISTORY</Text>
          </View>
          <Text style={styles.headerSub}>
            Tracking your physical vessel's evolution through the system.
          </Text>
        </SystemPanel>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_WEIGHT && styles.tabActive]}
            onPress={() => setActiveTab(TAB_WEIGHT)}
          >
            <MaterialCommunityIcons
              name="scale-bathroom"
              size={16}
              color={activeTab === TAB_WEIGHT ? COLORS.accent : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === TAB_WEIGHT && styles.tabTextActive]}>
              Weight
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_MEASUREMENTS && styles.tabActive]}
            onPress={() => setActiveTab(TAB_MEASUREMENTS)}
          >
            <MaterialCommunityIcons
              name="tape-measure"
              size={16}
              color={activeTab === TAB_MEASUREMENTS ? COLORS.accent : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === TAB_MEASUREMENTS && styles.tabTextActive]}>
              Measurements
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── WEIGHT TAB ────────────────────────────────────────────────────── */}
        {activeTab === TAB_WEIGHT && (
          <>
            {/* Weight Trend Graph */}
            <WeightChart data={weightHistory} />

            {/* Stats Summary */}
            <View style={styles.statsRow}>
              {[
                { label: 'AVERAGE', value: avgWeight },
                { label: 'LOWEST', value: minWeight },
                { label: 'HIGHEST', value: maxWeight },
              ].map(({ label, value }) => (
                <View key={label} style={styles.statBox}>
                  <Text style={styles.statLabel}>{label}</Text>
                  <Text style={styles.statValue}>{value}</Text>
                </View>
              ))}
            </View>

            {/* History list */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>BATTLE RECORDS (WEIGHT)</Text>
              {weightHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="scale-off" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No weight logs in the system archives.</Text>
                </View>
              ) : (
                weightHistory.map((entry, index) => {
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
                      <View style={styles.powerBarBg}>
                        <LinearGradient
                          colors={[COLORS.accentDark, COLORS.accent]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={[styles.powerBarFill, { width: barWidth }]}
                        />
                      </View>
                    </Animated.View>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* ── MEASUREMENTS TAB ─────────────────────────────────────────────── */}
        {activeTab === TAB_MEASUREMENTS && (
          <>
            {/* Latest snapshot cards */}
            {Object.keys(latestMeasurements).length > 0 && (
              <View style={styles.latestRow}>
                {['bicep', 'chest', 'belly'].map(key => {
                  const val = latestMeasurements[key];
                  if (val === undefined) return null;
                  const color = METRIC_COLORS[key];
                  return (
                    <View key={key} style={[styles.latestCard, { borderColor: color + '40' }]}>
                      <MaterialCommunityIcons name={METRIC_ICONS[key]} size={20} color={color} />
                      <Text style={[styles.latestLabel, { color }]}>{METRIC_LABELS[key]}</Text>
                      <Text style={styles.latestValue}>{val} <Text style={styles.latestUnit}>cm</Text></Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* History list */}
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>MEASUREMENT RECORDS</Text>
              {measurementsHistory.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="tape-measure" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No measurement logs yet. Tap LOG TODAY to start.</Text>
                </View>
              ) : (
                measurementsHistory.map((entry, index) => (
                  <Animated.View
                    key={entry.date + index}
                    entering={FadeInDown.delay(index * 50).duration(400)}
                    style={styles.historyCard}
                  >
                    <Text style={styles.cardDate}>{formatDate(entry.date)}</Text>
                    <View style={styles.metricsRow}>
                      {['bicep', 'chest', 'belly'].map(key => {
                        if (entry[key] === undefined) return null;
                        const color = METRIC_COLORS[key];
                        return (
                          <View key={key} style={[styles.metricChip, { backgroundColor: color + '15', borderColor: color + '40' }]}>
                            <MaterialCommunityIcons name={METRIC_ICONS[key]} size={13} color={color} />
                            <Text style={[styles.metricChipLabel, { color }]}>{METRIC_LABELS[key]}</Text>
                            <Text style={[styles.metricChipValue, { color }]}>{entry[key]} cm</Text>
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                ))
              )}
            </View>
          </>
        )}

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
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },

  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  headerTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xl,
    fontWeight: '700', color: COLORS.accent, letterSpacing: 2,
  },
  headerSub: { fontFamily: FONTS.body, fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 3,
    marginVertical: SPACING.base,
    gap: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accent + '50',
  },
  tabText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1,
  },
  tabTextActive: { color: COLORS.accent },

  // Weight stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  statLabel: {
    fontFamily: FONTS.heading, fontSize: 10,
    color: COLORS.textMuted, letterSpacing: 1, marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.lg,
    fontWeight: '700', color: COLORS.textPrimary,
  },

  // Latest measurement row
  latestRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  latestCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  latestLabel: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', letterSpacing: 0.5, textAlign: 'center',
  },
  latestValue: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.lg,
    fontWeight: '700', color: COLORS.textPrimary,
  },
  latestUnit: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted },

  // Shared list
  listContainer: { marginTop: SPACING.md },
  listTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm,
    fontWeight: '700', color: COLORS.textSecondary,
    letterSpacing: 2, marginBottom: SPACING.base,
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
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  cardDate: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },
  cardWeight: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.md,
    fontWeight: '700', color: COLORS.accent,
  },
  powerBarBg: { height: 4, backgroundColor: COLORS.background, borderRadius: 2, overflow: 'hidden' },
  powerBarFill: { height: '100%', borderRadius: 2 },

  // Measurement chips
  metricsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: SPACING.sm, marginTop: SPACING.sm,
  },
  metricChip: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
  },
  metricChipLabel: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.xs,
    fontWeight: '700', letterSpacing: 0.5,
  },
  metricChipValue: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center', paddingVertical: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted, marginTop: SPACING.md,
    textAlign: 'center', paddingHorizontal: SPACING.lg,
  },

  // Back button
  backButton: {
    marginTop: SPACING.xl, borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  backGradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  backText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZES.sm,
    fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1,
  },
});
