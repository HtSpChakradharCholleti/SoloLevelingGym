import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Only set the handler when needed or inside an init function to avoid top-level triggers
export const initNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
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
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return finalStatus === 'granted';
  }

  static async scheduleWorkoutReminder() {
    // Cancel existing to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule for the next occurrence of 10:00 AM
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(10, 0, 0, 0);
    
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
    
    const secondsUntil = Math.max(1, Math.floor((triggerDate.getTime() - now.getTime()) / 1000));
    
    const trigger = {
      type: 'timeInterval',
      seconds: secondsUntil,
      repeats: false,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Level Up! ⚔️",
        body: "Your daily quest is waiting. Don't let your stats drop!",
        data: { screen: 'Workout' },
        sound: true,
      },
      trigger,
    });
  }

  static async scheduleTestNotification() {
    const trigger = {
      type: 'timeInterval',
      seconds: 5,
      repeats: false,
    };

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "System Online 🚀",
        body: "Local notifications are now active. Ready for combat!",
        sound: true,
      },
      trigger,
    });
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

export default NotificationManager;
