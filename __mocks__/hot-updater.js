// Mock for @hot-updater/react-native in Jest tests.
// HotUpdater.wrap is used as an HOC in src/utils/withHotUpdater.js.

const HotUpdater = {
  wrap: () => (App) => App,
  checkForUpdate: () => Promise.resolve(null),
};

module.exports = { HotUpdater };
