import type { DailyTotals, MealItem, MealWithItems, WeeklyOverview, WeeklyOverviewDay, AnalyzedMealItem } from '@/types/meal';
import type { NutrientKey, Nutrients, OptionalNutrients } from '@/types/nutrition';
import type { GoalType } from '@/types/profile';
import { getWeekDates, toIsoDate } from '@/utils/date';

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
      estimatedGrams: nextUnit === 'gram' || nextUnit === 'ml' ? nextQuantity : item.estimatedGrams,
    } as Partial<T>;
  }

  const currentAmount = getComparableAmount(item.quantity, item.unit);
  const nextAmount = getComparableAmount(nextQuantity, nextUnit);
  const ratio = currentAmount && nextAmount && currentAmount.kind === nextAmount.kind ? nextAmount.amount / currentAmount.amount : null;

  if (!ratio || !Number.isFinite(ratio) || ratio <= 0) {
    return {
      quantity: nextQuantity,
      unit: nextUnit,
      estimatedGrams: nextUnit === 'gram' || nextUnit === 'ml' ? nextQuantity : item.estimatedGrams,
    } as Partial<T>;
  }

  return {
    quantity: nextQuantity,
    unit: nextUnit,
    estimatedGrams: nextUnit === 'gram' || nextUnit === 'ml' ? nextQuantity : item.estimatedGrams,
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

export const getStreakFromDates = (dates: string[], referenceDate = new Date()) => {
  let streak = 0;
  const uniqueDates = new Set(dates);

  while (true) {
    const current = new Date(referenceDate);
    current.setDate(referenceDate.getDate() - streak);
    const iso = toIsoDate(current);
    if (!uniqueDates.has(iso)) {
      break;
    }
    streak += 1;
  }

  return streak;
};

const averageNutrients = (totals: Nutrients, divisor: number): Nutrients => {
  if (divisor <= 0) {
    return emptyNutrients();
  }

  return {
    calories: round(totals.calories / divisor),
    protein: round(totals.protein / divisor),
    carbs: round(totals.carbs / divisor),
    fat: round(totals.fat / divisor),
    fiber: round(totals.fiber / divisor),
    sugar: round(totals.sugar / divisor),
    sodium: round(totals.sodium / divisor),
  };
};

const resolveTrendDirection = (days: WeeklyOverviewDay[]) => {
  const loggedDays = days.filter((day) => day.mealCount > 0);
  if (loggedDays.length < 4) {
    return 'stable' as const;
  }

  const midpoint = Math.floor(loggedDays.length / 2);
  const firstHalf = loggedDays.slice(0, midpoint);
  const secondHalf = loggedDays.slice(midpoint);
  const firstAverageProtein = firstHalf.reduce((sum, day) => sum + day.totals.protein, 0) / Math.max(firstHalf.length, 1);
  const secondAverageProtein = secondHalf.reduce((sum, day) => sum + day.totals.protein, 0) / Math.max(secondHalf.length, 1);

  if (secondAverageProtein - firstAverageProtein >= 8) {
    return 'up' as const;
  }

  if (firstAverageProtein - secondAverageProtein >= 8) {
    return 'down' as const;
  }

  return 'stable' as const;
};

const buildWeeklySummary = ({
  goal,
  loggedDays,
  consistencyRate,
  averageCaloriesPerLoggedDay,
  averageProteinPerLoggedDay,
  calorieGoalProgress,
  proteinGoalProgress,
  trendDirection,
}: {
  goal: GoalType;
  loggedDays: number;
  consistencyRate: number;
  averageCaloriesPerLoggedDay: number;
  averageProteinPerLoggedDay: number;
  calorieGoalProgress: number | null;
  proteinGoalProgress: number | null;
  trendDirection: WeeklyOverview['trendDirection'];
}) => {
  const consistencyLine =
    loggedDays >= 6
      ? `Je logde ${loggedDays} van de 7 dagen. Dat is sterke regelmaat.`
      : loggedDays >= 4
        ? `Je logde ${loggedDays} van de 7 dagen. Je ritme begint echt te staan.`
        : loggedDays > 0
          ? `Je logde ${loggedDays} van de 7 dagen. Nog een paar dagen extra maakt je patroon veel duidelijker.`
          : 'Je hebt deze week nog geen maaltijden gelogd.';

  if (loggedDays === 0) {
    return {
      summary: consistencyLine,
      supportMessage: 'Log je eerste maaltijd en NutriVoice bouwt vanaf daar rustig je weekbeeld op.',
    };
  }

  const goalLine =
    goal === 'build_muscle'
      ? proteinGoalProgress !== null && proteinGoalProgress >= 85
        ? 'Je gemiddelde eiwitinname ligt dicht bij je weekdoel.'
        : `Gemiddeld zit je op ${Math.round(averageProteinPerLoggedDay)} g eiwit per dag.`
      : goal === 'lose_weight'
        ? calorieGoalProgress !== null && calorieGoalProgress <= 103
          ? 'Je gemiddelde calorieinname blijft mooi in de buurt van je doel.'
          : `Je weekgemiddelde komt uit op ${Math.round(averageCaloriesPerLoggedDay)} kcal per gelogde dag.`
        : calorieGoalProgress !== null && proteinGoalProgress !== null
          ? 'Je calorieen en eiwitten bouwen samen aan een stabiele basis.'
          : `Je weekgemiddelde komt uit op ${Math.round(averageCaloriesPerLoggedDay)} kcal en ${Math.round(averageProteinPerLoggedDay)} g eiwit.`;

  const trendLine =
    trendDirection === 'up'
      ? 'Je eiwittrend loopt omhoog ten opzichte van het begin van de week.'
      : trendDirection === 'down'
        ? 'Je eiwittrend is iets gedaald. Een extra eiwitmoment kan helpen.'
        : consistencyRate >= 70
          ? 'Je week ziet er rustig en consistent uit.'
          : 'Meer complete logdagen geven een scherper beeld van je voortgang.';

  return {
    summary: `${consistencyLine} ${goalLine}`.trim(),
    supportMessage: trendLine,
  };
};

export const calculateWeeklyOverview = (
  meals: MealWithItems[],
  options?: {
    referenceDate?: Date;
    calorieTarget?: number | null;
    proteinTarget?: number | null;
    goal?: GoalType;
  },
): WeeklyOverview => {
  const referenceDate = options?.referenceDate ?? new Date();
  const dates = getWeekDates(referenceDate);
  const days: WeeklyOverviewDay[] = dates.map((date) => {
    const mealsForDay = meals.filter((meal) => meal.date === date);
    const totals = calculateDayTotals(date, mealsForDay);

    return {
      date,
      label: date.slice(5),
      mealCount: mealsForDay.length,
      totals,
      calorieProgress: options?.calorieTarget ? calculateProgress(totals.calories, options.calorieTarget) : null,
      proteinProgress: options?.proteinTarget ? calculateProgress(totals.protein, options.proteinTarget) : null,
    };
  });

  const weekTotals = days.reduce<Nutrients>(
    (totals, day) => ({
      calories: round(totals.calories + day.totals.calories),
      protein: round(totals.protein + day.totals.protein),
      carbs: round(totals.carbs + day.totals.carbs),
      fat: round(totals.fat + day.totals.fat),
      fiber: round(totals.fiber + day.totals.fiber),
      sugar: round(totals.sugar + day.totals.sugar),
      sodium: round(totals.sodium + day.totals.sodium),
    }),
    emptyNutrients(),
  );

  const loggedDays = days.filter((day) => day.mealCount > 0).length;
  const totalMeals = days.reduce((sum, day) => sum + day.mealCount, 0);
  const averages = averageNutrients(weekTotals, 7);
  const perLoggedDay = averageNutrients(weekTotals, Math.max(loggedDays, 1));
  const calorieGoalProgress = options?.calorieTarget ? Math.round((perLoggedDay.calories / options.calorieTarget) * 100) : null;
  const proteinGoalProgress = options?.proteinTarget ? Math.round((perLoggedDay.protein / options.proteinTarget) * 100) : null;
  const strongestDay = [...days].sort((left, right) => right.totals.protein - left.totals.protein)[0] ?? null;
  const weakestDay = [...days].filter((day) => day.mealCount > 0).sort((left, right) => left.totals.protein - right.totals.protein)[0] ?? null;
  const trendDirection = resolveTrendDirection(days);
  const consistencyRate = Math.round((loggedDays / 7) * 100);
  const copy = buildWeeklySummary({
    goal: options?.goal ?? 'maintain',
    loggedDays,
    consistencyRate,
    averageCaloriesPerLoggedDay: perLoggedDay.calories,
    averageProteinPerLoggedDay: perLoggedDay.protein,
    calorieGoalProgress,
    proteinGoalProgress,
    trendDirection,
  });

  return {
    days,
    dateFrom: dates[0],
    dateTo: dates[dates.length - 1],
    loggedDays,
    consistencyRate,
    totalMeals,
    averages,
    averageCaloriesPerLoggedDay: perLoggedDay.calories,
    averageProteinPerLoggedDay: perLoggedDay.protein,
    averageCarbsPerLoggedDay: perLoggedDay.carbs,
    averageFatPerLoggedDay: perLoggedDay.fat,
    calorieGoalProgress,
    proteinGoalProgress,
    strongestDay: strongestDay?.mealCount ? strongestDay : null,
    weakestDay: weakestDay ?? null,
    trendDirection,
    summary: copy.summary,
    supportMessage: copy.supportMessage,
  };
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
