import { useMemo } from 'react';

import { useMealStore } from '@/store/mealStore';
import type { MealWithItems } from '@/types/meal';

export const useMeals = (date?: string) => {
  const meals = useMealStore((state) => state.meals);

  return useMemo<MealWithItems[]>(
    () => (date ? meals.filter((meal) => meal.date === date) : meals),
    [date, meals],
  );
};
