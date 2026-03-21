import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RANK_COLORS, GRADIENTS, FONTS, FONT_SIZES, SPACING } from '../theme';

const RankBadge = ({ rank, size = 'medium', showLabel = true }) => {
  const rankColor = RANK_COLORS[rank] || COLORS.textSecondary;
  const gradientColors = GRADIENTS[`rank${rank}`] || GRADIENTS.rankE;

  const sizeMap = {
    small: { badge: 36, font: FONT_SIZES.md, label: FONT_SIZES.xs },
    medium: { badge: 56, font: FONT_SIZES.xxl, label: FONT_SIZES.sm },
    large: { badge: 80, font: FONT_SIZES.giant, label: FONT_SIZES.base },
  };

  const s = sizeMap[size];

  return (
    <View style={styles.container}>
      <View style={[styles.badgeOuter, { width: s.badge + 8, height: s.badge + 8 }]}>
        <LinearGradient
          colors={gradientColors}
          style={[styles.badge, { width: s.badge, height: s.badge }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.rankText, { fontSize: s.font, color: '#fff' }]}>
            {rank}
          </Text>
        </LinearGradient>
        <View style={[styles.glowRing, {
          width: s.badge + 8,
          height: s.badge + 8,
          borderColor: rankColor + '60',
          shadowColor: rankColor,
        }]} />
      </View>
      {showLabel && (
        <Text style={[styles.label, { fontSize: s.label, color: rankColor }]}>
          {rank}-RANK
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  rankText: {
    fontFamily: FONTS.heading,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 14,
    transform: [{ rotate: '45deg' }],
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontFamily: FONTS.heading,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: SPACING.sm,
  },
});

export default RankBadge;
