import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RANK_COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { RANK_TITLES } from '../utils/leveling';
import RankBadge from './RankBadge';

const { width, height } = Dimensions.get('window');

const LevelUpOverlay = ({ data, onDismiss }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.9)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
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
    letterSpacing: 8,
    marginBottom: SPACING.xl,
    opacity: 0.9,
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
});

export default LevelUpOverlay;
