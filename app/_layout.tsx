import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { PlayerProvider, usePlayer } from '../src/store/PlayerContext';
import { COLORS } from '../src/theme';
import SoundManager from '../src/utils/SoundManager';
import NotificationManager, { initNotifications } from '../src/utils/NotificationManager';
// Importing this registers the gym-arrival geofence background task
// (module-scope defineTask) before we arm any region.
import GeofenceManager from '../src/utils/GeofenceManager';
import Overlays from '../src/components/navigation/Overlays';
import withHotUpdater from '../src/utils/withHotUpdater';
import { migrateDatabase, migrateHistoryFromMMKV } from '../src/db';

SplashScreen.preventAutoHideAsync();

// Map notification data to a tab route path or a stack route path.
function resolveRouteFromData(data?: Record<string, any>): string | null {
  if (!data) return null;
  if (data.screen) {
    const stackScreens: Record<string, string> = {
      Stretching: '/stretching',
      WeightHistory: '/weight-history',
    };
    if (stackScreens[data.screen]) return stackScreens[data.screen];

    const tabScreens = ['Profile', 'Quests', 'Dungeons', 'Workout', 'History'];
    if (tabScreens.includes(data.screen)) {
      return `/(tabs)/${data.screen.toLowerCase()}`;
    }
    return null;
  }
  if (data.isRest) return '/(tabs)/workout';

  switch (data.type) {
    case 'gym-arrival':
      // Geofence fired at the gym — go straight to the workout screen.
      return '/(tabs)/workout';
    case 'water':
    case 'food':
    case 'sleep':
    case 'mental':
    case 'walking':
      return '/(tabs)';
    default:
      return null;
  }
}

function useNotificationRouting() {
  const router = useRouter();

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
      const route = resolveRouteFromData(data);
      if (!route) return;
      // Use replace for notification launches so users can still back out of the tab.
      router.replace(route as any);
    },
    [router]
  );

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationResponse(response);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    return () => subscription.remove();
  }, [handleNotificationResponse]);
}

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const { settings, gymLocation, isLoaded } = usePlayer();
  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const geofenceEnabled = settings?.geofenceEnabled ?? true;

  useNotificationRouting();

  // Arm the gym geofence once state is loaded and reconcile it whenever the
  // gym location or the toggle changes. The background task (registered at
  // module scope in GeofenceManager) does the arrival prompt itself.
  useEffect(() => {
    if (!isLoaded) return;
    GeofenceManager.syncGymGeofence(gymLocation, geofenceEnabled).catch((e) => {
      console.warn('Gym geofence sync failed:', e?.message || e);
    });
  }, [isLoaded, gymLocation, geofenceEnabled]);

  const didInitRef = useRef(false);
  const prevNotificationsRef = useRef(notificationsEnabled);

  // React to the user toggling notifications on/off from the profile screen.
  // On the initial mount this is a no-op because the ref already matches; the
  // one-time onLayout below handles first-launch setup.
  useEffect(() => {
    if (prevNotificationsRef.current === notificationsEnabled) return;
    prevNotificationsRef.current = notificationsEnabled;

    if (notificationsEnabled) {
      NotificationManager.requestPermissions().then((hasPermission) => {
        if (hasPermission) {
          NotificationManager.scheduleAllReminders();
        }
      });
    } else {
      NotificationManager.cancelAllNotifications();
    }
  }, [notificationsEnabled]);

  const onLayout = useCallback(async () => {
    if (!fontsLoaded || didInitRef.current) return;
    didInitRef.current = true;

    try {
      await migrateDatabase();
      await migrateHistoryFromMMKV();
    } catch (e) {
      console.error('Database migration failed:', e);
    }

    await SplashScreen.hideAsync();
    SoundManager.init();
    initNotifications();

    const hasPermission = await NotificationManager.requestPermissions();
    if (hasPermission && notificationsEnabled) {
      await NotificationManager.scheduleAllReminders();
    }
  }, [fontsLoaded, notificationsEnabled]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          cardStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="stretching"
          options={{
            headerShown: true,
            title: 'STRETCH TIMER',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.textPrimary,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="weight-history"
          options={{
            headerShown: true,
            title: 'WEIGHT HISTORY',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.textPrimary,
            headerShadowVisible: false,
          }}
        />
      </Stack>
      <Overlays />
    </View>
  );
}

function RootLayout() {
  return (
    <PlayerProvider>
      <RootLayoutContent />
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default withHotUpdater(RootLayout);
