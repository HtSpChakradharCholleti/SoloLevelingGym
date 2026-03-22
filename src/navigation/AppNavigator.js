import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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
const Stack = createStackNavigator();

const screenOptions = {
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
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Stretching"
        component={StretchingScreen}
        options={{
          headerShown: true,
          headerTitle: 'STRETCH TIMER',
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
        }}
      />
      <Stack.Screen
        name="WeightHistory"
        component={WeightHistoryScreen}
        options={{
          headerShown: true,
          headerTitle: 'WEIGHT HISTORY',
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
        }}
      />
    </Stack.Navigator>
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
