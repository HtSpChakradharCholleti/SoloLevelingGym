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

// ─── Constants & Configurations ───────────────────────────────────────────────

export const DEFAULT_DAILY_STEP_TARGET = 10000;

export const HC_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
];

export const EXERCISE_TYPE_NAMES = {
  0: 'Workout',
  1: 'Back Extension',
  2: 'Badminton',
  3: 'Barbell Shoulder Press',
  4: 'Baseball',
  5: 'Basketball',
  6: 'Bench Press',
  7: 'Bench Sit Up',
  8: 'Biking',
  9: 'Biking Stationary',
  10: 'Boot Camp',
  11: 'Boxing',
  12: 'Burpee',
  13: 'Calisthenics',
  14: 'Cricket',
  15: 'Cross Country Skiing',
  16: 'Dancing',
  17: 'Deadlift',
  18: 'Elliptical',
  19: 'Exercise Class',
  20: 'Fencing',
  21: 'Football',
  22: 'Australian Football',
  23: 'Forward Twist',
  24: 'Frisbee',
  25: 'Golf',
  26: 'Guided Breathing',
  27: 'Gymnastics',
  28: 'Handball',
  29: 'HIIT',
  30: 'Hiking',
  31: 'Ice Hockey',
  32: 'Ice Skating',
  33: 'Jumping Jack',
  34: 'Jump Rope',
  35: 'Lat Pulldown',
  36: 'Lunge',
  37: 'Martial Arts',
  38: 'Paddling',
  39: 'Paragliding',
  40: 'Pilates',
  41: 'Plank',
  42: 'Racquetball',
  43: 'Rock Climbing',
  44: 'Roller Hockey',
  45: 'Rowing',
  46: 'Rowing Machine',
  47: 'Running',
  48: 'Treadmill Running',
  49: 'Rugby',
  50: 'Sailing',
  51: 'Scuba Diving',
  52: 'Skating',
  53: 'Skiing',
  54: 'Snowboarding',
  55: 'Snowshoeing',
  56: 'Soccer',
  57: 'Squash',
  58: 'Squat',
  59: 'Stair Climbing',
  60: 'Stair Machine',
  61: 'Strength Training',
  62: 'Stretching',
  63: 'Surfing',
  64: 'Open Water Swimming',
  65: 'Pool Swimming',
  66: 'Table Tennis',
  67: 'Tennis',
  68: 'Upper Twist',
  69: 'Volleyball',
  70: 'Walking',
  71: 'Water Polo',
  72: 'Weightlifting',
  73: 'Wheelchair',
  74: 'Yoga',
};

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

export function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
}

export function formatTimeAgo(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    const diffMs = Math.max(0, Date.now() - d.getTime());
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHours = Math.round(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatTime(isoString);
  } catch {
    return null;
  }
}

export function formatDurationHoursMinutes(minutes) {
  if (minutes == null || isNaN(minutes) || minutes < 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatExerciseTypeName(exerciseType, title) {
  if (title && typeof title === 'string' && title.trim()) return title.trim();
  if (typeof exerciseType === 'number' && EXERCISE_TYPE_NAMES[exerciseType]) {
    return EXERCISE_TYPE_NAMES[exerciseType];
  }
  if (typeof exerciseType === 'string') {
    return exerciseType
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
  return 'Workout';
}

// ─── Public API ───────────────────────────────────────────────────────────────

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

export async function getHealthConnectStatus() {
  if (Platform.OS !== 'android') return SdkAvailabilityStatus.SDK_UNAVAILABLE;
  try {
    return await getSdkStatus();
  } catch {
    return SdkAvailabilityStatus.SDK_UNAVAILABLE;
  }
}

export async function getHealthPermissions() {
  try {
    return await getGrantedPermissions();
  } catch {
    return [];
  }
}

export async function requestHealthPermissions() {
  try {
    return await requestPermission(HC_PERMISSIONS);
  } catch {
    return [];
  }
}

/**
 * Today's total step count and latest recorded timestamp.
 * Returns { count: number|null, lastUpdated: string|null }.
 */
export async function getTodaySteps() {
  try {
    const aggregate = await aggregateRecord({
      recordType: 'Steps',
      ...todayTimeRange(),
    });
    const count = aggregate?.COUNT_TOTAL ?? null;
    let lastUpdated = null;
    try {
      const { records } = await readRecords('Steps', todayTimeRange());
      if (records && records.length > 0) {
        const latest = records[records.length - 1];
        lastUpdated = latest.endTime || latest.metadata?.lastModifiedTime || null;
      }
    } catch {
      // ignore
    }
    return { count, lastUpdated };
  } catch {
    return { count: null, lastUpdated: null };
  }
}

/**
 * Today's heart-rate samples.
 * Returns { latest: number|null, min: number|null, max: number|null, avg: number|null, latestTime: string|null, count: number, lastUpdated: string|null }.
 */
export async function getTodayHeartRate() {
  try {
    const { records } = await readRecords('HeartRate', todayTimeRange());
    if (!records || records.length === 0) {
      return { latest: null, min: null, max: null, avg: null, latestTime: null, lastUpdated: null, count: 0 };
    }
    const allSamples = records.flatMap(r => r.samples ?? []);
    if (allSamples.length === 0) {
      return { latest: null, min: null, max: null, avg: null, latestTime: null, lastUpdated: null, count: 0 };
    }
    allSamples.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    const latestSample = allSamples[allSamples.length - 1];
    const bpms = allSamples
      .map(s => s.beatsPerMinute)
      .filter(b => typeof b === 'number' && !isNaN(b));
    if (bpms.length === 0) {
      return { latest: null, min: null, max: null, avg: null, latestTime: null, lastUpdated: null, count: 0 };
    }
    const min = Math.min(...bpms);
    const max = Math.max(...bpms);
    const sum = bpms.reduce((acc, v) => acc + v, 0);
    const avg = Math.round(sum / bpms.length);
    const lastRecord = records[records.length - 1];
    const lastUpdated = latestSample.time || lastRecord.metadata?.lastModifiedTime || null;
    return {
      latest: latestSample.beatsPerMinute,
      latestTime: latestSample.time,
      min,
      max,
      avg,
      count: bpms.length,
      lastUpdated,
    };
  } catch {
    return { latest: null, min: null, max: null, avg: null, latestTime: null, lastUpdated: null, count: 0 };
  }
}

/**
 * Sleep sessions (yesterday midnight → now).
 * Returns { totalMinutes: number|null, sessionsCount: number, startTime: string|null, endTime: string|null, lastUpdated: string|null, stages: object|null }.
 */
export async function getTodaySleep() {
  try {
    const { records } = await readRecords('SleepSession', sleepTimeRange());
    if (!records || records.length === 0) {
      return { totalMinutes: null, sessionsCount: 0, startTime: null, endTime: null, lastUpdated: null, stages: null };
    }
    records.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    let totalMinutes = 0;
    for (const session of records) {
      if (session.startTime && session.endTime) {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        if (end > start) {
          totalMinutes += Math.round((end - start) / (1000 * 60));
        }
      }
    }
    const first = records[0];
    const last = records[records.length - 1];
    const lastUpdated = last.endTime || last.metadata?.lastModifiedTime || null;

    let stagesSummary = null;
    const allStages = records.flatMap(r => r.stages ?? []);
    if (allStages.length > 0) {
      let awakeMin = 0;
      let lightMin = 0;
      let deepMin = 0;
      let remMin = 0;
      for (const st of allStages) {
        if (st.startTime && st.endTime) {
          const start = new Date(st.startTime).getTime();
          const end = new Date(st.endTime).getTime();
          const dur = Math.max(0, Math.round((end - start) / (1000 * 60)));
          if (st.stage === 1 || st.stage === 3) awakeMin += dur;
          else if (st.stage === 4) lightMin += dur;
          else if (st.stage === 5) deepMin += dur;
          else if (st.stage === 6) remMin += dur;
        }
      }
      if (awakeMin + lightMin + deepMin + remMin > 0) {
        stagesSummary = { awakeMin, lightMin, deepMin, remMin };
      }
    }

    return {
      totalMinutes,
      sessionsCount: records.length,
      startTime: first.startTime,
      endTime: last.endTime,
      lastUpdated,
      stages: stagesSummary,
    };
  } catch {
    return { totalMinutes: null, sessionsCount: 0, startTime: null, endTime: null, lastUpdated: null, stages: null };
  }
}

/**
 * Exercise sessions today.
 * Returns { totalMinutes: number, sessionsCount: number, hasRecords: boolean, lastUpdated: string|null, latest: object|null }.
 */
export async function getTodayExercise() {
  try {
    const { records } = await readRecords('ExerciseSession', todayTimeRange());
    if (!records || records.length === 0) {
      return { totalMinutes: 0, sessionsCount: 0, latest: null, hasRecords: false, lastUpdated: null };
    }
    records.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    let totalMinutes = 0;
    for (const session of records) {
      if (session.startTime && session.endTime) {
        const start = new Date(session.startTime).getTime();
        const end = new Date(session.endTime).getTime();
        if (end > start) {
          totalMinutes += Math.round((end - start) / (1000 * 60));
        }
      }
    }
    const latestRecord = records[records.length - 1];
    const start = new Date(latestRecord.startTime).getTime();
    const end = new Date(latestRecord.endTime).getTime();
    const latestDurationMin = Math.max(0, Math.round((end - start) / (1000 * 60)));

    return {
      totalMinutes,
      sessionsCount: records.length,
      hasRecords: true,
      lastUpdated: latestRecord.endTime || latestRecord.metadata?.lastModifiedTime || null,
      latest: {
        name: formatExerciseTypeName(latestRecord.exerciseType, latestRecord.title),
        startTime: latestRecord.startTime,
        endTime: latestRecord.endTime,
        durationMinutes: latestDurationMin,
      },
    };
  } catch {
    return { totalMinutes: 0, sessionsCount: 0, latest: null, hasRecords: false, lastUpdated: null };
  }
}

/**
 * Active energy burned today.
 * Returns { calories: number|null, lastUpdated: string|null }.
 */
export async function getTodayActiveCalories() {
  try {
    const aggregate = await aggregateRecord({
      recordType: 'ActiveCaloriesBurned',
      ...todayTimeRange(),
    });
    const raw = aggregate?.ACTIVE_CALORIES_TOTAL;
    const calories = raw == null ? null : (typeof raw === 'object' ? (raw.inKilocalories ?? null) : raw);
    let lastUpdated = null;
    try {
      const { records } = await readRecords('ActiveCaloriesBurned', todayTimeRange());
      if (records && records.length > 0) {
        const latest = records[records.length - 1];
        lastUpdated = latest.endTime || latest.metadata?.lastModifiedTime || null;
      }
    } catch {
      // ignore
    }
    return { calories, lastUpdated };
  } catch {
    return { calories: null, lastUpdated: null };
  }
}
