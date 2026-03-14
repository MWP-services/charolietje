import { mealRepository } from '@/repositories/mealRepository';
import type { AnalyzedMeal, MealWithItems } from '@/types/meal';
import { createId, createUuid } from '@/utils/id';
import { toMealTotalsRecord } from '@/utils/nutrition';
import { isSupabaseConfigured } from '@/lib/supabase';

export const mealService = {
  listMeals: mealRepository.listMeals,
  getMeal: mealRepository.getMeal,
  deleteMeal: mealRepository.deleteMeal,
  async saveAnalyzedMeal(userId: string, transcriptionText: string, analysis: AnalyzedMeal) {
    const now = new Date().toISOString();
    const mealId = isSupabaseConfigured ? createUuid() : createId('meal');
    const items = analysis.items.map((item) => ({
      ...item,
      id: isSupabaseConfigured ? createUuid() : createId('item'),
      meal_id: mealId,
    }));

    const meal: MealWithItems = {
      id: mealId,
      user_id: userId,
      date: now.slice(0, 10),
      meal_type: analysis.mealType,
      original_text: analysis.originalText,
      transcription_text: transcriptionText,
      created_at: now,
      updated_at: now,
      items,
      ...toMealTotalsRecord(analysis.totals),
    };

    return mealRepository.saveMeal(meal);
  },
  async updateMeal(meal: MealWithItems) {
    return mealRepository.saveMeal({
      ...meal,
      updated_at: new Date().toISOString(),
    });
  },
};
