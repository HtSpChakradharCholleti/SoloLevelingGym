import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Only set the handler when needed or inside an init function to avoid top-level triggers
export const initNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
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
    }
    
    return finalStatus === 'granted';
  }

  static async scheduleDailyNotification(title, body, hour, minute, data = {}) {
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);
    
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
    
    const secondsUntil = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));
    
    const trigger = {
      type: 'timeInterval', // Explicitly set type to avoid "invalid trigger" error
      seconds: secondsUntil,
      repeats: false,
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

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default NotificationManager;
