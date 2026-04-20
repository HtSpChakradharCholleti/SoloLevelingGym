import React, { useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
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
import { HotUpdater } from '@hot-updater/react-native';

const OTA_URL = process.env.EXPO_PUBLIC_OTA_URL;
const S3_BUCKET = process.env.EXPO_PUBLIC_S3_BUCKET;
const CHANNEL = process.env.EXPO_PUBLIC_CHANNEL;
import { getVersion } from 'react-native-device-info';
import { abortSignalManager } from './src/utils/AbortController';


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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});


const appVersion = getVersion();
const channel = CHANNEL.toLowerCase();
const bucket = S3_BUCKET.toLowerCase();
const isMisconfigured = !channel || !appVersion || !OTA_URL || !bucket;
if (isMisconfigured) {
  console.warn(
    '[HotUpdaterJs] Missing configuration for OTA updates. Falling back to normal app load.',
  );
}

export default isMisconfigured
  ? App
  : HotUpdater.wrap({
      updateMode: 'auto',
      updateStrategy: 'appVersion',
      resolver: {
        checkUpdate: async params => {
          if (!OTA_URL) {
            console.warn(
              '[HotUpdaterJs] OTA_URL is not configured. Skipping update check.',
            );

            return null;
          }
          const otaAbortSignal = abortSignalManager.create(
            'OTA_CHECK',
          );
          const otaRoot = OTA_URL.replace(/\/$/, '');
          const baseUrl = `${otaRoot}/${bucket}/${Platform.OS}/${channel}/${appVersion}/update.json`;
          const timeout = setTimeout(() => {
            abortSignalManager.abort('OTA_CHECK');
          }, 3 * 1000);

          console.log('[HotUpdaterJs] currentBundleId:', params.bundleId, 'minBundleId:', params.minBundleId);
          console.log('[HotUpdaterJs] baseUrl', baseUrl);

          try {
            const res = await fetch(baseUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              signal: otaAbortSignal,
            });

            if (!res.ok) {
              console.error('[HotUpdater] Failed to fetch update.json:', res.status);
              return null
            };

            const data = await res.json();
            console.error('[HotUpdater] policy data', data);

            // IMPORTANT: return null if up-to-date
            // and return the shape HotUpdater expects if update exists
            const currentBundleId =
              typeof params?.bundleId === 'string'
                ? params.bundleId.trim()
                : '';
            const minBundleId =
              typeof params?.minBundleId === 'string'
                ? params.minBundleId.trim()
                : '';
            // Built-in bundle can have an ID; OTA is detected when current differs from build-time minimum ID.
            const hasInstalledOtaBundle =
              !!currentBundleId &&
              !!minBundleId &&
              currentBundleId !== minBundleId;

            // Validate response shape before accessing properties
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
              console.warn(
                '[HotUpdaterJs] Invalid update.json format: expected an object.',
              );

              return null;
            }

            const nextBundleId =
              typeof data.id === 'string' ? data.id.trim() : '';
            const nextStatus =
              typeof data.status === 'string'
                ? data.status.toUpperCase()
                : 'UPDATE';
            const isRollback = nextStatus === 'ROLLBACK';

            if (!nextBundleId || nextBundleId === currentBundleId) return null;

            if (isRollback && !hasInstalledOtaBundle) {
              console.warn(
                '[HotUpdaterJs] Rollback received, but no installed OTA bundle exists. Skipping rollback.',
              );

              return null;
            }

            if (!isRollback && typeof data.fileUrl !== 'string') {
              console.warn(
                '[HotUpdaterJs] Update payload is missing a valid fileUrl. Skipping update.',
              );

              return null;
            }

            return {
              id: nextBundleId,
              shouldForceUpdate: isRollback || Boolean(data.shouldForceUpdate),
              status: nextStatus,
              fileUrl: data.fileUrl,
              fileHash:
                typeof data.fileHash === 'string' ? data.fileHash : null,
              message: typeof data.message === 'string' ? data.message : null,
            };
          } catch (error) {
            console.error('[HotUpdaterJs] Failed to check for updates:', error);

            return null;
          } finally {
            clearTimeout(timeout);
            abortSignalManager.abort('OTA_CHECK');
          }
        },
      },
      onError: error => {
        console.error('[HotUpdaterJs] Update Error:', error);
      },
      onNotifyAppReady: () => {
        console.log('[HotUpdaterJs] App is ready, notifying HotUpdater.');
      },
      reloadOnForceUpdate: true,
      fallbackComponent: ({ progress, status }) => (
        <View
          style={{
            flex: 1,
            padding: 20,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* You can put a splash image here. */}

          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
            {status === 'UPDATING' ? 'Updating...' : 'Checking for Update...'}
          </Text>
          {progress > 0 ? (
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {Math.round(progress * 100)}%
            </Text>
          ) : null}
        </View>
      ),
    })(App);
