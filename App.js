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

export default function App() {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
