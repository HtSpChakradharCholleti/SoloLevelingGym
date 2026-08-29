// Project-level Jest setup.
// Runs after jest-expo's preset setup, which already mocks most Expo modules.

import 'react-native-gesture-handler/jestSetup';

// Reanimated and Worklets mocks must be loaded before any component imports them.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));

// Safe area context mock provides deterministic insets.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Sound manager is a singleton that tries to load audio assets; mock all methods.
jest.mock('./src/utils/SoundManager', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    playTap: jest.fn(),
    playLevelUp: jest.fn(),
    playQuestComplete: jest.fn(),
    playDungeonEnter: jest.fn(),
    playTimerTick: jest.fn(),
    playTimerComplete: jest.fn(),
    playTimerCompleteLoop: jest.fn(),
    stopTimerComplete: jest.fn(),
    pauseBGM: jest.fn(),
    resumeBGM: jest.fn(),
  },
}));

// Font loading can hang in test renderer; make useFonts resolve instantly.
jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [true, null],
  loadAsync: () => Promise.resolve(),
}));

// Keep awake is a no-op in tests.
jest.mock('expo-keep-awake', () => ({
  useKeepAwake: () => {},
  activateKeepAwake: () => Promise.resolve(),
  deactivateKeepAwake: () => Promise.resolve(),
}));

// Expo audio creates native players; mock the createAudioPlayer API.
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    loop: false,
  }),
}));

// Expo notifications use native scheduling; provide safe no-ops.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  requestPermissionsAsync: () => Promise.resolve({ status: 'granted' }),
  setNotificationChannelAsync: () => Promise.resolve(),
  scheduleNotificationAsync: () => Promise.resolve('mock-notification-id'),
  cancelAllScheduledNotificationsAsync: () => Promise.resolve(),
  getLastNotificationResponseAsync: () => Promise.resolve(undefined),
  addNotificationResponseReceivedListener: () => ({ remove: jest.fn() }),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  AndroidImportance: { MAX: 5 },
}));

// Expo sharing / document picker / file-system are mocked by jest-expo,
// but keep explicit shims here for the methods used in import/export.
jest.mock('expo-sharing', () => ({
  shareAsync: () => Promise.resolve(),
  isAvailableAsync: () => Promise.resolve(true),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: () => Promise.resolve({ canceled: true, assets: [] }),
}));

jest.mock('expo-file-system', () => ({
  ...jest.requireActual('expo-file-system'),
  documentDirectory: 'file:///mock-documents/',
  writeAsStringAsync: () => Promise.resolve(),
  readAsStringAsync: () => Promise.resolve('{}'),
  deleteAsync: () => Promise.resolve(),
  makeDirectoryAsync: () => Promise.resolve(),
  getInfoAsync: () => Promise.resolve({ exists: true, uri: 'file:///mock-documents/' }),
}));

// Router hook used by many screens; tests that need real routing use expo-router/testing-library.
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  }),
}));

// Splash screen native calls are irrelevant in unit tests.
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: () => Promise.resolve(),
  hideAsync: () => Promise.resolve(),
}));

// The hot-updater and op-sqlite mocks are provided via moduleNameMapper in jest.config.js.
// Additional per-test resets can be done in beforeEach blocks.

// Reset module-level caches between tests to avoid state leakage from singletons.
beforeEach(() => {
  jest.clearAllMocks();
});

// Increase default timeout for tests that render heavy native components.
jest.setTimeout(10000);
