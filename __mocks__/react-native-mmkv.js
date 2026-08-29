// Manual mock for react-native-mmkv in Jest.
// MMKV normally auto-mocks when JEST_WORKER_ID is set, but the v4 Nitro-based
// package can still try to load native NitroModules during module resolution.
// This mock short-circuits that path entirely.

const { createMockMMKV } = require('react-native-mmkv/lib/createMMKV/createMockMMKV');

module.exports = {
  createMMKV: (config) => createMockMMKV(config),
  createMockMMKV,
  deleteMMKV: () => {},
  existsMMKV: () => false,
};
