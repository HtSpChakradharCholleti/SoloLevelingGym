import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme';

const SystemPanel = ({ children, style, glowColor = COLORS.primary, noBorder = false }) => {
  return (
    <View style={[styles.container, !noBorder && { borderColor: glowColor + '40' }, style]}>
      <LinearGradient
        colors={[COLORS.surface + 'ee', COLORS.surfaceLight + 'cc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top glow line */}
        {!noBorder && (
          <View style={[styles.glowLine, { backgroundColor: glowColor }]} />
        )}
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.lg - 1,
  },
  glowLine: {
    height: 2,
    width: '100%',
    opacity: 0.6,
  },
  content: {
    padding: SPACING.base,
  },
});

export default SystemPanel;
