import type { GoalType } from '@/types/profile';
import type { NotificationMealWindow } from '@/types/notifications';

const mealWindowLabels: Record<NotificationMealWindow, string> = {
  breakfast: 'ontbijt',
  lunch: 'lunch',
  dinner: 'avondeten',
};

export const notificationCopy = {
  mealReminder(mealWindow: NotificationMealWindow) {
    return {
      title: `Je ${mealWindowLabels[mealWindow]} staat nog open`,
      body:
        mealWindow === 'breakfast'
          ? 'Wil je je ontbijt snel toevoegen? Een korte beschrijving is genoeg.'
          : mealWindow === 'lunch'
            ? 'Voeg je lunch toe wanneer het uitkomt. Dan blijft je dagbeeld compleet.'
            : 'Log je avondeten wanneer je klaar bent. Dan klopt je dagtotaal weer beter.',
    };
  },
  consistencyReminder(streakDays: number) {
    return {
      title: streakDays >= 3 ? 'Houd je ritme vast' : 'Een snelle log helpt later',
      body:
        streakDays >= 3
          ? `Je bent al ${streakDays} dagen lekker bezig. Een korte maaltijdlog houdt die lijn vast.`
          : 'Nog niets gelogd vandaag? Met een snelle invoer blijft je overzicht bruikbaar.',
    };
  },
  progressNudge(goal: GoalType, proteinToday: number, proteinTarget: number | null) {
    if (goal === 'build_muscle' && proteinTarget && proteinToday >= proteinTarget * 0.75) {
      return {
        title: 'Je eiwitten liggen mooi op koers',
        body: 'Lekker bezig. Als je je laatste maaltijd ook logt, blijft je dagbeeld compleet.',
      };
    }

    if (goal === 'lose_weight') {
      return {
        title: 'Je dag krijgt al vorm',
        body: 'Log je volgende maaltijd ook even. Zo zie je beter hoe je calorieen zich opbouwen.',
      };
    }

    return {
      title: 'Je voortgang ziet er rustig uit',
      body: 'Nog een korte log vandaag maakt je weekbeeld straks een stuk sterker.',
    };
  },
};
