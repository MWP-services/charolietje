import type { AnalyzedMealItem, DailyTotals, MealItem, MealWithItems } from '@/types/meal';
import type { NutrientKey, Nutrients, OptionalNutrients } from '@/types/nutrition';

const round = (value: number) => Math.round(value * 10) / 10;
export const nutrientKeys: NutrientKey[] = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'];
const nutrientLabels: Record<NutrientKey, string> = {
  calories: 'calorieen',
  protein: 'eiwit',
  carbs: 'koolhydraten',
  fat: 'vet',
  fiber: 'vezels',
  sugar: 'suiker',
  sodium: 'natrium',
};
const asNumber = (value: number | null | undefined) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

export const emptyNutrients = (): Nutrients => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
});

export const emptyOptionalNutrients = (): OptionalNutrients => ({
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  sugar: null,
  sodium: null,
});

export const hasCompleteNutrition = (item: OptionalNutrients) =>
  nutrientKeys.every((key) => typeof item[key] === 'number' && Number.isFinite(item[key]));

export const getMissingNutritionLabels = (item: OptionalNutrients) =>
  nutrientKeys.filter((key) => item[key] === null).map((key) => nutrientLabels[key]);

export const calculateMealTotals = (items: Array<AnalyzedMealItem | MealItem>): Nutrients =>
  items.reduce<Nutrients>(
    (totals, item) => ({
      calories: round(totals.calories + asNumber(item.calories)),
      protein: round(totals.protein + asNumber(item.protein)),
      carbs: round(totals.carbs + asNumber(item.carbs)),
      fat: round(totals.fat + asNumber(item.fat)),
      fiber: round(totals.fiber + asNumber(item.fiber)),
      sugar: round(totals.sugar + asNumber(item.sugar)),
      sodium: round(totals.sodium + asNumber(item.sodium)),
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
