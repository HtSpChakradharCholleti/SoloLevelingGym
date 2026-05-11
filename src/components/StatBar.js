// React & React Native
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Third-party
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, STAT_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';

/**
 * Animated stat progress bar with gradient fill.
 * Width animates to the current progress value when animations are enabled.
 * @param { string } label - Stat name (e.g. 'STR', 'AGI') used for color lookup and display
 * @param { number } value - Current XP value within the stat
 * @param { number } maxValue - XP required for next level (default 100)
 * @param { string } color - Override color for the bar fill
 * @param { bool } showLevel - Whether to show the level indicator
 * @param { number } level - Override level number to display
 * @param { bool } animate - Whether to animate the bar fill (further gated by global settings)
 */

const StatBar = ({ label, value, maxValue = 100, color, showLevel = true, level, animate = true }) => {
  const progress = Math.min(value / maxValue, 1);
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const barColor = color || STAT_COLORS[label] || COLORS.primary;
  const { settings } = usePlayer();
  const shouldAnimate = animate && (settings?.animationsEnabled ?? true);

  useEffect(() => {
    if (shouldAnimate) {
      Animated.timing(animatedWidth, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(progress);
    }
  }, [progress, shouldAnimate]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: barColor }]}>{label}</Text>
        {showLevel && (
          <Text style={styles.level}>Lv.{level || Math.floor(value / 200) + 1}</Text>
        )}
      </View>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, { width: widthInterpolated }]}>
          <LinearGradient
            colors={[barColor + '99', barColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
        <View style={[styles.barGlow, { shadowColor: barColor }]} />
      </View>
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
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
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
};

StatBar.defaultProps = {
  maxValue: 100,
  color: null,
  showLevel: true,
  level: null,
  animate: true,
};

export default StatBar;
