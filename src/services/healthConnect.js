import { Platform } from 'react-native';
import {
  getSdkStatus,
  initialize,
  requestPermission,
  getGrantedPermissions,
  readRecords,
  aggregateRecord,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

// ─── Permission definitions ───────────────────────────────────────────────────

export const HC_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayTimeRange() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return {
    timeRangeFilter: {
      operator: 'between',
      startTime: startOfDay.toISOString(),
      endTime: now.toISOString(),
    },
  };
}

/** Yesterday midnight → now, to include overnight sleep that started before midnight */
function sleepTimeRange() {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
  return {
    timeRangeFilter: {
      operator: 'between',
      startTime: yesterday.toISOString(),
      endTime: now.toISOString(),
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if running on Android and Health Connect SDK is available.
 * Does NOT call initialize().
 */
export async function initializeHealthConnect() {
  if (Platform.OS !== 'android') return false;
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
      await initialize();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Returns the raw SDK availability status (SdkAvailabilityStatus enum value). */
export async function getHealthConnectStatus() {
  if (Platform.OS !== 'android') return SdkAvailabilityStatus.SDK_UNAVAILABLE;
  try {
    return await getSdkStatus();
  } catch {
    return SdkAvailabilityStatus.SDK_UNAVAILABLE;
  }
}

/** Returns the list of currently granted HC_PERMISSIONS records. */
export async function getHealthPermissions() {
  try {
    return await getGrantedPermissions();
  } catch {
    return [];
  }
}

/**
 * Requests all HC_PERMISSIONS.
 * Returns the resulting granted-permissions array.
 */
export async function requestHealthPermissions() {
  try {
    return await requestPermission(HC_PERMISSIONS);
  } catch {
    return [];
  }
}

/** Today's total step count (number) or null if unavailable. */
export async function getTodaySteps() {
  try {
    const result = await aggregateRecord({
      recordType: 'Steps',
      ...todayTimeRange(),
    });
    return result?.COUNT_TOTAL ?? null;
  } catch {
    return null;
  }
}

/**
 * Today's heart-rate records.
 * Returns { latest: number|null, records: array }.
 */
export async function getTodayHeartRate() {
  try {
    const { records } = await readRecords('HeartRate', todayTimeRange());
    if (!records || records.length === 0) return { latest: null, records: [] };
    // Each record has a .samples array of { beatsPerMinute, time }
    const allSamples = records.flatMap(r => r.samples ?? []);
    const latest = allSamples.length > 0
      ? allSamples[allSamples.length - 1].beatsPerMinute
      : null;
    return { latest, records };
  } catch {
    return { latest: null, records: [] };
  }
}

/**
 * Recent sleep sessions (yesterday midnight → now so overnight sleep is included).
 * Returns array of SleepSession records.
 */
export async function getTodaySleep() {
  try {
    const { records } = await readRecords('SleepSession', sleepTimeRange());
    return records ?? [];
  } catch {
    return [];
  }
}

/**
 * Today's exercise sessions.
 * Returns array of ExerciseSession records.
 */
export async function getTodayExercise() {
  try {
    const { records } = await readRecords('ExerciseSession', todayTimeRange());
    return records ?? [];
  } catch {
    return [];
  }
}

/**
 * Today's active calories burned (kcal) or null if unavailable.
 */
export async function getTodayActiveCalories() {
  try {
    const result = await aggregateRecord({
      recordType: 'ActiveCaloriesBurned',
      ...todayTimeRange(),
    });
    // The library returns energy in kilocalories via ACTIVE_CALORIES_TOTAL
    const raw = result?.ACTIVE_CALORIES_TOTAL;
    if (raw == null) return null;
    // Depending on library version the value may already be in kcal or wrapped
    // in an object { inKilocalories }
    return typeof raw === 'object' ? (raw.inKilocalories ?? null) : raw;
  } catch {
    return null;
  }
}
