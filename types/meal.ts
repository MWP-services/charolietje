import type { Nutrients, OptionalNutrients } from '@/types/nutrition';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown';
export type MealNutritionSource = 'matched' | 'manual' | 'unresolved' | 'estimated';

export type Meal = {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  original_text: string;
  transcription_text: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  created_at: string;
  updated_at: string;
};

export type MealItem = {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  confidence?: number | null;
  nutritionSource?: MealNutritionSource;
} & OptionalNutrients;

export type MealWithItems = Meal & {
  items: MealItem[];
};

export type DailyTotals = Nutrients & {
  date: string;
};

export type ParsedMealItem = {
  name: string;
  quantity: number;
  unit: string;
  confidence?: number | null;
  searchAliases?: string[];
};

export type ParsedMeal = {
  mealType: MealType;
  items: ParsedMealItem[];
  originalText: string;
};

export type AnalyzedMealItem = ParsedMealItem &
  OptionalNutrients & {
    nutritionSource?: MealNutritionSource;
  };

export type AnalyzedMeal = {
  mealType: MealType;
  originalText: string;
  items: AnalyzedMealItem[];
  totals: Nutrients;
};

export type DayHistoryEntry = {
  date: string;
  totals: DailyTotals;
  meals: MealWithItems[];
};
