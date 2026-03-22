import { isSupabaseConfigured } from '@/lib/supabase';
import { mockNutritionDatabase } from '@/constants/mockNutritionDatabase';
import type { AnalyzedMealItem, ParsedMealItem } from '@/types/meal';
import type { NutritionReference } from '@/types/nutrition';
import { emptyOptionalNutrients } from '@/utils/nutrition';
import { nutritionReferenceService } from '@/services/nutrition/nutritionReferenceService';

const withDelay = async <T>(value: T, delay = 650) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), delay);
  });

const round = (value: number) => Math.round(value * 10) / 10;

const countUnits = new Set(['piece', 'slice', 'serving']);
const volumeUnitToMilliliters: Record<string, number> = {
  cup: 240,
  glass: 250,
  mug: 300,
  tbsp: 15,
  tsp: 5,
};

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

const normalizeName = nutritionReferenceService.normalizeName;

const nameAliases: Record<string, string> = {
  brood: 'bread',
  boterham: 'bread',
  boterhammen: 'bread',
  peanutbutter: 'peanut butter',
  pindakaas: 'peanut butter',
  coffee: 'black coffee',
  koffie: 'black coffee',
  'zwarte koffie': 'black coffee',
  'black coffee': 'black coffee',
  tea: 'tea',
  thee: 'tea',
  water: 'water',
  watertje: 'water',
  milk: 'semi-skimmed milk',
  melk: 'semi-skimmed milk',
  'halfvolle melk': 'semi-skimmed milk',
  'semi skimmed milk': 'semi-skimmed milk',
  'chicken sandwich': 'chicken sandwich',
  kipsandwich: 'chicken sandwich',
  'kip sandwich': 'chicken sandwich',
  appel: 'apple',
  banaan: 'banana',
  rijst: 'rice',
  zalm: 'salmon',
  groenten: 'vegetables',
  groente: 'vegetables',
  proteineyoghurt: 'protein yogurt',
  'proteine yoghurt': 'protein yogurt',
  eiwityoghurt: 'protein yogurt',
  havermout: 'oats',
  ei: 'egg',
  eieren: 'egg',
  olijfolie: 'olive oil',
  leverworst: 'liverwurst',
  leverpastei: 'liverwurst',
  'liver sausage': 'liverwurst',
  stroopwafels: 'stroopwafel',
  'syrup waffle': 'stroopwafel',
};

const toMilliliters = (quantity: number, unit: string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === 'ml') {
    return quantity;
  }

  if (volumeUnitToMilliliters[normalizedUnit]) {
    return quantity * volumeUnitToMilliliters[normalizedUnit];
  }

  return null;
};

const resolveReference = (name: string, unit: string, learnedReferences?: Map<string, NutritionReference>) => {
  const normalizedName = normalizeName(name);
  const normalizedUnit = normalizeUnit(unit);

  const learnedReference = learnedReferences?.get(normalizedName);
  if (learnedReference) {
    return { reference: learnedReference, normalizedUnit };
  }

  const directReference = mockNutritionDatabase[normalizedName];
  if (directReference) {
    return { reference: directReference, normalizedUnit };
  }

  const aliasReferenceKey = nameAliases[normalizedName];
  if (aliasReferenceKey && mockNutritionDatabase[aliasReferenceKey]) {
    return { reference: mockNutritionDatabase[aliasReferenceKey], normalizedUnit };
  }

  return { reference: null, normalizedUnit };
};

const getMultiplier = (item: ParsedMealItem, unit: string, reference: NutritionReference) => {
  const quantity = item.quantity;
  const normalizedUnit = normalizeUnit(unit);
  const normalizedReferenceUnit = normalizeUnit(reference.baseUnit);

  if (normalizedUnit === normalizedReferenceUnit) {
    return quantity / reference.baseQuantity;
  }

  const currentVolume = toMilliliters(quantity, normalizedUnit);
  const referenceVolume = toMilliliters(reference.baseQuantity, normalizedReferenceUnit);
  if (currentVolume !== null && referenceVolume !== null && referenceVolume > 0) {
    return currentVolume / referenceVolume;
  }

  if (countUnits.has(normalizedUnit) && countUnits.has(normalizedReferenceUnit)) {
    return quantity / reference.baseQuantity;
  }

  return 1;
};

type RemoteNutritionLookupItem = AnalyzedMealItem & {
  matched?: boolean;
  source?: string | null;
};

const createUnresolvedItem = (item: ParsedMealItem, normalizedUnit: string): AnalyzedMealItem => ({
  ...item,
  unit: normalizedUnit,
  ...emptyOptionalNutrients(),
  nutritionSource: 'unresolved',
});

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

export const getNutritionForItemsMock = async (
  items: ParsedMealItem[],
  learnedReferences?: Map<string, NutritionReference>,
): Promise<AnalyzedMealItem[]> => {
  const enriched: AnalyzedMealItem[] = items.map((item) => {
    const { reference, normalizedUnit } = resolveReference(item.name, item.unit, learnedReferences);
    if (!reference) {
      return createUnresolvedItem(item, normalizedUnit);
    }

    const multiplier = getMultiplier(item, normalizedUnit, reference);

    return {
      ...item,
      unit: normalizedUnit,
      calories: round(reference.calories * multiplier),
      protein: round(reference.protein * multiplier),
      carbs: round(reference.carbs * multiplier),
      fat: round(reference.fat * multiplier),
      fiber: round(reference.fiber * multiplier),
      sugar: round(reference.sugar * multiplier),
      sodium: round(reference.sodium * multiplier),
      nutritionSource: 'matched' as const,
    };
  });

  return withDelay(enriched, 520);
};

const getNutritionFromRemoteProviders = async (
  items: ParsedMealItem[],
  learnedReferences?: Map<string, NutritionReference>,
): Promise<AnalyzedMealItem[]> => {
  const response = await fetch(getFunctionUrl('lookup-nutrition'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    let detail = 'Het verzoek naar de nutrition service is mislukt.';
    try {
      const body = await response.json();
      detail = body.detail ?? body.message ?? body.error ?? detail;
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        detail = fallbackText;
      }
    }

    throw new Error(`Nutrition lookup mislukt (${response.status} ${response.statusText}). ${detail}`);
  }

  const data = (await response.json()) as { items?: RemoteNutritionLookupItem[] };

  if (!data.items?.length) {
    throw new Error('De nutrition service gaf geen items terug.');
  }

  const mockFallback = await getNutritionForItemsMock(items, learnedReferences);

  return data.items.map((item, index) =>
    item.matched
      ? {
          ...items[index],
          ...item,
          calories: round(item.calories ?? 0),
          protein: round(item.protein ?? 0),
          carbs: round(item.carbs ?? 0),
          fat: round(item.fat ?? 0),
          fiber: round(item.fiber ?? 0),
          sugar: round(item.sugar ?? 0),
          sodium: round(item.sodium ?? 0),
          nutritionSource: 'matched' as const,
        }
      : mockFallback[index],
  );
};

export const nutritionService = {
  async getNutritionForItems(items: ParsedMealItem[], userId?: string | null) {
    const learnedReferences = await nutritionReferenceService.getReferenceMap(userId);

    if (!isSupabaseConfigured) {
      return getNutritionForItemsMock(items, learnedReferences);
    }

    try {
      return await getNutritionFromRemoteProviders(items, learnedReferences);
    } catch (error) {
      console.warn('Falling back to local nutrition matcher:', error);
      return getNutritionForItemsMock(items, learnedReferences);
    }
  },
};
