# Migration Plan: React Navigation → Expo Router

## Current State

- App uses `@react-navigation/native`, `native-stack`, and `bottom-tabs` v7.
- `App.js` wraps everything in a custom `NavigationContainer` with a global `navigationRef`.
- `src/navigation/AppNavigator.js` defines:
  - A `MainTabs` bottom tab navigator with 5 tabs: `Profile`, `Quests`, `Dungeons`, `Workout`, `History`.
  - A root native-stack with `Main` (tabs) + modal screens `Stretching`, `WeightHistory`.
- Screens receive `{ navigation }` prop and navigate imperatively.
- `LevelUpOverlay` uses `navigationRef` to deep-link into `Main → Dungeons`.
- `App.js` also handles notification routing via `navigationRef`.
- Project is Expo SDK 55 with `expo` already installed but no `expo-router`.

## Target State

- File-based routing via `expo-router`.
- `app/(tabs)/_layout.tsx` replaces `MainTabs`.
- `app/_layout.tsx` replaces root stack + `NavigationContainer` + theming + providers.
- `app/(tabs)/index.tsx` = Profile, `quests.tsx`, `dungeons.tsx`, `workout.tsx`, `history.tsx`.
- `app/stretching.tsx` and `app/weight-history.tsx` as modal stack screens.
- Imperative `navigation.navigate()` replaced with `router.push()` / `router.replace()` from `expo-router`.
- Global `navigationRef` replaced with `router.navigate()` or path-based navigation helpers.
- Entry point updated from `index.js` + `registerRootComponent(App)` to `expo-router` entry.

## Detailed Steps

### 1. Dependencies

Install `expo-router` and required peers; remove React Navigation packages.

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
# Remove old nav packages after migration verified
npm uninstall @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
```

Also add `react-native-screens` / `react-native-safe-area-context` if needed (already present).

### 2. Entry Point

Change `main` in `package.json` to use Expo Router entry:

```json
"main": "expo-router/entry"
```

Delete or repurpose `index.js`. Expo Router creates its own root.

### 3. Root Layout — `app/_layout.tsx`

Create `app/_layout.tsx` to hold providers, theme, status bar, and notification routing:

- Wrap children with `PlayerProvider`.
- Render `StatusBar` and overlays (`LevelUpOverlay`, `WorkoutCompleteOverlay`, `StreakMilestoneOverlay`).
- Use `useRouter()` and `useEffect` for notification deep-linking instead of `navigationRef`.
- Export ` unstable_settings` / keep default `Stack` with modal presentation for `stretching` and `weight-history`.

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { PlayerProvider } from '../src/store/PlayerContext';
import { COLORS } from '../src/theme';
import Overlays from '../src/components/Overlays';

function useNotificationRouting() {
  const router = useRouter();
  useEffect(() => {
    const handle = (response) => {
      const data = response?.notification?.request?.content?.data;
      const screen = resolveScreenFromData(data);
      if (!screen) return;
      const tabScreens = ['Profile', 'Quests', 'Dungeons', 'Workout', 'History'];
      if (tabScreens.includes(screen)) {
        router.replace(`/(tabs)/${screen.toLowerCase()}`);
      } else if (screen === 'Stretching') {
        router.push('/stretching');
      } else if (screen === 'WeightHistory') {
        router.push('/weight-history');
      }
    };
    Notifications.getLastNotificationResponseAsync().then((r) => r && handle(r));
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [router]);
}

export default function RootLayout() {
  useNotificationRouting();
  return (
    <PlayerProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
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
          }}
        />
      </Stack>
      <Overlays />
    </PlayerProvider>
  );
}
```

Move overlay rendering + notification routing out of `App.js`.

### 4. Tab Layout — `app/(tabs)/_layout.tsx`

Port `MainTabs` from `AppNavigator.js`. Reanimated tab button, icons, tab bar styling preserved.

```tsx
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES } from '../../src/theme';

function AnimatedTabButton({ children, onPress, onLongPress, style, accessibilityRole, accessibilityState }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => { scale.value = withSpring(0.86, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }); }}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      style={[style, { flex: 1 }]}
      activeOpacity={1}
    >
      <Animated.View style={[tabBtnStyles.inner, animStyle]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

const tabIconMap = {
  index: ['shield-crown', 'shield-crown-outline'],
  quests: ['clipboard-list', 'clipboard-list-outline'],
  dungeons: ['gate', 'gate'],
  workout: ['sword-cross', 'sword-cross'],
  history: ['ghost', 'ghost-outline'],
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.background, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontFamily: FONTS.heading, fontSize: FONT_SIZES.lg, fontWeight: '700', letterSpacing: 1 },
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = tabIconMap[route.name];
          return (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons name={focused ? active : inactive} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, height: 85, paddingBottom: 25, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: FONTS.body, fontSize: FONT_SIZES.xs, fontWeight: '600', marginTop: 2 },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Hunter', headerTitle: 'HUNTER PROFILE' }} />
      <Tabs.Screen name="quests" options={{ headerTitle: 'DAILY QUEST' }} />
      <Tabs.Screen name="dungeons" options={{ headerTitle: 'DUNGEONS' }} />
      <Tabs.Screen name="workout" options={{ headerTitle: 'ACTIVE DUNGEON' }} />
      <Tabs.Screen name="history" options={{ title: 'Shadow', headerTitle: 'SHADOW ARMY' }} />
    </Tabs>
  );
}
```

### 5. Screen Files

Create route files that re-export existing screens, mapping props as needed:

- `app/(tabs)/index.tsx` → `HunterProfileScreen`
- `app/(tabs)/quests.tsx` → `DailyQuestsScreen`
- `app/(tabs)/dungeons.tsx` → `DungeonsScreen`
- `app/(tabs)/workout.tsx` → `WorkoutScreen`
- `app/(tabs)/history.tsx` → `HistoryScreen`
- `app/stretching.tsx` → `StretchingScreen`
- `app/weight-history.tsx` → `WeightHistoryScreen`

Each wrapper uses `useLocalSearchParams` to pass params if needed and passes a navigation-compatible shim to the screen (or updates the screen to use `useRouter`).

Preferred approach: update screens to use `const router = useRouter()` from `expo-router`:

- `navigation.navigate('X')` → `router.push('/x')`
- `navigation.goBack()` → `router.back()`
- `navigation.navigate('Main', { screen: 'Dungeons' })` → `router.push('/(tabs)/dungeons')`

### 6. Update Screen Navigation Calls

Files requiring changes:

1. `src/screens/HunterProfileScreen.js:202`
   - `navigation.navigate('WeightHistory')` → `router.push('/weight-history')`
2. `src/screens/DungeonsScreen.js:49`
   - `navigation.navigate('Workout')` → `router.push('/(tabs)/workout')`
3. `src/screens/DungeonsScreen.js:136`
   - `navigation.navigate('Stretching')` → `router.push('/stretching')`
4. `src/screens/WorkoutScreen.js:729`
   - `navigation.navigate('Dungeons')` → `router.push('/(tabs)/dungeons')`
5. `src/screens/WorkoutScreen.js:942`
   - `navigation.navigate('Profile')` → `router.push('/(tabs)')`
6. `src/screens/WorkoutScreen.js:964`
   - `navigation.navigate('Dungeons')` → `router.push('/(tabs)/dungeons')`
7. `src/screens/WorkoutScreen.js:1147`
   - `navigation.navigate('Stretching')` → `router.push('/stretching')`
8. `src/screens/StretchingScreen.js:514`
   - `navigation.goBack()` → `router.back()`
9. `src/screens/WeightHistoryScreen.js:221`
   - `navigation.goBack()` → `router.back()`
10. `src/components/LevelUpOverlay.js:42-44`
    - `navigationRef.navigate('Main', { screen: 'Dungeons' })` → `router.push('/(tabs)/dungeons')`

### 7. Remove `App.js` / `index.js` Responsibilities

- `App.js` currently bootstraps fonts, splash screen, sound, notifications, and overlays.
- With Expo Router, root layout handles providers/overlays; font/splash/sound init moves into a new `app/_layout.tsx` or `app/index` guard.
- Keep font loading logic in `_layout.tsx` using `SplashScreen` and `useFonts`.
- Remove `registerRootComponent` from `index.js` and point `package.json` main to `expo-router/entry`.

### 8. Theme / NavigationContainer Theme

Expo Router uses `ThemeProvider` from `@react-navigation/native` under the hood. We can pass a custom theme to the `Stack`/`Tabs` via `theme` prop or use `NavigationContainer` is no longer needed. Simpler: keep dark background via `screenOptions` and `StatusBar`; no need for full `NavigationContainer` theme object.

### 9. Cleanup

- Delete `src/navigation/AppNavigator.js`.
- Delete `index.js`.
- Remove `@react-navigation/*` deps from `package.json`.
- Update `tsconfig.json` paths if needed (likely not required).

### 10. Verification

- Run `npx expo start` and check all tabs render.
- Verify modal push from `Dungeons` → `Stretching`.
- Verify `WeightHistory` push from `Profile`.
- Verify `Workout` → `Profile` after finish.
- Verify notification cold-start routing.
- Verify `LevelUpOverlay` deep-link to `Dungeons`.

## Open Questions / Decisions

1. **Font/splash init placement**: Should it live in `app/_layout.tsx` as a suspense gate, or in a separate `SplashGuard` component? (Recommended: inline in `_layout.tsx` with early `null` return.)
2. **Route naming**: Should `weight-history` route use kebab-case (`/weight-history`) or camelCase (`/weightHistory`)? Expo Router convention prefers kebab-case file names; I'll use kebab-case.
3. **Tab index route**: `app/(tabs)/index.tsx` maps to `/` and tab name `index`. Keep `title: 'Hunter'` in tab options.
4. **TypeScript**: Existing screens are `.js`. Wrappers can be `.tsx`; no need to convert screens to TS.
5. **Hot updater HOC**: `withHotUpdater(App)` wraps old root. Expo Router root is `_layout.tsx`; we need to decide where to apply `withHotUpdater`. (Likely wrap the `Stack` or the whole `_layout` return.)

## Risks

- `expo-router` v4 ( ships with Expo SDK 55) may have subtle API differences; need to verify `Stack` modal options on SDK 55.
- Removing `react-native-screens` is not advised; keep it.
- The global `navigationRef` pattern is fully replaced by `useRouter`; confirm `LevelUpOverlay` and notification handler both have access to router (they render inside layout, so yes).
