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

  // Returns the directory base — NO trailing /update.json.
  // HotUpdater.checkForUpdate appends its own manifest path internally.
  // testOTAConnectivity probes ${base}/update.json explicitly.
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

  // 2. OTA manifest check — probe the exact URL HotUpdater reads.
  // base = ${OTA_URL}/${bucket}/${platform}/${channel}/${appVersion}  (no trailing slash)
  const testUrl = `${base}/update.json?t=${Date.now()}`;
  const startTime = Date.now();

  console.log('[OTA] testOTAConnectivity probing:', testUrl);

  try {
    const res = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache',
      },
    });

    const latencyMs = Date.now() - startTime;
    console.log('[OTA] testOTAConnectivity response: HTTP', res.status, '| latency:', latencyMs + 'ms');

    if (res.ok) {
      // 200/206 — manifest found, server healthy
      return {
        isReachable: true,
        hasInternet,
        status: res.status,
        latencyMs,
        referenceLatencyMs,
        error: null,
        url: testUrl,
      };
    }

    if (res.status === 404) {
      // Server IS reachable (S3 responded) but the manifest path is wrong.
      // This is a path/config mismatch, not a connectivity problem.
      console.warn('[OTA] 404 — S3 responded but update.json not found at this path.');
      console.warn('[OTA] Check that the deployed bundle path matches:', testUrl);
      return {
        isReachable: false,
        hasInternet,
        status: 404,
        latencyMs,
        referenceLatencyMs,
        error: `404 — update.json not found at expected path.\nProbed: ${testUrl}\n\nEnsure your OTA deploy used:\n  platform = ${Platform.OS}\n  channel  = ${CHANNEL?.toLowerCase()}\n  version  = ${getVersion()}`,
        url: testUrl,
      };
    }

    // Other HTTP error (403, 500, etc.)
    return {
      isReachable: false,
      hasInternet,
      status: res.status,
      latencyMs,
      referenceLatencyMs,
      error: `HTTP ${res.status} ${res.statusText}\nURL: ${testUrl}`,
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

    console.error('[OTA] testOTAConnectivity fetch threw:', errorMsg);
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
 * Manually triggers an OTA update check by fetching update.json directly
 * from S3 and comparing the remote bundle ID against the currently installed
 * bundle ID. Uses HotUpdater.updateBundle() to apply if a new bundle is found.
 *
 * NOTE: We do NOT use HotUpdater.checkForUpdate() here — that call goes
 * through the global resolver (set in withHotUpdater.js) which always returns
 * null for our manual/static-S3 setup.
 *
 * @param {Function} [onProgress] - Optional callback (progress: 0-1)
 * @returns {Promise<{ status: 'UP_TO_DATE'|'UPDATED'|'ERROR', message: string }>}
 */
export async function checkForOTAUpdate(onProgress) {
  // ── Env diagnostics ──────────────────────────────────────────────────────
  const appVersion = getVersion();
  const channelVal = CHANNEL?.toLowerCase() ?? '(undefined)';
  const bucketVal  = S3_BUCKET?.toLowerCase() ?? '(undefined)';
  const otaUrlVal  = OTA_URL ?? '(undefined)';

  console.log('[OTA] ── checkForOTAUpdate started ────────────────────────');
  console.log('[OTA] Env: EXPO_PUBLIC_OTA_URL   =', otaUrlVal);
  console.log('[OTA] Env: EXPO_PUBLIC_S3_BUCKET =', bucketVal);
  console.log('[OTA] Env: EXPO_PUBLIC_CHANNEL   =', channelVal);
  console.log('[OTA] Device: platform =', Platform.OS, '| appVersion =', appVersion);

  const base = getOTABaseUrl();
  console.log('[OTA] Resolved base URL =', base ?? '(null — env vars missing, aborting)');

  if (!base) {
    console.warn('[OTA] Aborting: one or more required env vars are empty.');
    return { status: 'ERROR', message: 'OTA environment variables not configured' };
  }

  const manifestUrl = `${base}/update.json?t=${Date.now()}`;
  console.log('[OTA] Fetching update manifest directly:', manifestUrl);

  try {
    // ── 1. Fetch the remote update.json ──────────────────────────────────
    const response = await fetch(manifestUrl, {
      headers: { 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' },
    });

    if (!response.ok) {
      const msg = `Server returned HTTP ${response.status} for update.json`;
      console.error('[OTA]', msg);
      return { status: 'ERROR', message: msg };
    }

    const updateInfo = await response.json();
    console.log('[OTA] Remote update.json:', JSON.stringify(updateInfo, null, 2));

    // ── 2. Validate the manifest has the minimum required fields ──────────
    if (!updateInfo?.id || !updateInfo?.fileUrl) {
      console.error('[OTA] update.json is missing required fields (id, fileUrl)');
      return { status: 'ERROR', message: 'Invalid update.json — missing id or fileUrl' };
    }

    if (updateInfo.enabled === false) {
      console.log('[OTA] Update is disabled (enabled=false). Treating as up to date.');
      return { status: 'UP_TO_DATE', message: 'No active update available' };
    }

    // ── 3. Compare remote bundle ID with installed bundle ID ──────────────
    const installedBundleId = HotUpdater.getBundleId();
    console.log('[OTA] Installed bundle ID:', installedBundleId);
    console.log('[OTA] Remote   bundle ID:', updateInfo.id);

    if (installedBundleId === updateInfo.id) {
      console.log('[OTA] Result: UP_TO_DATE — bundle IDs match, nothing to install.');
      console.log('[OTA] ─────────────────────────────────────────────────────────');
      return { status: 'UP_TO_DATE', message: 'App is up to date' };
    }

    console.log('[OTA] New bundle found — proceeding with download.');
    console.log('[OTA]   fileUrl          =', updateInfo.fileUrl);
    console.log('[OTA]   shouldForceUpdate =', updateInfo.shouldForceUpdate);
    console.log('[OTA]   fileHash         =', updateInfo.fileHash ?? '(not provided)');

    // ── 4. Listen for download progress ──────────────────────────────────
    let unsubProgress;
    if (onProgress) {
      unsubProgress = HotUpdater.addListener('onProgress', ({ progress }) => {
        console.log('[OTA] Download progress:', Math.round(progress * 100) + '%');
        onProgress(progress);
      });
    }

    console.log('[OTA] Starting bundle download...');
    const success = await HotUpdater.updateBundle({
      bundleId: updateInfo.id,
      fileUrl: updateInfo.fileUrl,
      fileHash: updateInfo.fileHash ?? undefined,
    });

    if (unsubProgress) unsubProgress();

    if (!success) {
      console.error('[OTA] HotUpdater.updateBundle returned false — download failed.');
      return { status: 'ERROR', message: 'Bundle download failed' };
    }

    console.log('[OTA] Bundle downloaded successfully.');

    // ── 5. Reload ─────────────────────────────────────────────────────────
    if (updateInfo.shouldForceUpdate) {
      console.log('[OTA] Force update — reloading now.');
      await HotUpdater.reload();
    } else {
      console.log('[OTA] Soft update — prompting user to restart.');
      Alert.alert(
        '🔄 Update Downloaded',
        'A new version has been downloaded. It will be applied when you restart the app.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart Now', onPress: () => HotUpdater.reload() },
        ],
      );
    }

    console.log('[OTA] ─────────────────────────────────────────────────────────');
    return { status: 'UPDATED', message: `Update ${updateInfo.id} downloaded` };

  } catch (error) {
    const msg = error?.message || String(error);
    console.error('[OTA] checkForOTAUpdate threw an exception:', msg);
    console.error('[OTA] Full error:', error);
    console.log('[OTA] ─────────────────────────────────────────────────────────');
    return { status: 'ERROR', message: msg };
  }
}
