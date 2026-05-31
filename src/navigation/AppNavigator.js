import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme';

import HunterProfileScreen from '../screens/HunterProfileScreen';
import DailyQuestsScreen from '../screens/DailyQuestsScreen';
import DungeonsScreen from '../screens/DungeonsScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StretchingScreen from '../screens/StretchingScreen';
import WeightHistoryScreen from '../screens/WeightHistoryScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Animated Tab Button ──────────────────────────────────────────────────────
// Wraps each tab's touchable area with a Reanimated spring scale.
// Press-in compresses to 0.84×; release springs back to 1× with slight overshoot.
// Runs entirely on the UI thread — zero JS involvement during the animation.
function AnimatedTabButton({ children, onPress, onLongPress, style, accessibilityRole, accessibilityState }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.86, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    // withTiming instead of withSpring: snaps cleanly to 1x with no overshoot/oscillation.
    // One compress, one release — no wobble.
    scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) });
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, animStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole={accessibilityRole}
        accessibilityState={accessibilityState}
        style={tabBtnStyles.inner}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const tabBtnStyles = StyleSheet.create({
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Shared header options for native-stack screens.
// native-stack only accepts `backgroundColor` in headerStyle;
// shadow/border are controlled via headerShadowVisible + headerBackground.
const sharedHeaderOptions = {
  headerStyle: { backgroundColor: COLORS.background },
  headerShadowVisible: false,
  headerBackground: () => (
    <View style={styles.headerBackground} />
  ),
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
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
        // Spring-press animation on every tab tap
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Profile':
              iconName = focused ? 'shield-crown' : 'shield-crown-outline';
              break;
            case 'Quests':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
              break;
            case 'Dungeons':
              iconName = focused ? 'gate' : 'gate';
              break;
            case 'Workout':
              iconName = focused ? 'sword-cross' : 'sword-cross';
              break;
            case 'History':
              iconName = focused ? 'ghost' : 'ghost-outline';
              break;
          }
          return (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
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
      <Tab.Screen
        name="Profile"
        component={HunterProfileScreen}
        options={{ title: 'Hunter', headerTitle: 'HUNTER PROFILE' }}
      />
      <Tab.Screen
        name="Quests"
        component={DailyQuestsScreen}
        options={{ headerTitle: 'DAILY QUEST' }}
      />
      <Tab.Screen
        name="Dungeons"
        component={DungeonsScreen}
        options={{ headerTitle: 'DUNGEONS' }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{ headerTitle: 'ACTIVE DUNGEON' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Shadow', headerTitle: 'SHADOW ARMY' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    // native-stack: transitions run on the UI thread via native platform APIs.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Stretching"
        component={StretchingScreen}
        options={{
          headerShown: true,
          headerTitle: 'STRETCH TIMER',
          // Slides up from the bottom — more dramatic than the default side-slide.
          // fullScreenGestureEnabled lets users swipe down from anywhere to dismiss.
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          ...sharedHeaderOptions,
        }}
      />
      <Stack.Screen
        name="WeightHistory"
        component={WeightHistoryScreen}
        options={{
          headerShown: true,
          headerTitle: 'WEIGHT HISTORY',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          ...sharedHeaderOptions,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  activeIconContainer: {
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
});
