import { subDays } from 'date-fns';

import { isSupabaseConfigured } from '@/lib/supabase';
import type { MealWithItems } from '@/types/meal';
import type { UserProfile } from '@/types/profile';
import { createId, createUuid } from '@/utils/id';
import { calculateMealTotals, toMealTotalsRecord } from '@/utils/nutrition';

const buildMeal = (
  userId: string,
  offsetDays: number,
  mealType: MealWithItems['meal_type'],
  originalText: string,
  itemSeeds: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  }>,
) => {
  const createdAt = subDays(new Date(), offsetDays).toISOString();
  const date = createdAt.slice(0, 10);
  const mealId = isSupabaseConfigured ? createUuid() : createId('meal');
  const items = itemSeeds.map((item) => ({
    ...item,
    id: isSupabaseConfigured ? createUuid() : createId('item'),
    meal_id: mealId,
    confidence: 0.9,
  }));
  const totals = calculateMealTotals(items);

  return {
    id: mealId,
    user_id: userId,
    date,
    meal_type: mealType,
    original_text: originalText,
    transcription_text: originalText,
    created_at: createdAt,
    updated_at: createdAt,
    ...toMealTotalsRecord(totals),
    items,
  } satisfies MealWithItems;
};

export const buildSeedProfile = (userId: string, email?: string | null): UserProfile => {
  const now = new Date().toISOString();

  return {
    id: userId,
    full_name: email?.split('@')[0] ?? 'NutriVoice gebruiker',
    email: email ?? undefined,
    goal: 'build_muscle',
    calorie_target: 2600,
    protein_target: 180,
    is_premium: false,
    age: 31,
    weight_kg: 78,
    height_cm: 182,
    has_completed_onboarding: true,
    has_received_demo: false,
    notifications_enabled: false,
    meal_reminders_enabled: true,
    consistency_reminders_enabled: true,
    progress_nudges_enabled: true,
    notification_permission_status: 'undetermined',
    created_at: now,
    updated_at: now,
  };
};

export const buildSeedMeals = (userId: string): MealWithItems[] => [
  buildMeal(
    userId,
    0,
    'breakfast',
    'Als ontbijt heb ik 2 boterhammen met pindakaas gegeten en een glas halfvolle melk.',
    [
      { name: 'bread', quantity: 2, unit: 'slices', calories: 164, protein: 6.4, carbs: 28.8, fat: 2.2, fiber: 4, sugar: 3.2, sodium: 290 },
      { name: 'peanut butter', quantity: 30, unit: 'gram', calories: 178, protein: 7.6, carbs: 6.4, fat: 15, fiber: 2.4, sugar: 2.8, sodium: 144 },
      { name: 'semi-skimmed milk', quantity: 250, unit: 'ml', calories: 115, protein: 8.5, carbs: 12.3, fat: 3.8, fiber: 0, sugar: 12.3, sodium: 110 },
    ],
  ),
  buildMeal(userId, 0, 'lunch', 'Voor lunch had ik een kipsandwich en een appel.', [
    { name: 'chicken sandwich', quantity: 1, unit: 'serving', calories: 365, protein: 30, carbs: 33, fat: 11, fiber: 4, sugar: 5, sodium: 620 },
    { name: 'apple', quantity: 1, unit: 'piece', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19, sodium: 2 },
  ]),
  buildMeal(userId, 0, 'dinner', 'Als avondeten at ik zalm met rijst en groenten.', [
    { name: 'salmon', quantity: 180, unit: 'gram', calories: 374.4, protein: 36, carbs: 0, fat: 23.4, fiber: 0, sugar: 0, sodium: 106.2 },
    { name: 'rice', quantity: 180, unit: 'gram', calories: 234, protein: 4.9, carbs: 50.4, fat: 0.5, fiber: 0.7, sugar: 0.2, sodium: 1.8 },
    { name: 'vegetables', quantity: 160, unit: 'gram', calories: 88, protein: 4.5, carbs: 14.4, fat: 0.8, fiber: 5.8, sugar: 6.7, sodium: 72 },
  ]),
  buildMeal(userId, 0, 'snack', 'Ik had een proteineyoghurt als snack.', [
    { name: 'protein yogurt', quantity: 200, unit: 'gram', calories: 148, protein: 20, carbs: 9, fat: 2.5, fiber: 0, sugar: 8, sodium: 82 },
  ]),
  buildMeal(userId, 1, 'breakfast', 'Als ontbijt had ik havermout met banaan en melk.', [
    { name: 'oats', quantity: 60, unit: 'gram', calories: 232.8, protein: 8.2, carbs: 39.6, fat: 4.3, fiber: 6.4, sugar: 0.8, sodium: 3.6 },
    { name: 'banana', quantity: 1, unit: 'piece', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14, sodium: 1 },
    { name: 'semi-skimmed milk', quantity: 200, unit: 'ml', calories: 92, protein: 6.8, carbs: 9.8, fat: 3, fiber: 0, sugar: 9.8, sodium: 88 },
  ]),
  buildMeal(userId, 2, 'dinner', 'Als avondeten at ik kip-pasta met olijfolie en groenten.', [
    { name: 'pasta', quantity: 200, unit: 'gram', calories: 314, protein: 11.6, carbs: 61.8, fat: 1.8, fiber: 3.6, sugar: 1.2, sodium: 4 },
    { name: 'vegetables', quantity: 150, unit: 'gram', calories: 82.5, protein: 4.2, carbs: 13.5, fat: 0.8, fiber: 5.4, sugar: 6.3, sodium: 67.5 },
    { name: 'olive oil', quantity: 15, unit: 'ml', calories: 132, protein: 0, carbs: 0, fat: 15, fiber: 0, sugar: 0, sodium: 0 },
  ]),
];
