// React & React Native
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Easing } from 'react-native';

// Third-party
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, STAT_COLORS, RANK_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS, LETTER_SPACING, LINE_HEIGHTS } from '../theme';
import { RANK_TITLES } from '../utils/leveling';
import { getDungeonFromLastWeek } from '../utils/suggestions';
import { usePlayer } from '../store/PlayerContext';
import { useRouter } from 'expo-router';

// Components
import RankBadge from './RankBadge';

const { width, height } = Dimensions.get('window');

/**
 * Full-screen overlay displayed on level-up events.
 * Shows a cinematic fade-in with scale animation (when animations are enabled).
 * @param {{ oldLevel: number, newLevel: number, newRank: string, rankUp: bool }} data - Level-up event data
 * @param { function } onDismiss - Callback when overlay is tapped to dismiss
 */

const LevelUpOverlay = ({ data, onDismiss }) => {
  const router = useRouter();
  const { settings, workoutHistory } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;

  // System pick: same weekday last week — gives the user a concrete "next move"
  // suggestion right in the level-up moment.
  const lastWeekPick = useMemo(
    () => getDungeonFromLastWeek(workoutHistory || []),
    [workoutHistory]
  );

  const handleGoToSuggestion = () => {
    onDismiss();
    router.push('/(tabs)/dungeons');
  };

  const overlayOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  const contentScale = useRef(new Animated.Value(animationsEnabled ? 0.9 : 1)).current;
  const contentOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  const textOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;

  useEffect(() => {
    if (!animationsEnabled) return;
    // Sequence of animations for CRED-like sleek entry
    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!data) return null;

  const rankColor = RANK_COLORS[data.newRank] || COLORS.primary;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(4,4,5,0.97)', 'rgba(8,8,14,0.95)', 'rgba(4,4,5,0.98)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={onDismiss}
      >
        {/* Content */}
        <Animated.View style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          },
        ]}>
          <Text style={[styles.levelUpLabel, { color: COLORS.textPrimary }]}>
            LEVEL UP
          </Text>

          {/* Level display */}
          <View style={styles.levelRow}>
            <Text style={styles.oldLevel}>Lv.{data.oldLevel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textSecondary} />
            <Text style={[styles.newLevel, { color: rankColor }]}>Lv.{data.newLevel}</Text>
          </View>

          {/* Rank badge */}
          <View style={styles.rankArea}>
            <RankBadge rank={data.newRank} size="large" />
          </View>

          {/* Rank up message */}
          {data.rankUp && (
            <Animated.View style={[styles.rankUpBanner, { opacity: textOpacity }, SHADOWS.soft]}>
              <View style={[styles.rankUpInner, SHADOWS.inner]}>
                <Text style={[styles.rankUpText, { color: rankColor }]}>
                  RANK UP: {RANK_TITLES[data.newRank]}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* System-chosen dungeon — based on what the hunter trained on
              this same weekday a week ago. Tapping deep-links to Dungeons. */}
          {lastWeekPick?.dungeon && (
            <Animated.View style={[styles.suggestionWrap, { opacity: textOpacity }]}>
              <Text style={styles.suggestionLabel}>SYSTEM RECOMMENDS</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleGoToSuggestion}
                style={styles.suggestionCard}
              >
                <View style={[
                  styles.suggestionIconWrap,
                  { borderColor: (STAT_COLORS[lastWeekPick.dungeon.stat] || COLORS.accent) + '60' },
                ]}>
                  <MaterialCommunityIcons
                    name={lastWeekPick.dungeon.icon}
                    size={22}
                    color={STAT_COLORS[lastWeekPick.dungeon.stat] || COLORS.accent}
                  />
                </View>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{lastWeekPick.dungeon.name}</Text>
                  <Text style={styles.suggestionSub}>
                    {lastWeekPick.dungeon.splitLabel} • You trained this 7 days ago
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={COLORS.accent}
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          <Animated.Text style={[styles.tapText, { opacity: textOpacity }]}>
            Tap anywhere to continue
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  touchArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  levelUpLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.heading,
    marginBottom: SPACING.xl,
    opacity: 0.9,
    color: COLORS.textPrimary,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  oldLevel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  newLevel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.heading,
  },
  rankArea: {
    marginBottom: SPACING.xxl,
  },
  rankUpBanner: {
    marginBottom: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  rankUpInner: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
  },
  rankUpText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  tapText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
    letterSpacing: 1,
  },

  // ── System recommendation card ─────────────────────────────────
  suggestionWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  suggestionLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 2.5,
    marginBottom: SPACING.sm,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.base,
    minWidth: 260,
  },
  suggestionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  suggestionSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 1,
    letterSpacing: 0.5,
  },
});

LevelUpOverlay.propTypes = {
  data: PropTypes.shape({
    oldLevel: PropTypes.number,
    newLevel: PropTypes.number,
    newRank: PropTypes.string,
    rankUp: PropTypes.bool,
  }),
  onDismiss: PropTypes.func.isRequired,
};

LevelUpOverlay.defaultProps = {
  data: null,
};

export default LevelUpOverlay;
