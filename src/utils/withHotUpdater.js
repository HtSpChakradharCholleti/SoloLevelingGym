import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { HotUpdater } from '@hot-updater/react-native';
import { getVersion } from 'react-native-device-info';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme';
import { abortSignalManager } from './AbortController';

const OTA_URL = process.env.EXPO_PUBLIC_OTA_URL;
const S3_BUCKET = process.env.EXPO_PUBLIC_S3_BUCKET;
const CHANNEL = process.env.EXPO_PUBLIC_CHANNEL;

function OTAFallback({ progress, status }) {
  // Hide splash screen as soon as this screen mounts — the app is
  // "ready" to show UI, it just needs to install an OTA update first.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={styles.container}>
      {/* Icon / Logo area */}
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>⚔️</Text>
      </View>

      <Text style={styles.title}>SYSTEM UPDATE</Text>
      <Text style={styles.subtitle}>
        {status === 'UPDATING' ? 'Installing update...' : 'Checking for update...'}
      </Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round((progress || 0) * 100)}%` }]} />
      </View>

      <Text style={styles.progressLabel}>
        {progress > 0 ? `${Math.round(progress * 100)}%` : 'Please wait...'}
      </Text>
    </View>
  );
}

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
    updateMode: 'auto',
    updateStrategy: 'appVersion',
    resolver: {
      checkUpdate: async params => {
        if (!OTA_URL) {
          console.warn('[HotUpdaterJs] OTA_URL is not configured. Skipping update check.');
          return null;
        }

        const otaAbortSignal = abortSignalManager.create('OTA_CHECK');
        const otaRoot = OTA_URL.replace(/\/$/, '');
        const baseUrl = `${otaRoot}/${bucket}/${Platform.OS}/${channel}/${appVersion}/update.json`;

        const timeout = setTimeout(() => {
          abortSignalManager.abort('OTA_CHECK');
        }, 3 * 1000);

        console.log('[HotUpdaterJs] currentBundleId:', params.bundleId, 'minBundleId:', params.minBundleId);
        console.log('[HotUpdaterJs] baseUrl', baseUrl);

        try {
          const res = await fetch(baseUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: otaAbortSignal,
          });

          if (!res.ok) {
            console.error('[HotUpdater] Failed to fetch update.json:', res.status);
            return null;
          }

          const data = await res.json();
          console.log('[HotUpdater] policy data', data);

          const currentBundleId = typeof params?.bundleId === 'string' ? params.bundleId.trim() : '';
          const minBundleId = typeof params?.minBundleId === 'string' ? params.minBundleId.trim() : '';
          const hasInstalledOtaBundle = !!currentBundleId && !!minBundleId && currentBundleId !== minBundleId;

          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            console.warn('[HotUpdaterJs] Invalid update.json format: expected an object.');
            return null;
          }

          const nextBundleId = typeof data.id === 'string' ? data.id.trim() : '';
          const nextStatus = typeof data.status === 'string' ? data.status.toUpperCase() : 'UPDATE';
          const isRollback = nextStatus === 'ROLLBACK';

          if (!nextBundleId || nextBundleId === currentBundleId) return null;

          if (isRollback && !hasInstalledOtaBundle) {
            console.warn('[HotUpdaterJs] Rollback received, but no installed OTA bundle exists. Skipping rollback.');
            return null;
          }

          if (!isRollback && typeof data.fileUrl !== 'string') {
            console.warn('[HotUpdaterJs] Update payload is missing a valid fileUrl. Skipping update.');
            return null;
          }

          return {
            id: nextBundleId,
            shouldForceUpdate: isRollback || Boolean(data.shouldForceUpdate),
            status: nextStatus,
            fileUrl: data.fileUrl,
            fileHash: typeof data.fileHash === 'string' ? data.fileHash : null,
            message: typeof data.message === 'string' ? data.message : null,
          };
        } catch (error) {
          console.error('[HotUpdaterJs] Failed to check for updates:', error);
          return null;
        } finally {
          clearTimeout(timeout);
          abortSignalManager.abort('OTA_CHECK');
        }
      },
    },
    onError: error => {
      console.error('[HotUpdaterJs] Update Error:', error);
    },
    onNotifyAppReady: () => {
      console.log('[HotUpdaterJs] App is ready, notifying HotUpdater.');
    },
    reloadOnForceUpdate: true,
    fallbackComponent: OTAFallback,
  })(App);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    letterSpacing: 4,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xxl,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  progressLabel: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
    letterSpacing: 2,
  },
});
