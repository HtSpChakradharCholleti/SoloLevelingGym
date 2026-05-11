// React Native
import { Platform, Alert } from 'react-native';

// Third-party
import { getVersion } from 'react-native-device-info';
import { HotUpdater } from '@hot-updater/react-native';

const OTA_URL = process.env.EXPO_PUBLIC_OTA_URL;
const S3_BUCKET = process.env.EXPO_PUBLIC_S3_BUCKET;
const CHANNEL = process.env.EXPO_PUBLIC_CHANNEL;

/**
 * Builds the OTA base URL from environment variables.
 * @returns {string|null}
 */
function getOTABaseUrl() {
  const appVersion = getVersion();
  const channelVal = CHANNEL?.toLowerCase();
  const bucketVal = S3_BUCKET?.toLowerCase();

  if (!OTA_URL || !channelVal || !bucketVal || !appVersion) return null;

  return `${OTA_URL.replace(/\/$/, '')}/${bucketVal}/${Platform.OS}/${channelVal}/${appVersion}`;
}

/**
 * Diagnostic function to test OTA server connectivity.
 * Also pings a reference URL (google.com) to distinguish
 * "no internet" from "OTA server unreachable".
 * @returns {Promise<{ isReachable: bool, hasInternet: bool, status: number|null, latencyMs: number, referenceLatencyMs: number|null, error: string|null, url: string }>}
 */
export async function testOTAConnectivity() {
  const base = getOTABaseUrl();

  if (!base) {
    return {
      isReachable: false,
      hasInternet: false,
      status: null,
      latencyMs: 0,
      referenceLatencyMs: null,
      error: 'OTA environment variables not configured',
      url: 'N/A',
    };
  }

  // 1. Reference check — can we reach the internet at all?
  let hasInternet = false;
  let referenceLatencyMs = null;
  try {
    const refStart = Date.now();
    const refRes = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
    });
    referenceLatencyMs = Date.now() - refStart;
    hasInternet = refRes.status === 204 || refRes.ok;
  } catch (_) {
    hasInternet = false;
  }

  // 2. OTA server check
  const testUrl = `${base}/update.json?t=${Date.now()}`;
  const startTime = Date.now();

  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
      },
    });

    const latencyMs = Date.now() - startTime;

    return {
      isReachable: res.ok,
      hasInternet,
      status: res.status,
      latencyMs,
      referenceLatencyMs,
      error: res.ok ? null : `HTTP ${res.status} ${res.statusText}`,
      url: testUrl,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error?.message || String(error);

    let diagnosis = errorMsg;
    if (errorMsg.includes('Network request failed')) {
      diagnosis = hasInternet
        ? 'SSL certificate error (self-signed cert not trusted) or server unreachable'
        : 'No internet connection';
    } else if (errorMsg.includes('Aborted') || errorMsg.includes('aborted')) {
      diagnosis = 'Request timed out — server may be down or port blocked';
    }

    return {
      isReachable: false,
      hasInternet,
      status: null,
      latencyMs,
      referenceLatencyMs,
      error: diagnosis,
      url: testUrl,
    };
  }
}

/**
 * Manually triggers an OTA update check using HotUpdater's checkForUpdate API.
 * If an update is found, downloads and optionally reloads.
 * @param {Function} [onProgress] - Optional callback (progress: 0-1)
 * @returns {Promise<{ status: 'UP_TO_DATE'|'UPDATED'|'ERROR', message: string }>}
 */
export async function checkForOTAUpdate(onProgress) {
  const base = getOTABaseUrl();

  if (!base) {
    return { status: 'ERROR', message: 'OTA environment variables not configured' };
  }

  try {
    console.log('[OTA] Manually checking for updates...');

    const updateInfo = await HotUpdater.checkForUpdate({
      source: base,
    });

    if (!updateInfo) {
      console.log('[OTA] App is up to date.');
      return { status: 'UP_TO_DATE', message: 'App is up to date' };
    }

    console.log('[OTA] Update found:', updateInfo.id);

    // Listen for download progress if callback provided
    let unsubProgress;
    if (onProgress) {
      unsubProgress = HotUpdater.addListener('onProgress', ({ progress }) => {
        onProgress(progress);
      });
    }

    const success = await HotUpdater.updateBundle({
      bundleId: updateInfo.id,
      fileUrl: updateInfo.fileUrl,
    });

    if (unsubProgress) unsubProgress();

    if (!success) {
      return { status: 'ERROR', message: 'Bundle download failed' };
    }

    console.log('[OTA] Update downloaded. Force update:', updateInfo.shouldForceUpdate);

    if (updateInfo.shouldForceUpdate) {
      // Auto-reload for force updates
      await HotUpdater.reload();
    } else {
      // Let user know — update will apply on next restart
      Alert.alert(
        '🔄 Update Downloaded',
        'A new version has been downloaded. It will be applied when you restart the app.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart Now', onPress: () => HotUpdater.reload() },
        ],
      );
    }

    return { status: 'UPDATED', message: `Update ${updateInfo.id} downloaded` };
  } catch (error) {
    const msg = error?.message || String(error);
    console.error('[OTA] Update check failed:', msg);
    return { status: 'ERROR', message: msg };
  }
}
