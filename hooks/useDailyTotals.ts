import { useMemo } from 'react';

import { useMeals } from '@/hooks/useMeals';
import { getTodayIsoDate } from '@/utils/date';
import { calculateDayTotals } from '@/utils/nutrition';

export const useDailyTotals = (date = getTodayIsoDate()) => {
  const meals = useMeals(date);

  return useMemo(() => calculateDayTotals(date, meals), [date, meals]);
};
