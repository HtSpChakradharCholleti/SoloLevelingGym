import { Platform } from 'react-native';
import { HotUpdater } from '@hot-updater/react-native';
import { getVersion } from 'react-native-device-info';

const OTA_URL = process.env.EXPO_PUBLIC_OTA_URL;
const S3_BUCKET = process.env.EXPO_PUBLIC_S3_BUCKET;
const CHANNEL = process.env.EXPO_PUBLIC_CHANNEL;

/**
 * Wraps the App with HotUpdater in **manual** mode.
 *
 * This means:
 * - No network request at startup → instant launch
 * - notifyAppReady still fires for crash recovery / rollback
 * - Update checks are triggered on-demand via checkForOTAUpdate()
 *   in otaDiagnostics.js (called from the Settings screen)
 */
export default function withHotUpdater(App) {
  const appVersion = getVersion();
  const channel = CHANNEL?.toLowerCase();
  const bucket = S3_BUCKET?.toLowerCase();
  const isMisconfigured = !channel || !appVersion || !OTA_URL || !bucket;

  if (isMisconfigured) {
    console.warn(
      '[HotUpdaterJs] Missing configuration for OTA updates. Falling back to normal app load.',
    );
    return App;
  }

  return HotUpdater.wrap({
    updateMode: 'manual',
    resolver: {
      checkUpdate: async () => {
        // Manual mode — resolver is only used for notifyAppReady / recovery.
        // Update checks are triggered on-demand via checkForOTAUpdate().
        return null;
      },
    },
    onNotifyAppReady: () => {
      console.log('[HotUpdaterJs] App is ready, notifying HotUpdater.');
    },
  })(App);
}
