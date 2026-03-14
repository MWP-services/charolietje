import type { AnalyzedMeal, MealType, ParsedMeal, ParsedMealItem } from '@/types/meal';
import { isSupabaseConfigured } from '@/lib/supabase';
import { calculateMealTotals } from '@/utils/nutrition';

import { parseMealTextWithOpenAI } from '@/services/ai/mealParsingService';
import { getNutritionForItemsMock } from '@/services/nutrition/nutritionService';
import { transcribeAudioWithOpenAI } from '@/services/ai/transcriptionService';

const sampleTranscriptions = [
  'Als ontbijt heb ik 2 boterhammen met pindakaas gegeten en een glas halfvolle melk.',
  'Voor lunch at ik een chicken sandwich en een appel.',
  'Vanavond heb ik rijst met zalm en groenten gegeten.',
];

const detectMealType = (text: string): MealType => {
  const normalized = text.toLowerCase();
  if (/(ontbijt|breakfast|ochtend)/.test(normalized)) return 'breakfast';
  if (/(lunch|middag)/.test(normalized)) return 'lunch';
  if (/(diner|avond|dinner)/.test(normalized)) return 'dinner';
  if (/(snack|tussendoor|yogurt|yoghurt)/.test(normalized)) return 'snack';
  return 'unknown';
};

const extractQuantity = (text: string, expression: RegExp, fallback: number) => {
  const match = text.match(expression);
  return match ? Number(match[1]) : fallback;
};

const parseKnownItems = (text: string): ParsedMealItem[] => {
  const normalized = text.toLowerCase();
  const items: ParsedMealItem[] = [];

  if (/(boterham|boterhammen|bread)/.test(normalized)) {
    items.push({
      name: 'bread',
      quantity: extractQuantity(normalized, /(\d+)\s*(boterham|boterhammen|slice|slices)/, 2),
      unit: 'slices',
      confidence: 0.92,
    });
  }

  if (/(pindakaas|peanut butter)/.test(normalized)) {
    items.push({
      name: 'peanut butter',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(pindakaas|peanut butter)/, 30),
      unit: 'gram',
      confidence: 0.88,
    });
  }

  if (/(halfvolle melk|melk|milk)/.test(normalized)) {
    items.push({
      name: 'semi-skimmed milk',
      quantity: /(glas|glass)/.test(normalized)
        ? 250
        : extractQuantity(normalized, /(\d+)\s*(ml)\s*(melk|milk)/, 200),
      unit: 'ml',
      confidence: 0.9,
    });
  }

  if (/(chicken sandwich|kip sandwich|sandwich met kip|broodje kip)/.test(normalized)) {
    items.push({
      name: 'chicken sandwich',
      quantity: 1,
      unit: 'serving',
      confidence: 0.86,
    });
  }

  if (/(appel|apple)/.test(normalized)) {
    items.push({
      name: 'apple',
      quantity: extractQuantity(normalized, /(\d+)\s*(appel|apple)/, 1),
      unit: 'piece',
      confidence: 0.95,
    });
  }

  if (/(banaan|banana)/.test(normalized)) {
    items.push({
      name: 'banana',
      quantity: 1,
      unit: 'piece',
      confidence: 0.95,
    });
  }

  if (/(rijst|rice)/.test(normalized)) {
    items.push({
      name: 'rice',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(rijst|rice)/, 180),
      unit: 'gram',
      confidence: 0.84,
    });
  }

  if (/(zalm|salmon)/.test(normalized)) {
    items.push({
      name: 'salmon',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(zalm|salmon)/, 160),
      unit: 'gram',
      confidence: 0.89,
    });
  }

  if (/(groenten|vegetables|groente)/.test(normalized)) {
    items.push({
      name: 'vegetables',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(groenten|vegetables|groente)/, 150),
      unit: 'gram',
      confidence: 0.85,
    });
  }

  if (/(protein yogurt|proteine yoghurt|eiwit yoghurt|protein yoghurt)/.test(normalized)) {
    items.push({
      name: 'protein yogurt',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(protein|proteine)/, 200),
      unit: 'gram',
      confidence: 0.87,
    });
  }

  if (/(havermout|oats)/.test(normalized)) {
    items.push({
      name: 'oats',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(havermout|oats)/, 60),
      unit: 'gram',
      confidence: 0.85,
    });
  }

  if (/(ei|egg)/.test(normalized)) {
    items.push({
      name: 'egg',
      quantity: extractQuantity(normalized, /(\d+)\s*(ei|egg)/, 2),
      unit: 'piece',
      confidence: 0.85,
    });
  }

  if (/(avocado)/.test(normalized)) {
    items.push({
      name: 'avocado',
      quantity: 50,
      unit: 'gram',
      confidence: 0.82,
    });
  }

  return items;
};

export const transcribeAudioMock = async (_audioUri: string) => {
  const sentence = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
  return new Promise<string>((resolve) => {
    setTimeout(() => resolve(sentence), 1500);
  });
};

export const parseMealTextMock = async (text: string): Promise<ParsedMeal> => {
  const items = parseKnownItems(text);
  const fallbackItems =
    items.length > 0
      ? items
      : [
          {
            name: 'bread',
            quantity: 2,
            unit: 'slices',
            confidence: 0.38,
          },
        ];

  return new Promise<ParsedMeal>((resolve) => {
    setTimeout(
      () =>
        resolve({
          mealType: detectMealType(text),
          items: fallbackItems,
          originalText: text,
        }),
      900,
    );
  });
};

// TODO: Plug in OpenAI transcription and parsing endpoints here.
export const aiService = {
  async transcribeAudio(audioUri: string) {
    if (!isSupabaseConfigured) {
      return transcribeAudioMock(audioUri);
    }

    return transcribeAudioWithOpenAI(audioUri);
  },
  async parseMealText(text: string) {
    if (!isSupabaseConfigured) {
      return parseMealTextMock(text);
    }

    return parseMealTextWithOpenAI(text);
  },
  async analyzeText(text: string): Promise<AnalyzedMeal> {
    const parsed = await this.parseMealText(text);
    const items = await getNutritionForItemsMock(parsed.items);
    return {
      mealType: parsed.mealType,
      originalText: text,
      items,
      totals: calculateMealTotals(items),
    };
  },
};
