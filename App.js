import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme, createNavigationContainerRef } from '@react-navigation/native';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';

import { PlayerProvider, usePlayer } from './src/store/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import LevelUpOverlay from './src/components/LevelUpOverlay';
import { COLORS } from './src/theme';
import SoundManager from './src/utils/SoundManager';
import NotificationManager, { initNotifications } from './src/utils/NotificationManager';
import * as Notifications from 'expo-notifications';

// Global navigation ref — allows navigating from outside React tree (e.g. notification handler)
export const navigationRef = createNavigationContainerRef();

// Map notification data to a tab screen name inside the Main stack
function resolveScreenFromData(data) {
  if (!data) return null;
  // Explicit screen key takes priority
  if (data.screen) return data.screen;
  // isRest flag from rest-timer notification
  if (data.isRest) return 'Workout';
  // Type-based routing for daily reminders
  switch (data.type) {
    case 'water':
    case 'food':
    case 'sleep':
    case 'mental':
    case 'walking':
      return 'Profile';
    default:
      return null;
  }
}

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { showLevelUp, levelUpData, dismissLevelUp } = usePlayer();

  // Navigate to the screen encoded in a notification response
  const handleNotificationResponse = useCallback((response) => {
    const data = response?.notification?.request?.content?.data;
    const screen = resolveScreenFromData(data);
    if (!screen || !navigationRef.isReady()) return;

    // Tab screens live inside the 'Main' stack screen
    const tabScreens = ['Profile', 'Quests', 'Dungeons', 'Workout', 'History'];
    if (tabScreens.includes(screen)) {
      navigationRef.navigate('Main', { screen });
    } else {
      // Stack-level screens (Stretching, WeightHistory)
      navigationRef.navigate(screen);
    }
  }, []);

  useEffect(() => {
    // Handle tap when app was killed (cold start) or in background
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    // Handle tap while app is in foreground or comes to foreground
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    return () => subscription.remove();
  }, [handleNotificationResponse]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <NavigationContainer
        ref={navigationRef}
        theme={{
          ...DarkTheme,
          dark: true,
          colors: {
            ...DarkTheme.colors,
            primary: COLORS.primary,
            background: COLORS.background,
            card: COLORS.background,
            text: COLORS.textPrimary,
            border: COLORS.surfaceBorder,
            notification: COLORS.accent,
          },
        }}
      >
        <AppNavigator />
      </NavigationContainer>

      {/* Level Up Overlay */}
      {showLevelUp && levelUpData && (
        <LevelUpOverlay data={levelUpData} onDismiss={dismissLevelUp} />
      )}
    </View>
  );
}

function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
      SoundManager.init();
      
      // Initialize notifications
      const initAppNotifications = async () => {
        initNotifications();
        const hasPermission = await NotificationManager.requestPermissions();
        if (hasPermission) {
          // Schedule all daily system reminders (Workout, Water, Meals)
          await NotificationManager.scheduleAllReminders();
        }
      };
      initAppNotifications();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </View>
  );
}

import withHotUpdater from './src/utils/withHotUpdater';

// ... (code above remains unchanged until the end of App component)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default withHotUpdater(App);
