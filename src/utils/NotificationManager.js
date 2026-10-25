import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Fixed identifier for the live-workout notification — same ID replaces the
// existing notification in-place on Android (no stacking).
const WORKOUT_LIVE_ID = 'active_workout_live';

// Only set the handler when needed or inside an init function to avoid top-level triggers
export const initNotifications = () => {
  Notifications.setNotificationHandler({
    // Allow test, rest-complete, and gym-arrival notifications through in
    // foreground with banner + sound.
    // Workout-live updates are added to the tray silently (shouldShowList: true)
    // but never pop a banner or play sound while the app is open.
    handleNotification: async (notification) => {
      const data = notification?.request?.content?.data;
      const isTest = data?.isTest === true;
      const isRest = data?.isRest === true;
      const isGymArrival = data?.type === 'gym-arrival';
      const isWorkoutLive = data?.isWorkoutLive === true;
      const shouldAlert = isTest || isRest || isGymArrival;
      return {
        shouldShowBanner: shouldAlert,
        // workout-live must reach the tray even when the app is in foreground,
        // otherwise Android discards it before it can persist in the drawer.
        shouldShowList: shouldAlert || isWorkoutLive,
        shouldPlaySound: shouldAlert,
        shouldSetBadge: false,
      };
    },
  });
};

class NotificationManager {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted' && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('system_alerts', {
        name: 'System Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'notif',
      });
      // Low-importance channel for the live workout notification — no sound or
      // vibration on each update tick so it silently updates in the tray.
      await Notifications.setNotificationChannelAsync('workout_live', {
        name: 'Active Workout',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [],
        enableVibrate: false,
        sound: null,
        showBadge: false,
      });
    }

    return finalStatus === 'granted';
  }

  static async scheduleDailyNotification(title, body, hour, minute, data = {}) {
    // DAILY trigger — repeats every day at the given local hour/minute.
    // Previously we used a one-shot timeInterval, which only fired once and
    // required the user to re-open the app every day to re-arm.
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily',
      hour,
      minute,
      channelId: 'system_alerts',
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: Platform.OS === 'ios' ? 'notif.wav' : 'notif',
        android: {
          channelId: 'system_alerts',
        },
      },
      trigger,
    });
  }

  static async scheduleAllReminders() {
    // Cancel existing to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Workout Reminder (8:00 AM)
    await this.scheduleDailyNotification(
      "Time to Level Up! ⚔️",
      "Your daily quest is waiting. Don't let your stats drop!",
      8, 0,
      { screen: 'Workout' }
    );

    // 2. Water Reminder (11:00 AM)
    await this.scheduleDailyNotification(
      "Hydration Protocol 💧",
      "Consuming water is essential for mana recovery. Drink up, Hunter!",
      11, 0,
      { type: 'water' }
    );

    // 3. Lunch Reminder (1:00 PM)
    await this.scheduleDailyNotification(
      "Maintenance Break 🍱",
      "Time for lunch. Your physical vessel requires nutrients for the next raid.",
      13, 0,
      { type: 'food' }
    );

    // 4. Dinner Reminder (8:00 PM)
    await this.scheduleDailyNotification(
      "Evening Feast 🍖",
      "The day's battles are ending. Restore your HP with a proper dinner.",
      20, 0,
      { type: 'food' }
    );

    // 5. Sleep Reminder (10:30 PM)
    await this.scheduleDailyNotification(
      "System Shutdown 💤",
      "Time for bed, Hunter. Deep sleep is the only way to fully restore your mana.",
      22, 30,
      { type: 'sleep' }
    );

    // 6. Smile Reminders (10:00 AM, 3:00 PM, 6:00 PM)
    await this.scheduleDailyNotification(
      "System Check: Positive Aura 😄",
      "A Hunter's mental state is their greatest weapon. Don't forget to smile!",
      10, 0,
      { type: 'mental' }
    );
    await this.scheduleDailyNotification(
      "Mid-Day Boost ✨",
      "You're making great progress today. Take a second to smile and breathe.",
      15, 0,
      { type: 'mental' }
    );
    await this.scheduleDailyNotification(
      "Golden Hour Smile 🌅",
      "The sun is setting. Smile for another day of successful hunting!",
      18, 0,
      { type: 'mental' }
    );

    // 7. Walking Reminder (6:30 PM)
    await this.scheduleDailyNotification(
      "Walking Protocol 🚶‍♂️",
      "A Hunter's recovery includes movement. Take a 15-minute walk today!",
      18, 30,
      { type: 'walking' }
    );

    console.log("All system reminders scheduled.");
  }

  static async scheduleWorkoutReminder() {
    // For backward compatibility or manual triggers
    return this.scheduleAllReminders();
  }

  static async scheduleTestNotification() {
    const trigger = {
      type: 'timeInterval',
      seconds: 5,
      repeats: false,
      channelId: 'system_alerts',
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "System Online 🚀",
        body: "Local notifications are now active. Ready for combat!",
        sound: Platform.OS === 'ios' ? 'notif.wav' : 'notif',
        data: { isTest: true }, // bypasses foreground suppression
        android: {
          channelId: 'system_alerts',
        },
      },
      trigger,
    });
  }

  static async scheduleTimerNotification(seconds, label = 'Stretch') {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏱️ ${label} Complete!`,
          body: 'Time is up! Tap to return to your session.',
          sound: Platform.OS === 'ios' ? 'notif.wav' : 'notif',
          // This method is only used by the stretch timer — always deep-link
          // back to the Stretching screen. Previously this compared `label`
          // against the literal 'Stretch', but callers pass the stretch's
          // display name (e.g. "Cobra Stretch"), so the check always fell
          // through to 'Workout'.
          data: { screen: 'Stretching' },
          android: {
            channelId: 'system_alerts',
          },
        },
        trigger: {
          type: 'timeInterval',
          seconds: Math.max(1, Math.floor(seconds)),
          repeats: false,
          channelId: 'system_alerts',
        },
      });
      this._timerNotifId = id;
      return id;
    } catch (e) {
      console.warn('Failed to schedule timer notification', e);
    }
  }

  static async cancelTimerNotification() {
    try {
      if (this._timerNotifId) {
        await Notifications.cancelScheduledNotificationAsync(this._timerNotifId);
        this._timerNotifId = null;
      }
    } catch (e) {
      console.warn('Failed to cancel timer notification', e);
    }
  }

  static async scheduleRestNotification(seconds) {
    try {
      // Cancel any existing rest notification first
      await this.cancelRestNotification();
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest Over! ⏱️',
          body: 'Time to lift again, Hunter! Get back in there.',
          sound: Platform.OS === 'ios' ? 'notif.wav' : 'notif',
          data: { isRest: true, screen: 'Workout' },
          android: {
            channelId: 'system_alerts',
          },
        },
        trigger: {
          type: 'timeInterval',
          seconds: Math.max(1, Math.floor(seconds)),
          repeats: false,
          channelId: 'system_alerts',
        },
      });
      this._restNotifId = id;
      return id;
    } catch (e) {
      console.warn('Failed to schedule rest notification', e);
    }
  }

  static async cancelRestNotification() {
    try {
      if (this._restNotifId) {
        await Notifications.cancelScheduledNotificationAsync(this._restNotifId);
        this._restNotifId = null;
      }
    } catch (e) {
      console.warn('Failed to cancel rest notification', e);
    }
  }

  /**
   * Fire an immediate "you've arrived at the gym" prompt. Called from the
   * geofence background task when the device enters the gym region — works
   * whether the app is suspended or in the foreground. A `null` trigger
   * delivers the notification right now (no schedule). Tapping it deep-links
   * to the Workout screen via `resolveRouteFromData` in app/_layout.tsx.
   */
  static async notifyGymArrival() {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'You’re at the gym! 🏋️',
          body: 'Time to warm up and start your workout, Hunter?',
          sound: Platform.OS === 'ios' ? 'notif.wav' : 'notif',
          data: { type: 'gym-arrival', screen: 'Workout' },
          android: {
            channelId: 'system_alerts',
          },
        },
        trigger: null, // deliver immediately
      });
      return id;
    } catch (e) {
      console.warn('Failed to send gym-arrival notification', e);
      return null;
    }
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Show or update the persistent live-workout notification.
   * Uses a fixed identifier so Android replaces it in-place (no new entry
   * in the tray). The `ongoing` flag prevents users from swiping it away.
   * Tapping it deep-links to the workout screen via the existing routing logic.
   *
   * @param {number} elapsedSeconds  - seconds elapsed since workout started
   * @param {number} setsCompleted   - number of sets completed so far
   * @param {number} totalSets       - total sets in the workout
   */
  static async showWorkoutNotification(elapsedSeconds, setsCompleted, totalSets) {
    try {
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = elapsedSeconds % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      const progress = totalSets > 0
        ? `${setsCompleted}/${totalSets} sets`
        : 'Workout in progress';

      await Notifications.scheduleNotificationAsync({
        identifier: WORKOUT_LIVE_ID,
        content: {
          title: '⚔️ Dungeon Active',
          body: `${timeStr}  •  ${progress}  •  Tap to return`,
          data: { screen: 'Workout', isWorkoutLive: true },
          sticky: true,  // iOS: keeps it in notification center
          android: {
            channelId: 'workout_live',
            ongoing: true,
            autoCancel: false,
            smallIcon: 'notification_icon',
            color: '#cba153',
            showTimestamp: false,
          },
        },
        trigger: null, // deliver immediately
      });
    } catch (e) {
      console.warn('Failed to show workout notification', e);
    }
  }

  /**
   * Dismiss the live-workout notification from the tray.
   * Called when the workout is finished or cancelled.
   */
  static async cancelWorkoutNotification() {
    try {
      await Notifications.dismissNotificationAsync(WORKOUT_LIVE_ID);
    } catch (e) {
      // dismissNotificationAsync may throw if notification isn't present — safe to ignore
    }
  }
}

export default NotificationManager;
