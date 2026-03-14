import {
  format,
  formatDistanceToNowStrict,
  isSameDay,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns';

import type { MealWithItems } from '@/types/meal';

export const getTodayIsoDate = () => format(new Date(), 'yyyy-MM-dd');

export const formatDisplayDate = (date: string) => format(parseISO(date), 'EEEE d MMM');

export const formatLongDate = (date: string) => format(parseISO(date), 'd MMMM yyyy');

export const formatRelativeDay = (date: string) => {
  const parsed = parseISO(date);
  if (isSameDay(parsed, new Date())) {
    return 'Today';
  }

  return formatDistanceToNowStrict(parsed, { addSuffix: true });
};

export const getLastNDates = (count: number) =>
  Array.from({ length: count }, (_, index) => format(subDays(new Date(), index), 'yyyy-MM-dd')).reverse();

export const getWeekStartIso = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

export const sortMealsByCreatedAt = (meals: MealWithItems[]) =>
  [...meals].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
