import type { GoalType } from '@/types/profile';

export type NotificationCategory = 'meal_reminder' | 'consistency' | 'progress';
export type NotificationMealWindow = 'breakfast' | 'lunch' | 'dinner';

export type NotificationPlanItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  scheduledFor: string;
  mealWindow?: NotificationMealWindow;
};

export type NotificationPlannerInput = {
  today: string;
  nowIso: string;
  mealDates: string[];
  mealTypesToday: string[];
  recentLoggedDays: number;
  streakDays: number;
  caloriesToday: number;
  proteinToday: number;
  calorieTarget: number | null;
  proteinTarget: number | null;
  goal: GoalType;
};
