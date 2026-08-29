// Jest configuration for SoloLevelingGym
// Uses jest-expo's iOS preset as the primary target.

const path = require('path');

module.exports = {
  preset: 'jest-expo/ios',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    // Keep jest-expo's broad allow-list and add packages that ship untranspiled ESM/C++.
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@op-engineering/op-sqlite|@hot-updater/react-native))',
  ],
  moduleNameMapper: {
    // Provide deterministic mocks for native modules that don't ship Jest mocks.
    '^react-native-device-info$': '<rootDir>/node_modules/react-native-device-info/jest/react-native-device-info-mock.js',
    '^@hot-updater/react-native$': '<rootDir>/__mocks__/hot-updater.js',
    '^@op-engineering/op-sqlite$': '<rootDir>/__mocks__/op-sqlite.js',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.js',
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/__mocks__/',
    '/assets/',
    '/src/data/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__harness__/',
  ],
  clearMocks: true,
  restoreMocks: true,
};
