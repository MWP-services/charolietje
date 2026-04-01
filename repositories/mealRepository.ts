import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedMeals } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Meal, MealItem, MealWithItems } from '@/types/meal';
import { sortMealsByCreatedAt } from '@/utils/date';

const mealsKey = (userId: string) => `nutrivoice:mock-meals:${userId}`;
const shouldUseMockMealStorage = (userId: string) => userId.startsWith('mock_') || userId.startsWith('guest_');

const ensureMockMeals = async (userId: string) => {
  const raw = await AsyncStorage.getItem(mealsKey(userId));
  if (raw) {
    return JSON.parse(raw) as MealWithItems[];
  }

  return [];
};

const mapSupabaseMeal = (meal: any): MealWithItems => {
  const { meal_items, ...mealRecord } = meal ?? {};

  return {
    ...mealRecord,
    items: (meal_items ?? []) as MealItem[],
  };
};

const toPersistedMealRecord = (meal: MealWithItems): Meal => {
  const {
    id,
    user_id,
    date,
    meal_type,
    original_text,
    transcription_text,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    total_fiber,
    total_sugar,
    total_sodium,
    created_at,
    updated_at,
  } = meal;

  return {
    id,
    user_id,
    date,
    meal_type,
    original_text,
    transcription_text,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    total_fiber,
    total_sugar,
    total_sodium,
    created_at,
    updated_at,
  };
};

const fetchMealItemsByMealIds = async (mealIds: string[]) => {
  if (!supabase || !mealIds.length) {
    return new Map<string, MealItem[]>();
  }

  const { data, error } = await supabase.from('meal_items').select('*').in('meal_id', mealIds);
  if (error) {
    throw error;
  }

  const itemsByMealId = new Map<string, MealItem[]>();
  ((data ?? []) as MealItem[]).forEach((item) => {
    const currentItems = itemsByMealId.get(item.meal_id) ?? [];
    currentItems.push(item);
    itemsByMealId.set(item.meal_id, currentItems);
  });

  return itemsByMealId;
};

const attachMealItems = async (meals: any[]) => {
  const itemsByMealId = await fetchMealItemsByMealIds(meals.map((meal) => meal.id));
  return meals.map((meal) =>
    mapSupabaseMeal({
      ...meal,
      meal_items: itemsByMealId.get(meal.id) ?? [],
    }),
  );
};

const toPersistedMealItem = ({
  nutritionSource,
  searchAliases,
  matched,
  matchedName,
  source,
  estimatedGrams,
  confidenceFood,
  confidenceAmount,
  needsClarification,
  clarificationType,
  clarificationQuestion,
  clarificationOptions,
  possiblePreparationMethods,
  possibleHiddenCalories,
  selectedPreparationMethod,
  selectedHiddenCalories,
  sourceContext,
  derivedFromClarification,
  parentItemName,
  templateKey,
  ...item
}: MealItem & {
  searchAliases?: string[];
  matched?: boolean;
  matchedName?: string | null;
  source?: string | null;
}) => item;

const fetchSupabaseMeal = async (mealId: string) => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from('meals').select('*').eq('id', mealId).single();
  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [meal] = await attachMealItems([data]);
  return meal ?? null;
};

export const mealRepository = {
  async listMeals(userId: string) {
    if (isSupabaseConfigured && supabase && !shouldUseMockMealStorage(userId)) {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return sortMealsByCreatedAt(await attachMealItems(data ?? []));
    }

    return sortMealsByCreatedAt(await ensureMockMeals(userId));
  },

  async getMeal(userId: string, mealId: string) {
    const meals = await this.listMeals(userId);
    return meals.find((meal) => meal.id === mealId) ?? null;
  },

  async saveMeal(meal: MealWithItems) {
    if (isSupabaseConfigured && supabase && !shouldUseMockMealStorage(meal.user_id)) {
      const mealRecord = toPersistedMealRecord(meal);
      const items = meal.items;
      const { error: mealError } = await supabase.from('meals').upsert(mealRecord);
      if (mealError) {
        throw new Error(mealError.message);
      }

      const { error: deleteItemsError } = await supabase.from('meal_items').delete().eq('meal_id', meal.id);
      if (deleteItemsError) {
        throw new Error(deleteItemsError.message);
      }

      const { error: itemsError } = await supabase.from('meal_items').insert(items.map(toPersistedMealItem));
      if (itemsError) {
        throw new Error(itemsError.message);
      }

      return (await fetchSupabaseMeal(meal.id)) ?? meal;
    }

    const meals = await ensureMockMeals(meal.user_id);
    const nextMeals = sortMealsByCreatedAt([meal, ...meals.filter((existing) => existing.id !== meal.id)]);
    await AsyncStorage.setItem(mealsKey(meal.user_id), JSON.stringify(nextMeals));
    return meal;
  },

  async deleteMeal(userId: string, mealId: string) {
    if (isSupabaseConfigured && supabase && !shouldUseMockMealStorage(userId)) {
      const { error } = await supabase.from('meals').delete().eq('id', mealId).eq('user_id', userId);
      if (error) {
        throw error;
      }
      return;
    }

    const meals = await ensureMockMeals(userId);
    const nextMeals = meals.filter((meal) => meal.id !== mealId);
    await AsyncStorage.setItem(mealsKey(userId), JSON.stringify(nextMeals));
  },

  async clearLocalMeals(userId: string) {
    await AsyncStorage.removeItem(mealsKey(userId));
  },

  async seedDemoMeals(userId: string) {
    const demoMeals = buildSeedMeals(userId);

    if (isSupabaseConfigured && supabase && !shouldUseMockMealStorage(userId)) {
      for (const meal of demoMeals) {
        await this.saveMeal(meal);
      }

      return sortMealsByCreatedAt(demoMeals);
    }

    await AsyncStorage.setItem(mealsKey(userId), JSON.stringify(sortMealsByCreatedAt(demoMeals)));
    return demoMeals;
  },
};
