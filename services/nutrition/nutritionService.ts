import { isSupabaseConfigured } from '@/lib/supabase';
import type { AnalyzedMealItem, ParsedMealItem } from '@/types/meal';

const round = (value: number) => Math.round(value * 10) / 10;
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
    case 'bowl':
    case 'bowls':
    case 'kom':
    case 'kommen':
    case 'bak':
    case 'bakje':
    case 'bakjes':
      return 'bowl';
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
    case 'reep':
    case 'repen':
    case 'bar':
    case 'bars':
      return 'piece';
    case 'slice':
    case 'slices':
    case 'sneetje':
    case 'sneetjes':
      return 'slice';
    case 'hand':
    case 'handful':
    case 'handfuls':
    case 'handje':
    case 'handjes':
      return 'handful';
    case 'scoop':
    case 'scoops':
    case 'schep':
    case 'scheppen':
      return 'scoop';
    case 'can':
    case 'cans':
    case 'blik':
    case 'blikken':
      return 'can';
    case 'bottle':
    case 'bottles':
    case 'fles':
    case 'flessen':
      return 'bottle';
    case 'pot':
    case 'pots':
      return 'pot';
    case 'pack':
    case 'packs':
    case 'pak':
    case 'pakken':
    case 'pakket':
    case 'pakketjes':
      return 'pack';
    case 'serving':
    case 'servings':
    case 'portie':
    case 'porties':
      return 'serving';
    default:
      return normalized;
  }
};

type RemoteNutritionEstimate = AnalyzedMealItem & {
  matched?: boolean;
  source?: string | null;
};

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

const toAnalyzedItem = (input: ParsedMealItem, estimate: RemoteNutritionEstimate): AnalyzedMealItem => ({
  ...input,
  unit: estimate.unit ? normalizeUnit(estimate.unit) : normalizeUnit(input.unit),
  calories: round(estimate.calories ?? 0),
  protein: round(estimate.protein ?? 0),
  carbs: round(estimate.carbs ?? 0),
  fat: round(estimate.fat ?? 0),
  fiber: round(estimate.fiber ?? 0),
  sugar: round(estimate.sugar ?? 0),
  sodium: round(estimate.sodium ?? 0),
  nutritionSource: 'estimated',
});

const estimateNutritionWithAi = async (items: ParsedMealItem[]): Promise<AnalyzedMealItem[]> => {
  const response = await fetch(getFunctionUrl('lookup-nutrition'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    let detail = 'Het verzoek naar de AI-voedingsschatter is mislukt.';
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? body.error ?? detail;
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        detail = fallbackText;
      }
    }

    throw new Error(`AI-voedingsschatting mislukt (${response.status} ${response.statusText}). ${detail}`);
  }

  const data = (await response.json()) as { items?: RemoteNutritionEstimate[] };
  if (!data.items?.length) {
    throw new Error('De AI-voedingsschatter gaf geen items terug.');
  }

  if (data.items.length !== items.length) {
    throw new Error('De AI-voedingsschatter gaf een onverwacht aantal items terug.');
  }

  return items.map((item, index) => toAnalyzedItem(item, data.items![index]));
};

export const nutritionService = {
  async getNutritionForItems(items: ParsedMealItem[], _userId?: string | null) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is niet ingesteld, dus AI-voedingsschattingen zijn niet beschikbaar.');
    }

    return estimateNutritionWithAi(items);
  },
};
