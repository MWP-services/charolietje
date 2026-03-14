import type { GoalType } from '@/types/profile';

export const formatCalories = (value: number) => `${Math.round(value)} kcal`;

export const formatGrams = (value: number) => `${Math.round(value)} g`;

export const formatMilligrams = (value: number) => `${Math.round(value)} mg`;

export const formatNutrientValue = (label: string, value: number) => {
  if (label.toLowerCase() === 'sodium') {
    return formatMilligrams(value);
  }

  if (label.toLowerCase() === 'calories') {
    return formatCalories(value);
  }

  return formatGrams(value);
};

export const formatMealType = (mealType: string) =>
  mealType.charAt(0).toUpperCase() + mealType.slice(1).replace('_', ' ');

export const formatGoal = (goal: GoalType) => {
  switch (goal) {
    case 'lose_weight':
      return 'Lose weight';
    case 'build_muscle':
      return 'Build muscle';
    default:
      return 'Maintain weight';
  }
};
