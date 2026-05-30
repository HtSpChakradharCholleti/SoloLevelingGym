// React & React Native
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Third-party
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';

/**
 * Animated stat progress bar — fully migrated to Reanimated.
 * - Fills with a spring animation on mount and when value changes.
 * - Stagger delay (index prop) makes multiple bars cascade in like an RPG.
 * - A glowing "tip" marker rides at the leading edge of the fill for visual depth.
 * - When the bar is full (progress ≥ 1), it pulses gold to signal max level.
 */
const StatBar = ({ label, value, maxValue = 100, color, showLevel = true, level, animate = true, index = 0 }) => {
  const progress = Math.min(value / maxValue, 1);
  const barColor = color || STAT_COLORS[label] || COLORS.primary;
  const { settings } = usePlayer();
  const shouldAnimate = animate && (settings?.animationsEnabled ?? true);

  // Shared value: 0 → progress (driven by spring)
  const fillProgress = useSharedValue(0);
  // Shared value for tip glow opacity — pulses when full
  const tipOpacity = useSharedValue(0);

  useEffect(() => {
    if (shouldAnimate) {
      // Stagger: each bar starts 80ms later than the previous one
      fillProgress.value = withDelay(
        index * 80,
        withSpring(progress, {
          damping: 22,
          stiffness: 160,
          mass: 0.8,
        })
      );
      // Tip glow fades in as bar fills, then if full pulses
      tipOpacity.value = withDelay(
        index * 80 + 200,
        withTiming(progress > 0 ? 1 : 0, { duration: 400 })
      );
    } else {
      fillProgress.value = progress;
      tipOpacity.value = progress > 0 ? 1 : 0;
    }
  }, [progress, shouldAnimate, index]);

  // Animated bar fill width
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value * 100}%`,
  }));

  // Tip glow — a small bright dot that sits at the right edge of the fill
  const tipStyle = useAnimatedStyle(() => ({
    opacity: tipOpacity.value,
  }));

  // Bar track color flashes gold briefly when max level reached
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      fillProgress.value,
      [0, 0.99, 1],
      [COLORS.surfaceLight, COLORS.surfaceLight, barColor + '22']
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: barColor }]}>{label}</Text>
        {showLevel && (
          <Text style={styles.level}>Lv.{level || Math.floor(value / 200) + 1}</Text>
        )}
      </View>
      <Animated.View style={[styles.barBackground, trackStyle]}>
        <Animated.View style={[styles.barFill, fillStyle]}>
          <LinearGradient
            colors={[barColor + '80', barColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
          {/* Glowing tip at the leading edge */}
          <Animated.View style={[styles.tipGlow, { backgroundColor: barColor }, tipStyle]} />
        </Animated.View>
      </Animated.View>
      <Text style={styles.valueText}>
        {Math.floor(value % 200)} / 200
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  level: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  barBackground: {
    height: 8,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'visible',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
  },
  // Small bright dot at the leading edge of the fill — gives the bar a "lit tip"
  tipGlow: {
    position: 'absolute',
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  valueText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
});

StatBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  maxValue: PropTypes.number,
  color: PropTypes.string,
  showLevel: PropTypes.bool,
  level: PropTypes.number,
  animate: PropTypes.bool,
  index: PropTypes.number,
};

StatBar.defaultProps = {
  maxValue: 100,
  color: null,
  showLevel: true,
  level: null,
  animate: true,
  index: 0,
};

export default StatBar;
