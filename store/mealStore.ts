import { create } from 'zustand';

import { aiService } from '@/services/ai/aiService';
import { mealService } from '@/services/meals/mealService';
import type { AnalyzedMeal, MealWithItems } from '@/types/meal';

type MealState = {
  meals: MealWithItems[];
  isLoading: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;
  error: string | null;
  draftText: string;
  draftAnalysis: AnalyzedMeal | null;
  lastSavedMealId: string | null;
  clearError: () => void;
  loadMeals: (userId: string) => Promise<MealWithItems[]>;
  setDraftText: (text: string) => void;
  analyzeDraft: () => Promise<AnalyzedMeal>;
  clearDraft: () => void;
  saveDraft: (userId: string) => Promise<MealWithItems>;
  deleteMeal: (userId: string, mealId: string) => Promise<void>;
  updateMeal: (meal: MealWithItems) => Promise<MealWithItems>;
};

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  isLoading: false,
  isAnalyzing: false,
  isSaving: false,
  error: null,
  draftText: '',
  draftAnalysis: null,
  lastSavedMealId: null,
  async loadMeals(userId) {
    set({ isLoading: true, error: null });
    try {
      const meals = await mealService.listMeals(userId);
      set({ meals, isLoading: false });
      return meals;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load meals';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  setDraftText(text) {
    set({ draftText: text, draftAnalysis: null, error: null });
  },
  async analyzeDraft() {
    const text = get().draftText.trim();
    if (!text) {
      throw new Error('Enter a meal description before analyzing');
    }

    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await aiService.analyzeText(text);
      set({ draftAnalysis: analysis, isAnalyzing: false });
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Meal analysis failed';
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },
  clearDraft() {
    set({ draftText: '', draftAnalysis: null, error: null, lastSavedMealId: null });
  },
  clearError() {
    set({ error: null });
  },
  async saveDraft(userId) {
    const { draftText, draftAnalysis, meals } = get();
    if (!draftAnalysis) {
      throw new Error('Analyze a meal before saving');
    }

    set({ isSaving: true, error: null });
    try {
      const meal = await mealService.saveAnalyzedMeal(userId, draftText, draftAnalysis);
      set({
        meals: [meal, ...meals.filter((existing) => existing.id !== meal.id)],
        isSaving: false,
        draftText: '',
        draftAnalysis: null,
        lastSavedMealId: meal.id,
      });
      return meal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Meal save failed';
      set({ isSaving: false, error: message });
      throw error;
    }
  },
  async deleteMeal(userId, mealId) {
    await mealService.deleteMeal(userId, mealId);
    set(({ meals }) => ({
      meals: meals.filter((meal) => meal.id !== mealId),
    }));
  },
  async updateMeal(meal) {
    const updated = await mealService.updateMeal(meal);
    set(({ meals }) => ({
      meals: [updated, ...meals.filter((entry) => entry.id !== meal.id)],
    }));
    return updated;
  },
}));
