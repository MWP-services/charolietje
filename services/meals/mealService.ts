import { mealRepository } from '@/repositories/mealRepository';
import type { AnalyzedMeal, MealWithItems } from '@/types/meal';
import { createId, createUuid } from '@/utils/id';
import { toMealTotalsRecord } from '@/utils/nutrition';
import { isSupabaseConfigured } from '@/lib/supabase';
import { mealCorrectionService } from '@/services/meals/mealCorrectionService';
import { nutritionReferenceService } from '@/services/nutrition/nutritionReferenceService';

export const mealService = {
  listMeals: mealRepository.listMeals,
  getMeal: mealRepository.getMeal,
  deleteMeal: mealRepository.deleteMeal,
  async saveAnalyzedMeal(userId: string, transcriptionText: string, analysis: AnalyzedMeal) {
    const now = new Date().toISOString();
    const mealId = isSupabaseConfigured ? createUuid() : createId('meal');
    const items = analysis.items.map(({ searchAliases, ...item }) => ({
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

    const savedMeal = await mealRepository.saveMeal(meal);
    await mealCorrectionService.recordCorrectionSignal(userId, savedMeal.id, analysis);
    await nutritionReferenceService.learnReferencesFromItems(userId, items);
    return savedMeal;
  },
  async updateMeal(meal: MealWithItems) {
    const savedMeal = await mealRepository.saveMeal({
      ...meal,
      updated_at: new Date().toISOString(),
    });
    await nutritionReferenceService.learnReferencesFromItems(meal.user_id, meal.items);
    return savedMeal;
  },
};
