// Geofencing around the user's gym.
//
// Uses expo-location's `startGeofencingAsync`, which invokes an Expo
// *background task* when the device enters/exits the region — including while
// the app is suspended or fully closed. That background task is the single
// place that reacts to arrival, so we keep this whole feature on one code path
// (no separate foreground listener to stay in sync with).
//
// The task schedules an immediate local notification ("You're at the gym —
// start your warmup?") whose `data` deep-links to the Workout screen via the
// notification routing in app/_layout.tsx.
//
// Arrival dedup is two-layered, both persisted in MMKV so they survive
// relaunches (the background task runs in a fresh JS context every time, so
// module-level state is useless here):
//  1. A baseline region state recorded at (re)arm time. Re-registering the
//     region while already inside the radius makes the OS emit a fresh Enter
//     event that is NOT an arrival — the baseline is what suppresses it.
//  2. A 5-minute cooldown on the last prompt, so boundary jitter can't stack
//     prompts.

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { haversineDistanceMeters, isWithinRadius } from './geo';
import NotificationManager from './NotificationManager';
import { storage } from '../store/storage';

// Region / task identifiers. Kept stable so re-registration is idempotent.
export const GYM_REGION_IDENTIFIER = 'gym';
export const GYM_GEOFENCE_TASK = 'gym-arrival-geofence';

// Cooldown so a burst of Enter events (boundary jitter) doesn't stack prompts.
// Persisted (not just module state) because the task runs in a fresh JS context on
// every firing — an in-memory timestamp would reset and re-fire on every "open the
// app while already at the gym."
const ARRIVAL_PROMPT_COOLDOWN_MS = 5 * 60 * 1000;

// Guarded read of the Enter/Exit constants — robust even if the module shape shifts.
const ENTER_EVENT = () => Location.GeofencingEventType?.Enter ?? 1;
const EXIT_EVENT = () => Location.GeofencingEventType?.Exit ?? 2;

// MMKV keys for cross-context state. The geofence background task runs in a fresh
// JS context each time it fires, so module-level state can't dedup across app
// relaunches. MMKV is synchronous and file-backed (keyed by instance id), so the
// foreground app and the headless task read/write the same values.
const BASELINE_STATE_KEY = 'gym_geofence_baseline_state';
const ARRIVAL_PROMPT_TS_KEY = 'gym_arrival_last_prompt_ts';

function readBaselineState() {
  try {
    return storage.getString(BASELINE_STATE_KEY);
  } catch (e) {
    return undefined;
  }
}

function writeBaselineState(state) {
  try {
    storage.set(BASELINE_STATE_KEY, state);
  } catch (e) {
    // Fail-open: a write failure just means the next Enter re-checks from scratch.
  }
}

function readLastArrivalPromptAt() {
  try {
    const value = storage.getNumber(ARRIVAL_PROMPT_TS_KEY);
    return typeof value === 'number' ? value : 0;
  } catch (e) {
    return 0;
  }
}

function writeLastArrivalPromptAt(ts) {
  try {
    storage.set(ARRIVAL_PROMPT_TS_KEY, ts);
  } catch (e) {
    // no-op
  }
}

/**
 * Register the background task that reacts to gym arrival.
 *
 * `defineTask` must run at module scope so it is re-registered when the OS
 * re-launches the JS bundle headlessly for a background geofence event. The
 * `isTaskDefined` guard keeps hot reload / double imports from registering
 * the executor twice.
 */
if (!TaskManager.isTaskDefined(GYM_GEOFENCE_TASK)) {
  TaskManager.defineTask(GYM_GEOFENCE_TASK, ({ data, error }) => {
    if (error) {
      console.warn('Gym geofence task error:', error?.message);
      return;
    }
    const { eventType } = data || {};

    // Track the baseline on exits too, so a later Enter knows where we came from.
    if (eventType === EXIT_EVENT()) {
      writeBaselineState('outside');
      return;
    }
    // React only to region ENTER (not exit).
    if (eventType !== ENTER_EVENT()) return;

    const wasInsideAtArm = readBaselineState() === 'inside';
    writeBaselineState('inside');

    // A re-armed region emits Enter while the user is already inside (e.g. app
    // relaunch at the gym). That is not an arrival — skip it entirely.
    if (wasInsideAtArm) return;

    // Cooldown: don't stack prompts from boundary jitter.
    const now = Date.now();
    if (now - readLastArrivalPromptAt() < ARRIVAL_PROMPT_COOLDOWN_MS) return;
    writeLastArrivalPromptAt(now);

    // Fire-and-forget: the background task has no caller to await on.
    NotificationManager.notifyGymArrival().catch((e) => {
      console.warn('Failed to notify gym arrival:', e?.message || e);
    });
  });
}

class GeofenceManager {
  /**
   * Request foreground ("when in use") then background ("always") location.
   * Background is best-effort — on Android 11+ it opens the system settings
   * page rather than resolving a clean grant.
   * @returns {Promise<{foreground: boolean, background: boolean}>}
   */
  static async requestPermissions() {
    const foreground = await GeofenceManager._safeRequest(
      () => Location.requestForegroundPermissionsAsync()
    );
    let background = false;
    if (foreground) {
      background = await GeofenceManager._safeRequest(
        () => Location.requestBackgroundPermissionsAsync()
      );
    }
    return { foreground, background };
  }

  /**
   * Capture the user's current position as the gym location.
   * @param {number} radiusMeters
   * @returns {Promise<{latitude: number, longitude: number, radius: number}>}
   */
  static async captureGymLocation(radiusMeters = 200) {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy?.High,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      radius: radiusMeters,
    };
  }

  /**
   * Whether the device is currently inside the gym radius, plus the distance.
   * @param {{latitude: number, longitude: number, radius: number}} gym
   * @returns {Promise<{inside: boolean, distanceMeters: number, coords: {latitude: number, longitude: number}}>}
   */
  static async getInsideState(gym) {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy?.Balanced,
    });
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    return {
      inside: isWithinRadius(coords, gym, gym.radius),
      distanceMeters: haversineDistanceMeters(coords, gym),
      coords,
    };
  }

  /**
   * (Re)register the gym region for geofencing. Safe to call repeatedly;
   * `startGeofencingAsync` replaces the previous region set.
   * @param {{latitude: number, longitude: number, radius: number}} gym
   */
  static async registerGymRegion(gym) {
    const region = {
      identifier: GYM_REGION_IDENTIFIER,
      latitude: gym.latitude,
      longitude: gym.longitude,
      radius: gym.radius,
      notifyOnEnter: true,
      notifyOnExit: true,
    };
    await Location.startGeofencingAsync(GYM_GEOFENCE_TASK, [region]);
  }

  /** Stop geofencing for the gym region. */
  static async unregisterGymRegion() {
    try {
      await Location.stopGeofencingAsync(GYM_GEOFENCE_TASK);
    } catch (e) {
      // Stopping when not registered is a no-op we can ignore.
      console.warn('stopGeofencingAsync:', e?.message || e);
    }
  }

  /**
   * High-level reconciliation for app load: arm the geofence if we already
   * have foreground permission and the feature is on, or stop it otherwise.
   *
   * Deliberately does NOT re-request permissions on every launch — that would
   * re-prompt (and on Android 11+ jump to the settings page) each time. The
   * one-time consent happens in the "Set my gym" flow via requestPermissions.
   * @param {?{latitude: number, longitude: number, radius: number}} gymLocation
   * @param {boolean} enabled
   */
  static async syncGymGeofence(gymLocation, enabled) {
    if (!enabled || !gymLocation) {
      if (await Location.hasStartedGeofencingAsync(GYM_GEOFENCE_TASK)) {
        await GeofenceManager.unregisterGymRegion();
      }
      return;
    }

    // Only arm if we already hold foreground location (granted at set-up time).
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    await GeofenceManager.registerGymRegion(gymLocation);
  }

  static _safeRequest(fn) {
    return fn()
      .then((res) => res.status === 'granted')
      .catch((e) => {
        console.warn('Location permission request failed:', e?.message || e);
        return false;
      });
  }
}

export default GeofenceManager;
