import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// Shared header options for native-stack screens.
// native-stack only accepts `backgroundColor` in headerStyle;
// shadow/border are controlled via headerShadowVisible + headerBackground.
const sharedHeaderOptions = {
  headerStyle: { backgroundColor: COLORS.background },
  headerShadowVisible: false,        // removes the default platform shadow/divider
  headerBackground: () => (          // custom bottom border to match the design
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
        // Tab navigator uses its own JS header — keep the same styling as before
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
        options={{
          title: 'Hunter',
          headerTitle: 'HUNTER PROFILE',
        }}
      />
      <Tab.Screen
        name="Quests"
        component={DailyQuestsScreen}
        options={{
          headerTitle: 'DAILY QUEST',
        }}
      />
      <Tab.Screen
        name="Dungeons"
        component={DungeonsScreen}
        options={{
          headerTitle: 'DUNGEONS',
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          headerTitle: 'ACTIVE DUNGEON',
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Shadow',
          headerTitle: 'SHADOW ARMY',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    // native-stack: transitions run on the UI thread (native platform APIs),
    // completely independent of the JS thread — no JS jank during navigation.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Stretching"
        component={StretchingScreen}
        options={{
          headerShown: true,
          headerTitle: 'STRETCH TIMER',
          ...sharedHeaderOptions,
        }}
      />
      <Stack.Screen
        name="WeightHistory"
        component={WeightHistoryScreen}
        options={{
          headerShown: true,
          headerTitle: 'WEIGHT HISTORY',
          ...sharedHeaderOptions,
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  // Rendered as the native-stack header's background layer —
  // gives us the custom bottom border that headerStyle can't provide.
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
