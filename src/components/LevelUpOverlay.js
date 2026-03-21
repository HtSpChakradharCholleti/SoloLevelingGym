import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, RANK_COLORS, GRADIENTS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { RANK_TITLES } from '../utils/leveling';
import RankBadge from './RankBadge';

const { width, height } = Dimensions.get('window');

const LevelUpOverlay = ({ data, onDismiss }) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.3)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Flash overlay
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Glow burst
      Animated.spring(glowScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      // Content appears
      Animated.parallel([
        Animated.spring(contentScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
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
        {/* Glow burst circle */}
        <Animated.View style={[
          styles.glowBurst,
          {
            transform: [{ scale: glowScale }],
            backgroundColor: rankColor + '15',
            borderColor: rankColor + '30',
          },
        ]} />

        {/* Content */}
        <Animated.View style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          },
        ]}>
          {/* LEVEL UP text */}
          <Text style={[styles.levelUpLabel, { color: rankColor }]}>
            ⚔️ LEVEL UP ⚔️
          </Text>

          {/* Level display */}
          <View style={styles.levelRow}>
            <Text style={styles.oldLevel}>Lv.{data.oldLevel}</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color={rankColor} />
            <Text style={[styles.newLevel, { color: rankColor }]}>Lv.{data.newLevel}</Text>
          </View>

          {/* Rank badge */}
          <View style={styles.rankArea}>
            <RankBadge rank={data.newRank} size="large" />
          </View>

          {/* Rank up message */}
          {data.rankUp && (
            <Animated.View style={[styles.rankUpBanner, { opacity: textOpacity }]}>
              <LinearGradient
                colors={GRADIENTS[`rank${data.newRank}`] || GRADIENTS.rankE}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.rankUpGradient}
              >
                <Text style={styles.rankUpText}>
                  RANK UP! {RANK_TITLES[data.newRank]}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          <Animated.Text style={[styles.tapText, { opacity: textOpacity }]}>
            Tap to continue
          </Animated.Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
  glowBurst: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  levelUpLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: SPACING.xl,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  oldLevel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  newLevel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  rankArea: {
    marginBottom: SPACING.xxl,
  },
  rankUpBanner: {
    marginBottom: SPACING.xxl,
  },
  rankUpGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
  },
  rankUpText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tapText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    marginTop: SPACING.lg,
  },
});

export default LevelUpOverlay;
