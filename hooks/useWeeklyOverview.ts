import { useMemo } from 'react';

import { useMeals } from '@/hooks/useMeals';
import { useProfileStore } from '@/store/profileStore';
import { calculateWeeklyOverview } from '@/utils/nutrition';

export const useWeeklyOverview = () => {
  const meals = useMeals();
  const profile = useProfileStore((state) => state.profile);

  return useMemo(
    () =>
      calculateWeeklyOverview(meals, {
        calorieTarget: profile?.calorie_target ?? null,
        proteinTarget: profile?.protein_target ?? null,
        goal: profile?.goal ?? 'maintain',
      }),
    [meals, profile?.calorie_target, profile?.goal, profile?.protein_target],
  );
};
