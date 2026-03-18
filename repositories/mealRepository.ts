import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedMeals } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MealItem, MealWithItems } from '@/types/meal';
import { sortMealsByCreatedAt } from '@/utils/date';

const mealsKey = (userId: string) => `nutrivoice:mock-meals:${userId}`;
const shouldUseMockMealStorage = (userId: string) => userId.startsWith('mock_') || userId.startsWith('guest_');

const ensureMockMeals = async (userId: string) => {
  const raw = await AsyncStorage.getItem(mealsKey(userId));
  if (raw) {
    return JSON.parse(raw) as MealWithItems[];
  }

  const seeded = buildSeedMeals(userId);
  await AsyncStorage.setItem(mealsKey(userId), JSON.stringify(seeded));
  return sortMealsByCreatedAt(seeded);
};

const mapSupabaseMeal = (meal: any): MealWithItems => ({
  ...meal,
  items: (meal.meal_items ?? []) as MealItem[],
});

const fetchSupabaseMeal = async (mealId: string) => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from('meals').select('*, meal_items(*)').eq('id', mealId).single();
  if (error) {
    throw error;
  }

  return data ? mapSupabaseMeal(data) : null;
};

export const mealRepository = {
  async listMeals(userId: string) {
    if (isSupabaseConfigured && supabase && !shouldUseMockMealStorage(userId)) {
      const { data, error } = await supabase
        .from('meals')
        .select('*, meal_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return sortMealsByCreatedAt((data ?? []).map(mapSupabaseMeal));
    }

    return sortMealsByCreatedAt(await ensureMockMeals(userId));
  },

  async getMeal(userId: string, mealId: string) {
    const meals = await this.listMeals(userId);
    return meals.find((meal) => meal.id === mealId) ?? null;
  },

  async saveMeal(meal: MealWithItems) {
    if (isSupabaseConfigured && supabase && !shouldUseMockMealStorage(meal.user_id)) {
      const { items, ...mealRecord } = meal;
      const { error: mealError } = await supabase.from('meals').upsert(mealRecord);
      if (mealError) {
        throw new Error(mealError.message);
      }

      const { error: deleteItemsError } = await supabase.from('meal_items').delete().eq('meal_id', meal.id);
      if (deleteItemsError) {
        throw new Error(deleteItemsError.message);
      }

      const { error: itemsError } = await supabase.from('meal_items').insert(items);
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
};
