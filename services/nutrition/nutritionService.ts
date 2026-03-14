import { mockNutritionDatabase } from '@/constants/mockNutritionDatabase';
import type { AnalyzedMealItem, ParsedMealItem } from '@/types/meal';

const withDelay = async <T>(value: T, delay = 650) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), delay);
  });

const round = (value: number) => Math.round(value * 10) / 10;

export const getNutritionForItemsMock = async (items: ParsedMealItem[]): Promise<AnalyzedMealItem[]> => {
  const enriched = items.map((item) => {
    const reference = mockNutritionDatabase[item.name] ?? mockNutritionDatabase.bread;
    const multiplier = item.quantity / reference.baseQuantity;

    return {
      ...item,
      calories: round(reference.calories * multiplier),
      protein: round(reference.protein * multiplier),
      carbs: round(reference.carbs * multiplier),
      fat: round(reference.fat * multiplier),
      fiber: round(reference.fiber * multiplier),
      sugar: round(reference.sugar * multiplier),
      sodium: round(reference.sodium * multiplier),
    };
  });

  return withDelay(enriched, 520);
};

// TODO: Replace this mock enrichment with a nutrition API or internal matcher.
export const nutritionService = {
  getNutritionForItems: getNutritionForItemsMock,
};
