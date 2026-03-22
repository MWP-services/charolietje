import { createId, createUuid } from '@/utils/id';
import { isSupabaseConfigured } from '@/lib/supabase';
import { nutritionReferenceRepository } from '@/repositories/nutritionReferenceRepository';
import type { AnalyzedMealItem, MealItem } from '@/types/meal';
import type { NutritionReference, NutritionReferenceRecord } from '@/types/nutrition';
import { hasCompleteNutrition } from '@/utils/nutrition';

const normalizeName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

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
      return 'piece';
    case 'slice':
    case 'slices':
    case 'sneetje':
    case 'sneetjes':
      return 'slice';
    case 'serving':
    case 'servings':
    case 'portie':
    case 'porties':
      return 'serving';
    default:
      return normalized;
  }
};

const toReferenceRecord = (userId: string, item: AnalyzedMealItem | MealItem): NutritionReferenceRecord | null => {
  if (!item.name.trim() || !hasCompleteNutrition(item)) {
    return null;
  }

  const now = new Date().toISOString();
  const normalizedName = normalizeName(item.name);
  const normalizedUnit = normalizeUnit(item.unit);
  const baseQuantity = item.quantity > 0 ? item.quantity : 1;

  return {
    id: isSupabaseConfigured ? createUuid() : createId('nutrition-ref'),
    user_id: userId,
    name: item.name.trim(),
    normalized_name: normalizedName,
    base_quantity: baseQuantity,
    base_unit: normalizedUnit,
    calories: item.calories ?? 0,
    protein: item.protein ?? 0,
    carbs: item.carbs ?? 0,
    fat: item.fat ?? 0,
    fiber: item.fiber ?? 0,
    sugar: item.sugar ?? 0,
    sodium: item.sodium ?? 0,
    created_at: now,
    updated_at: now,
  };
};

export const nutritionReferenceService = {
  normalizeName,
  normalizeUnit,

  async getReferenceMap(userId?: string | null) {
    if (!userId) {
      return new Map<string, NutritionReference>();
    }

    const references = await nutritionReferenceRepository.listReferences(userId);
    return new Map<string, NutritionReference>(
      references.map((reference) => [
        reference.normalized_name,
        {
          name: reference.name,
          baseQuantity: reference.base_quantity,
          baseUnit: reference.base_unit,
          calories: reference.calories,
          protein: reference.protein,
          carbs: reference.carbs,
          fat: reference.fat,
          fiber: reference.fiber,
          sugar: reference.sugar,
          sodium: reference.sodium,
        },
      ]),
    );
  },

  async learnReferencesFromItems(userId: string | null | undefined, items: Array<AnalyzedMealItem | MealItem>) {
    if (!userId) {
      return [];
    }

    const references = items
      .map((item) => toReferenceRecord(userId, item))
      .filter((item): item is NutritionReferenceRecord => Boolean(item));

    if (!references.length) {
      return [];
    }

    return nutritionReferenceRepository.upsertReferences(userId, references);
  },

  async clearLocalReferences(userId: string) {
    await nutritionReferenceRepository.clearLocalReferences(userId);
  },
};
