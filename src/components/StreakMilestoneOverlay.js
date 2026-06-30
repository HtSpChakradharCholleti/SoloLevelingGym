// Brief flame celebration shown when the player's currentStreak crosses a
// milestone day (3 / 7 / 14 / 30 / 50 / 100 / 365). Auto-dismisses after a
// short hold, but can also be tapped to dismiss immediately.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import {
  COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS,
  LETTER_SPACING, LINE_HEIGHTS, SHADOWS,
} from '../theme';
import { usePlayer } from '../store/PlayerContext';
import SparkleBurst from './SparkleBurst';

export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 365];

export function matchedMilestone(streak) {
  return STREAK_MILESTONES.includes(streak) ? streak : null;
}

const MILESTONE_TITLES = {
  3: 'ON FIRE',
  7: 'WEEK STRONG',
  14: 'TWO WEEKS!',
  30: 'MONTH WARRIOR',
  50: 'UNSTOPPABLE',
  100: 'CENTURION',
  365: 'IMMORTAL HUNTER',
};

const StreakMilestoneOverlay = ({ data, onDismiss }) => {
  const { settings } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;

  const overlayOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;
  const flameScale = useRef(new Animated.Value(animationsEnabled ? 0.5 : 1)).current;
  const textOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;

  useEffect(() => {
    if (!animationsEnabled) {
      const t = setTimeout(onDismiss, 1800);
      return () => clearTimeout(t);
    }
    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(flameScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }),
      Animated.timing(textOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 2.4 s so it feels rewarding without interrupting flow
    const t = setTimeout(onDismiss, 2400);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  const streak = data.streak ?? 0;
  const titleKey = data.milestone || matchedMilestone(streak) || streak;
  const title = MILESTONE_TITLES[titleKey] || `${streak}-DAY STREAK`;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(4,4,5,0.92)', 'rgba(8,8,14,0.86)', 'rgba(4,4,5,0.94)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <TouchableOpacity style={styles.touchArea} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[styles.card, SHADOWS.popover, { transform: [{ scale: flameScale }] }]}>
          <View style={styles.flameWrap}>
            <View style={styles.flameHalo} />
            <MaterialCommunityIcons name="fire" size={56} color={COLORS.warning} />
            {animationsEnabled && (
              <SparkleBurst
                count={12}
                radius={80}
                duration={1100}
                colors={[COLORS.warning, COLORS.accent, '#ff8a3d']}
              />
            )}
          </View>

          <Animated.Text style={[styles.streakNum, { opacity: textOpacity }]}>{streak}</Animated.Text>
          <Animated.Text style={[styles.streakLabel, { opacity: textOpacity }]}>DAY STREAK</Animated.Text>
          <Animated.View style={[styles.titlePill, { opacity: textOpacity }]}>
            <Text style={styles.titleText}>{title}</Text>
          </Animated.View>
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
    zIndex: 995,
  },
  touchArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    minWidth: 240,
  },
  flameWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  flameHalo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.warning + '15',
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  streakNum: {
    fontFamily: FONTS.heading,
    fontSize: 72,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: 76,
  },
  streakLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 3,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  titlePill: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.warning + '15',
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  titleText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 2,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.heading,
  },
});

StreakMilestoneOverlay.propTypes = {
  data: PropTypes.shape({
    streak: PropTypes.number,
    milestone: PropTypes.number,
  }),
  onDismiss: PropTypes.func.isRequired,
};

StreakMilestoneOverlay.defaultProps = { data: null };

export default StreakMilestoneOverlay;

