import type { AnalyzedMealItem, DailyTotals, MealWithItems } from '@/types/meal';
import type { Nutrients } from '@/types/nutrition';

const round = (value: number) => Math.round(value * 10) / 10;

export const emptyNutrients = (): Nutrients => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
});

export const calculateMealTotals = (items: AnalyzedMealItem[]): Nutrients =>
  items.reduce<Nutrients>(
    (totals, item) => ({
      calories: round(totals.calories + item.calories),
      protein: round(totals.protein + item.protein),
      carbs: round(totals.carbs + item.carbs),
      fat: round(totals.fat + item.fat),
      fiber: round(totals.fiber + item.fiber),
      sugar: round(totals.sugar + item.sugar),
      sodium: round(totals.sodium + item.sodium),
    }),
    emptyNutrients(),
  );

export const calculateDayTotals = (date: string, meals: MealWithItems[]): DailyTotals =>
  meals.reduce<DailyTotals>(
    (totals, meal) => ({
      date,
      calories: round(totals.calories + meal.total_calories),
      protein: round(totals.protein + meal.total_protein),
      carbs: round(totals.carbs + meal.total_carbs),
      fat: round(totals.fat + meal.total_fat),
      fiber: round(totals.fiber + meal.total_fiber),
      sugar: round(totals.sugar + meal.total_sugar),
      sodium: round(totals.sodium + meal.total_sodium),
    }),
    { date, ...emptyNutrients() },
  );

export const calculateProgress = (current: number, target: number | null) => {
  if (!target || target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((current / target) * 100));
};

export const toMealTotalsRecord = (nutrients: Nutrients) => ({
  total_calories: nutrients.calories,
  total_protein: nutrients.protein,
  total_carbs: nutrients.carbs,
  total_fat: nutrients.fat,
  total_fiber: nutrients.fiber,
  total_sugar: nutrients.sugar,
  total_sodium: nutrients.sodium,
});
