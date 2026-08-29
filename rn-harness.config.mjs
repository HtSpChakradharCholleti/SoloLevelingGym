import {
  applePlatform,
  appleSimulator,
} from '@react-native-harness/platform-apple';
import {
  androidPlatform,
  androidEmulator,
} from '@react-native-harness/platform-android';

export default {
  entryPoint: './node_modules/react-native-harness/dist/index.js',
  appRegistryComponentName: 'ReactNativeHarness',
  runners: [
    {
      name: 'ios',
      ...applePlatform({
        name: 'ios',
        device: appleSimulator('iPhone 17 Pro', '26.1'),
        bundleId: 'com.chakradharxd.SoloLevelingGym',
      }),
    },
    {
      name: 'android',
      ...androidPlatform({
        name: 'android',
        device: androidEmulator('Pixel_9a'),
        bundleId: 'com.chakradharxd.SoloLevelingGym',
        activityName: 'com.chakradharxd.SoloLevelingGym/.MainActivity',
      }),
    },
  ],
  defaultRunner: 'ios',
  forwardClientLogs: true,
  resetEnvironmentBetweenTestFiles: true,
  maxAppRestarts: 2,
  testTimeout: 15_000,
  platformReadyTimeout: 300_000,
  bundleStartTimeout: 120_000,
  disableViewFlattening: true,
};
