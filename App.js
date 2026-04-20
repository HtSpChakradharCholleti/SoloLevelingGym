import React, { useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
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

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { showLevelUp, levelUpData, dismissLevelUp } = usePlayer();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <NavigationContainer
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
