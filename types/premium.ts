import type { DailyTotals, MealWithItems } from '@/types/meal';
import type { GoalType } from '@/types/profile';

export type PremiumAdvice = {
  coach_score: number;
  score_label: string;
  summary: string;
  pattern_summary: string;
  next_meal_focus: string;
  checklist: string[];
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
