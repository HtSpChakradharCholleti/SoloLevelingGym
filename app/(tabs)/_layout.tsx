import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { COLORS, FONTS, FONT_SIZES } from '../../src/theme';

// ─── Animated Tab Button ──────────────────────────────────────────────────────
// Wraps each tab's touchable area with a Reanimated spring scale.
// Press-in compresses to 0.84×; release snaps back to 1× cleanly.
function AnimatedTabButton({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityRole,
  accessibilityState,
}: any) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.86, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      style={[style, { flex: 1 }]}
      activeOpacity={1}
    >
      <Animated.View style={[tabBtnStyles.inner, animStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

const tabBtnStyles = StyleSheet.create({
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const tabIcons: Record<string, [string, string]> = {
  index: ['shield-crown', 'shield-crown-outline'],
  quests: ['clipboard-list', 'clipboard-list-outline'],
  dungeons: ['gate', 'gate'],
  workout: ['sword-cross', 'sword-cross'],
  history: ['ghost', 'ghost-outline'],
};

export default function TabLayout() {
  return (
    <Tabs
      sceneContainerStyle={{
        backgroundColor: COLORS.background,
      }}
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: COLORS.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.surfaceBorder,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontFamily: FONTS.heading,
          fontSize: FONT_SIZES.lg,
          fontWeight: '700',
          letterSpacing: 1,
        },
        tabBarButton: (props: any) => <AnimatedTabButton {...props} />,
        tabBarIcon: ({ focused, color, size }: any) => {
          const [active, inactive] = tabIcons[route.name];
          return (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons
                name={(focused ? active : inactive) as any}
                size={size}
                color={color}
              />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.surfaceBorder,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.body,
          fontSize: FONT_SIZES.xs,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Hunter', headerTitle: 'HUNTER PROFILE' }}
      />
      <Tabs.Screen
        name="quests"
        options={{ headerTitle: 'DAILY QUEST' }}
      />
      <Tabs.Screen
        name="dungeons"
        options={{ headerTitle: 'DUNGEONS' }}
      />
      <Tabs.Screen
        name="workout"
        options={{ headerTitle: 'ACTIVE DUNGEON' }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'Shadow', headerTitle: 'SHADOW ARMY' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
