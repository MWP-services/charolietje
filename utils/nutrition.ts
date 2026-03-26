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
const volumeUnitToMilliliters: Record<string, number> = {
  ml: 1,
  cup: 240,
  glass: 250,
  mug: 300,
  bowl: 350,
  tbsp: 15,
  tsp: 5,
  bottle: 500,
  can: 330,
  pot: 150,
};
const weightUnitToGrams: Record<string, number> = {
  gram: 1,
  handful: 30,
  scoop: 30,
  pack: 100,
};

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

const normalizeUnit = (unit: string) => {
  const normalized = unit.trim().toLowerCase();

  switch (normalized) {
    case 'g':
    case 'gram':
    case 'grams':
    case 'gr':
      return 'gram';
    case 'ml':
    case 'milliliter':
    case 'milliliters':
    case 'millilitre':
    case 'millilitres':
      return 'ml';
    case 'cup':
    case 'cups':
    case 'kop':
    case 'koppen':
    case 'kopje':
    case 'kopjes':
      return 'cup';
    case 'glass':
    case 'glasses':
    case 'glas':
    case 'glazen':
      return 'glass';
    case 'mug':
    case 'mugs':
    case 'mok':
    case 'mokken':
      return 'mug';
    case 'bowl':
    case 'bowls':
    case 'kom':
    case 'kommen':
    case 'bak':
    case 'bakje':
    case 'bakjes':
      return 'bowl';
    case 'tablespoon':
    case 'tablespoons':
    case 'tbsp':
    case 'eetlepel':
    case 'eetlepels':
      return 'tbsp';
    case 'teaspoon':
    case 'teaspoons':
    case 'tsp':
    case 'theelepel':
    case 'theelepels':
      return 'tsp';
    case 'piece':
    case 'pieces':
    case 'stuk':
    case 'stuks':
    case 'reep':
    case 'repen':
    case 'bar':
    case 'bars':
      return 'piece';
    case 'slice':
    case 'slices':
    case 'sneetje':
    case 'sneetjes':
      return 'slice';
    case 'hand':
    case 'handful':
    case 'handfuls':
    case 'handje':
    case 'handjes':
      return 'handful';
    case 'scoop':
    case 'scoops':
    case 'schep':
    case 'scheppen':
      return 'scoop';
    case 'can':
    case 'cans':
    case 'blik':
    case 'blikken':
      return 'can';
    case 'bottle':
    case 'bottles':
    case 'fles':
    case 'flessen':
      return 'bottle';
    case 'pot':
    case 'pots':
      return 'pot';
    case 'pack':
    case 'packs':
    case 'pak':
    case 'pakken':
    case 'pakket':
    case 'pakketjes':
      return 'pack';
    case 'serving':
    case 'servings':
    case 'portie':
    case 'porties':
      return 'serving';
    default:
      return normalized;
  }
};

const getComparableAmount = (quantity: number, unit: string) => {
  const normalizedUnit = normalizeUnit(unit);

  if (volumeUnitToMilliliters[normalizedUnit]) {
    return {
      kind: 'volume' as const,
      amount: quantity * volumeUnitToMilliliters[normalizedUnit],
    };
  }

  if (weightUnitToGrams[normalizedUnit]) {
    return {
      kind: 'weight' as const,
      amount: quantity * weightUnitToGrams[normalizedUnit],
    };
  }

  if (['piece', 'slice', 'serving'].includes(normalizedUnit)) {
    return {
      kind: 'count' as const,
      amount: quantity,
    };
  }

  return null;
};

export const scaleItemNutritionToQuantity = <T extends (AnalyzedMealItem | MealItem) & OptionalNutrients>(
  item: T,
  nextQuantity: number,
  nextUnit = item.unit,
): Partial<T> => {
  if (!hasCompleteNutrition(item) || nextQuantity <= 0 || item.quantity <= 0) {
    return {
      quantity: nextQuantity,
      unit: nextUnit,
    } as Partial<T>;
  }

  const currentAmount = getComparableAmount(item.quantity, item.unit);
  const nextAmount = getComparableAmount(nextQuantity, nextUnit);
  const ratio = currentAmount && nextAmount && currentAmount.kind === nextAmount.kind ? nextAmount.amount / currentAmount.amount : null;

  if (!ratio || !Number.isFinite(ratio) || ratio <= 0) {
    return {
      quantity: nextQuantity,
      unit: nextUnit,
    } as Partial<T>;
  }

  return {
    quantity: nextQuantity,
    unit: nextUnit,
    calories: round(asNumber(item.calories) * ratio),
    protein: round(asNumber(item.protein) * ratio),
    carbs: round(asNumber(item.carbs) * ratio),
    fat: round(asNumber(item.fat) * ratio),
    fiber: round(asNumber(item.fiber) * ratio),
    sugar: round(asNumber(item.sugar) * ratio),
    sodium: round(asNumber(item.sodium) * ratio),
    nutritionSource: item.nutritionSource === 'unresolved' ? 'unresolved' : item.nutritionSource === 'estimated' ? 'estimated' : 'manual',
  } as Partial<T>;
};

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
