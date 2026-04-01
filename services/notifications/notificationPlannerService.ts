import { notificationCopy } from '@/constants/notificationCopy';
import type { NotificationMealWindow, NotificationPlanItem, NotificationPlannerInput } from '@/types/notifications';
import { combineDateAndTimeIso } from '@/utils/date';

const mealReminderSchedule: Record<NotificationMealWindow, { hours: number; minutes: number }> = {
  breakfast: { hours: 9, minutes: 30 },
  lunch: { hours: 14, minutes: 0 },
  dinner: { hours: 19, minutes: 0 },
};

const eveningReminder = { hours: 20, minutes: 30 };

const isFutureTime = (iso: string, nowIso: string) => new Date(iso).getTime() > new Date(nowIso).getTime();

export const notificationPlannerService = {
  buildPlan(input: NotificationPlannerInput): NotificationPlanItem[] {
    const plans: NotificationPlanItem[] = [];

    const missingMealWindow = (['breakfast', 'lunch', 'dinner'] as NotificationMealWindow[]).find(
      (mealWindow) =>
        !input.mealTypesToday.includes(mealWindow) &&
        isFutureTime(
          combineDateAndTimeIso(input.today, mealReminderSchedule[mealWindow].hours, mealReminderSchedule[mealWindow].minutes),
          input.nowIso,
        ),
    );

    if (missingMealWindow) {
      const scheduledFor = combineDateAndTimeIso(
        input.today,
        mealReminderSchedule[missingMealWindow].hours,
        mealReminderSchedule[missingMealWindow].minutes,
      );
      const copy = notificationCopy.mealReminder(missingMealWindow);
      plans.push({
        id: `meal-${missingMealWindow}-${input.today}`,
        category: 'meal_reminder',
        mealWindow: missingMealWindow,
        title: copy.title,
        body: copy.body,
        scheduledFor,
      });
    }

    const eveningScheduledFor = combineDateAndTimeIso(input.today, eveningReminder.hours, eveningReminder.minutes);
    if (isFutureTime(eveningScheduledFor, input.nowIso)) {
      if (!input.mealTypesToday.length && input.recentLoggedDays >= 3) {
        const copy = notificationCopy.consistencyReminder(input.streakDays);
        plans.push({
          id: `consistency-${input.today}`,
          category: 'consistency',
          title: copy.title,
          body: copy.body,
          scheduledFor: eveningScheduledFor,
        });
      } else if (
        input.mealTypesToday.length > 0 &&
        ((input.proteinTarget && input.proteinToday >= input.proteinTarget * 0.75) || input.streakDays >= 4 || input.recentLoggedDays >= 5)
      ) {
        const copy = notificationCopy.progressNudge(input.goal, input.proteinToday, input.proteinTarget);
        plans.push({
          id: `progress-${input.today}`,
          category: 'progress',
          title: copy.title,
          body: copy.body,
          scheduledFor: eveningScheduledFor,
        });
      }
    }

    return plans.slice(0, 2);
  },
};
