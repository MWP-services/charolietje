import type { DailyTotals, MealWithItems } from '@/types/meal';
import type { GoalType } from '@/types/profile';

export type PremiumAdvice = {
  summary: string;
  strengths: string[];
  improvements: string[];
  warnings: string[];
  goal_specific_tips: string[];
};

export type PremiumAdviceInput = {
  goal: GoalType;
  dailyTotals: DailyTotals;
  recentMeals: MealWithItems[];
  calorieTarget: number | null;
  proteinTarget: number | null;
};
