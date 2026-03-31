import { create } from 'zustand';

import { aiService } from '@/services/ai/aiService';
import { mealService } from '@/services/meals/mealService';
import type { AnalyzedMeal, AnalyzedMealItem, MealWithItems } from '@/types/meal';
import { sortMealsByCreatedAt } from '@/utils/date';
import { calculateMealTotals, getMissingNutritionLabels, hasCompleteNutrition } from '@/utils/nutrition';

type MealState = {
  meals: MealWithItems[];
  isLoading: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;
  error: string | null;
  draftText: string;
  draftAnalysis: AnalyzedMeal | null;
  pendingScannedItem: { targetKey: string; item: AnalyzedMealItem } | null;
  lastSavedMealId: string | null;
  clearError: () => void;
  clearMeals: () => void;
  loadMeals: (userId: string) => Promise<MealWithItems[]>;
  setDraftText: (text: string) => void;
  setDraftAnalysis: (analysis: AnalyzedMeal, draftText?: string) => void;
  setPendingScannedItem: (targetKey: string, item: AnalyzedMealItem) => void;
  consumePendingScannedItem: (targetKey: string) => AnalyzedMealItem | null;
  analyzeDraft: (userId?: string | null) => Promise<AnalyzedMeal>;
  updateDraftItem: (index: number, updates: Partial<AnalyzedMealItem>) => void;
  answerDraftClarification: (questionId: string, selectedOptionIds: string[], userId?: string | null) => Promise<AnalyzedMeal>;
  skipDraftClarification: (questionId: string, userId?: string | null) => Promise<AnalyzedMeal>;
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
  pendingScannedItem: null,
  lastSavedMealId: null,
  async loadMeals(userId) {
    set({ isLoading: true, error: null });
    try {
      const meals = await mealService.listMeals(userId);
      set({ meals: sortMealsByCreatedAt(meals), isLoading: false });
      return meals;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Maaltijden laden mislukt';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  setDraftText(text) {
    set({ draftText: text, draftAnalysis: null, pendingScannedItem: null, error: null });
  },
  setDraftAnalysis(analysis, draftText) {
    set({
      draftAnalysis: analysis,
      draftText: draftText ?? analysis.originalText,
      error: null,
    });
  },
  setPendingScannedItem(targetKey, item) {
    set({ pendingScannedItem: { targetKey, item } });
  },
  consumePendingScannedItem(targetKey) {
    const pendingItem = get().pendingScannedItem;
    if (!pendingItem || pendingItem.targetKey !== targetKey) {
      return null;
    }

    set({ pendingScannedItem: null });
    return pendingItem.item;
  },
  async analyzeDraft(userId) {
    const text = get().draftText.trim();
    if (!text) {
      throw new Error('Voer eerst een maaltijdomschrijving in voordat je analyseert');
    }

    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await aiService.analyzeText(text, userId);
      set({ draftAnalysis: analysis, isAnalyzing: false });
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Maaltijdanalyse mislukt';
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },
  updateDraftItem(index, updates) {
    set((state) => {
      if (!state.draftAnalysis) {
        return state;
      }

      const items = state.draftAnalysis.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...updates } : item));
      return {
        draftAnalysis: {
          ...state.draftAnalysis,
          items,
          totals: calculateMealTotals(items),
        },
      };
    });
  },
  async answerDraftClarification(questionId, selectedOptionIds, userId) {
    const draftAnalysis = get().draftAnalysis;
    if (!draftAnalysis) {
      throw new Error('Er is geen actieve maaltijdanalyse om te verduidelijken.');
    }

    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await aiService.applyClarificationAnswer(draftAnalysis, questionId, selectedOptionIds, userId);
      set({ draftAnalysis: analysis, isAnalyzing: false });
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verduidelijking verwerken mislukt';
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },
  async skipDraftClarification(questionId, userId) {
    const draftAnalysis = get().draftAnalysis;
    if (!draftAnalysis) {
      throw new Error('Er is geen actieve maaltijdanalyse om te verduidelijken.');
    }

    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await aiService.skipClarificationQuestion(draftAnalysis, questionId, userId);
      set({ draftAnalysis: analysis, isAnalyzing: false });
      return analysis;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verduidelijking overslaan mislukt';
      set({ isAnalyzing: false, error: message });
      throw error;
    }
  },
  clearDraft() {
    set({ draftText: '', draftAnalysis: null, pendingScannedItem: null, error: null, lastSavedMealId: null });
  },
  clearError() {
    set({ error: null });
  },
  clearMeals() {
    set({
      meals: [],
      isLoading: false,
      isAnalyzing: false,
      isSaving: false,
      error: null,
      draftText: '',
      draftAnalysis: null,
      pendingScannedItem: null,
      lastSavedMealId: null,
    });
  },
  async saveDraft(userId) {
    const { draftText, draftAnalysis, meals } = get();
    if (!draftAnalysis) {
      throw new Error('Analyseer eerst een maaltijd voordat je opslaat');
    }

    const unresolvedItem = draftAnalysis.items.find((item) => !hasCompleteNutrition(item));
    if (unresolvedItem) {
      const missingLabels = getMissingNutritionLabels(unresolvedItem).join(', ');
      throw new Error(`Vul eerst de ontbrekende voedingswaarden in voor ${unresolvedItem.name}. Ontbrekend: ${missingLabels}.`);
    }

    set({ isSaving: true, error: null });
    try {
      const meal = await mealService.saveAnalyzedMeal(userId, draftText, draftAnalysis);
      set({
        meals: sortMealsByCreatedAt([meal, ...meals.filter((existing) => existing.id !== meal.id)]),
        isSaving: false,
        draftText: '',
        draftAnalysis: null,
        pendingScannedItem: null,
        lastSavedMealId: meal.id,
      });
      return meal;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Maaltijd opslaan mislukt';
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
      meals: sortMealsByCreatedAt([updated, ...meals.filter((entry) => entry.id !== meal.id)]),
    }));
    return updated;
  },
}));
