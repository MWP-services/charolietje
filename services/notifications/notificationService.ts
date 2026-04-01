import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationPlannerService } from '@/services/notifications/notificationPlannerService';
import type { MealWithItems } from '@/types/meal';
import type { NotificationPermissionStatus } from '@/types/profile';
import type { UserProfile } from '@/types/profile';
import { getTodayIsoDate } from '@/utils/date';
import { calculateDayTotals, calculateWeeklyOverview, getStreakFromDates } from '@/utils/nutrition';

const notificationKey = (userId?: string) => `nutrivoice:scheduled-notifications:${userId ?? 'anonymous'}`;
let notificationHandlerInitialized = false;

const normalizePermissionStatus = (status: Notifications.PermissionStatus): NotificationPermissionStatus =>
  status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';

const loadScheduledIds = async (userId?: string) => {
  const raw = await AsyncStorage.getItem(notificationKey(userId));
  return raw ? (JSON.parse(raw) as string[]) : [];
};

const storeScheduledIds = async (userId: string | undefined, ids: string[]) => {
  await AsyncStorage.setItem(notificationKey(userId), JSON.stringify(ids));
};

export const notificationService = {
  async initialize() {
    if (Platform.OS === 'web') {
      return;
    }

    if (notificationHandlerInitialized) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerInitialized = true;
  },

  async getPermissionStatus() {
    await this.initialize();
    if (Platform.OS === 'web') {
      return 'denied';
    }
    const permission = await Notifications.getPermissionsAsync();
    return normalizePermissionStatus(permission.status);
  },

  async requestPermissions() {
    await this.initialize();
    if (Platform.OS === 'web') {
      return 'denied';
    }
    const permission = await Notifications.requestPermissionsAsync();
    return normalizePermissionStatus(permission.status);
  },

  async cancelSmartReminders(userId?: string) {
    if (Platform.OS === 'web') {
      return;
    }

    if (!userId) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const ids = await loadScheduledIds(userId);
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
    await AsyncStorage.removeItem(notificationKey(userId));
  },

  async syncSmartReminders({
    userId,
    profile,
    meals,
  }: {
    userId: string;
    profile: UserProfile;
    meals: MealWithItems[];
  }) {
    await this.initialize();
    if (Platform.OS === 'web') {
      return;
    }

    if (!profile.notifications_enabled) {
      await this.cancelSmartReminders(userId);
      return;
    }

    const permissionStatus = await this.getPermissionStatus();
    if (permissionStatus !== 'granted') {
      await this.cancelSmartReminders(userId);
      return;
    }

    const today = getTodayIsoDate();
    const todayMeals = meals.filter((meal) => meal.date === today);
    const weeklyOverview = calculateWeeklyOverview(meals, {
      calorieTarget: profile.calorie_target ?? null,
      proteinTarget: profile.protein_target ?? null,
      goal: profile.goal,
    });

    const plans = notificationPlannerService
      .buildPlan({
        today,
        nowIso: new Date().toISOString(),
        mealDates: meals.map((meal) => meal.date),
        mealTypesToday: todayMeals.map((meal) => meal.meal_type),
        recentLoggedDays: weeklyOverview.loggedDays,
        streakDays: getStreakFromDates([...new Set(meals.map((meal) => meal.date))]),
        caloriesToday: calculateDayTotals(today, todayMeals).calories,
        proteinToday: calculateDayTotals(today, todayMeals).protein,
        calorieTarget: profile.calorie_target ?? null,
        proteinTarget: profile.protein_target ?? null,
        goal: profile.goal,
      })
      .filter((plan) => {
        if (plan.category === 'meal_reminder') {
          return profile.meal_reminders_enabled;
        }

        if (plan.category === 'consistency') {
          return profile.consistency_reminders_enabled;
        }

        return profile.progress_nudges_enabled;
      });

    await this.cancelSmartReminders(userId);

    const scheduledIds: string[] = [];
    for (const plan of plans) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: plan.title,
          body: plan.body,
          data: {
            smartReminderId: plan.id,
            category: plan.category,
            mealWindow: plan.mealWindow ?? null,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(plan.scheduledFor),
        },
      });

      scheduledIds.push(identifier);
    }

    await storeScheduledIds(userId, scheduledIds);
  },
};
