import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../theme';

const SystemPanel = ({ children, style, noBorder = false }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inner, SHADOWS.card]}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sectionGap,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  inner: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  content: {
    padding: SPACING.lg,
  },
});

export default SystemPanel;
