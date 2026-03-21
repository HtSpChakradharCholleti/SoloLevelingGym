import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../theme';

const SystemPanel = ({ children, style, noBorder = false }) => {
  return (
    <View style={[styles.container, !noBorder && SHADOWS.soft, style]}>
      <View style={[styles.inner, !noBorder && SHADOWS.inner]}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  inner: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  content: {
    padding: SPACING.base,
  },
});

export default SystemPanel;
