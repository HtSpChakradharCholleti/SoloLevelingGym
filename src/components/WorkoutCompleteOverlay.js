// Cinematic "DUNGEON CLEARED" overlay that punctuates a finished workout.
// Sits in the same overlay slot as LevelUpOverlay and is gated by App.js
// so it never competes with a level-up moment in the same frame.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import {
  COLORS,
  STAT_COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  LETTER_SPACING,
  LINE_HEIGHTS,
} from '../theme';
import { usePlayer } from '../store/PlayerContext';
import useShapeStyles from '../utils/useShapeStyles';
import SparkleBurst from './SparkleBurst';

/**
 * Count-up text driven by requestAnimationFrame on the JS thread.
 * Uses ease-out-cubic so the number lands smoothly on the target.
 */
function CountUp({ target, duration = 900, delay = 0, style }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame;
    const startAt = Date.now() + delay;
    const step = () => {
      const now = Date.now();
      if (now < startAt) {
        frame = requestAnimationFrame(step);
        return;
      }
      const elapsed = now - startAt;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);
  return <Text style={style}>{val}</Text>;
}

function formatDuration(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const WorkoutCompleteOverlay = ({ data, onDismiss }) => {
  const { settings } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;
  const styles = useShapeStyles(makeStyles);

  const overlayOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  const contentScale = useRef(new Animated.Value(animationsEnabled ? 0.92 : 1)).current;
  const contentOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  const tailOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;

  useEffect(() => {
    if (!animationsEnabled) return;
    Animated.sequence([
      Animated.timing(overlayOpacity, {
        toValue: 1, duration: 280, useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentScale, {
          toValue: 1, duration: 420, easing: Easing.out(Easing.exp), useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 420, useNativeDriver: true,
        }),
      ]),
      Animated.timing(tailOpacity, {
        toValue: 1, duration: 380, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!data) return null;

  const {
    xpEarned = 0,
    duration = 0,
    setsCompleted = 0,
    totalSets = 0,
    exerciseCount = 0,
    statXPEarned = {},
  } = data;

  // Pick the top-earning stat for the highlight chip
  const topStat = Object.entries(statXPEarned)
    .sort((a, b) => b[1] - a[1])[0];
  const topStatColor = topStat ? (STAT_COLORS[topStat[0]] || COLORS.accent) : COLORS.accent;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents="box-none"
    >
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
        <Animated.View style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          },
        ]}>
          {/* Halo + sparkle behind the icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconHalo} />
            <MaterialCommunityIcons name="trophy" size={56} color={COLORS.accent} />
            {animationsEnabled && (
              <SparkleBurst
                count={14}
                radius={90}
                duration={900}
                colors={[COLORS.accent, COLORS.warning, COLORS.primary]}
              />
            )}
          </View>

          <Text style={styles.title}>DUNGEON CLEARED</Text>
          <Text style={styles.subtitle}>The system acknowledges your conquest, Hunter.</Text>

          {/* XP earned — the headline reward */}
          <View style={styles.xpBlock}>
            <Text style={styles.xpLabel}>XP EARNED</Text>
            <View style={styles.xpRow}>
              <Text style={[styles.xpPlus, { color: COLORS.accent }]}>+</Text>
              <CountUp
                target={xpEarned}
                duration={900}
                delay={animationsEnabled ? 350 : 0}
                style={[styles.xpValue, { color: COLORS.accent }]}
              />
            </View>
          </View>

          {/* Stats grid */}
          <Animated.View style={[styles.statsRow, { opacity: tailOpacity }, SHADOWS.soft]}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{setsCompleted}/{totalSets}</Text>
              <Text style={styles.statLabel}>SETS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{formatDuration(duration)}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{exerciseCount}</Text>
              <Text style={styles.statLabel}>MOVES</Text>
            </View>
          </Animated.View>

          {/* Top stat callout */}
          {topStat && (
            <Animated.View
              style={[
                styles.topStat,
                { opacity: tailOpacity, borderColor: topStatColor + '60' },
              ]}
            >
              <View style={[styles.topStatDot, { backgroundColor: topStatColor }]} />
              <Text style={[styles.topStatLabel, { color: topStatColor }]}>
                {topStat[0]} +{topStat[1]} XP
              </Text>
              <MaterialCommunityIcons
                name="trending-up"
                size={16}
                color={topStatColor}
              />
            </Animated.View>
          )}

          <Animated.Text style={[styles.tapHint, { opacity: tailOpacity }]}>
            Tap anywhere to continue
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const makeStyles = () => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 990,
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
    maxWidth: 420,
  },
  iconWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  iconHalo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent + '14',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: FONT_SIZES.xxxl * LINE_HEIGHTS.heading,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  xpBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  xpLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  xpPlus: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  xpValue: {
    fontFamily: FONTS.heading,
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: 60,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.base,
    minWidth: 280,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontFamily: FONTS.heading,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.surfaceBorder,
  },
  topStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.surface,
  },
  topStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  topStatLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tapHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
    letterSpacing: 1,
  },
});

WorkoutCompleteOverlay.propTypes = {
  data: PropTypes.shape({
    xpEarned: PropTypes.number,
    duration: PropTypes.number,
    setsCompleted: PropTypes.number,
    totalSets: PropTypes.number,
    exerciseCount: PropTypes.number,
    statXPEarned: PropTypes.object,
  }),
  onDismiss: PropTypes.func.isRequired,
};

WorkoutCompleteOverlay.defaultProps = {
  data: null,
};

export default WorkoutCompleteOverlay;

