import { isSupabaseConfigured } from '@/lib/supabase';
import { mockNutritionDatabase } from '@/constants/mockNutritionDatabase';
import type { AnalyzedMealItem, ParsedMealItem } from '@/types/meal';
import type { NutritionReference } from '@/types/nutrition';

const withDelay = async <T>(value: T, delay = 650) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), delay);
  });

const round = (value: number) => Math.round(value * 10) / 10;

const countUnits = new Set(['piece', 'slice', 'serving']);

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

const normalizeName = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const nameAliases: Record<string, string> = {
  brood: 'bread',
  boterham: 'bread',
  boterhammen: 'bread',
  peanutbutter: 'peanut butter',
  pindakaas: 'peanut butter',
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

const genericReferenceForUnit = (unit: string): NutritionReference => {
  if (unit === 'ml') {
    return {
      name: 'Generic drink',
      baseQuantity: 100,
      baseUnit: 'ml',
      calories: 45,
      protein: 1,
      carbs: 8,
      fat: 1,
      fiber: 0,
      sugar: 6,
      sodium: 40,
    };
  }

  if (unit === 'gram') {
    return {
      name: 'Generic food',
      baseQuantity: 100,
      baseUnit: 'gram',
      calories: 180,
      protein: 8,
      carbs: 16,
      fat: 8,
      fiber: 2,
      sugar: 2,
      sodium: 180,
    };
  }

  return {
    name: 'Generic serving',
    baseQuantity: 1,
    baseUnit: 'serving',
    calories: 140,
    protein: 5,
    carbs: 14,
    fat: 6,
    fiber: 1.5,
    sugar: 4,
    sodium: 180,
  };
};

const resolveReference = (name: string, unit: string) => {
  const normalizedName = normalizeName(name);
  const normalizedUnit = normalizeUnit(unit);

  const directReference = mockNutritionDatabase[normalizedName];
  if (directReference) {
    return { reference: directReference, normalizedUnit };
  }

  const aliasReferenceKey = nameAliases[normalizedName];
  if (aliasReferenceKey && mockNutritionDatabase[aliasReferenceKey]) {
    return { reference: mockNutritionDatabase[aliasReferenceKey], normalizedUnit };
  }

  const partialAliasKey = Object.entries(nameAliases).find(([alias]) => normalizedName.includes(alias))?.[1];
  if (partialAliasKey && mockNutritionDatabase[partialAliasKey]) {
    return { reference: mockNutritionDatabase[partialAliasKey], normalizedUnit };
  }

  const partialReferenceKey = Object.keys(mockNutritionDatabase).find((key) => normalizedName.includes(key) || key.includes(normalizedName));
  if (partialReferenceKey) {
    return { reference: mockNutritionDatabase[partialReferenceKey], normalizedUnit };
  }

  return { reference: genericReferenceForUnit(normalizedUnit), normalizedUnit };
};

const getMultiplier = (quantity: number, unit: string, reference: NutritionReference) => {
  const normalizedUnit = normalizeUnit(unit);
  const normalizedReferenceUnit = normalizeUnit(reference.baseUnit);

  if (normalizedUnit === normalizedReferenceUnit) {
    return quantity / reference.baseQuantity;
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

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

export const getNutritionForItemsMock = async (items: ParsedMealItem[]): Promise<AnalyzedMealItem[]> => {
  const enriched = items.map((item) => {
    const { reference, normalizedUnit } = resolveReference(item.name, item.unit);
    const multiplier = getMultiplier(item.quantity, normalizedUnit, reference);

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
    };
  });

  return withDelay(enriched, 520);
};

const getNutritionFromRemoteProviders = async (items: ParsedMealItem[]): Promise<AnalyzedMealItem[]> => {
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

  const mockFallback = await getNutritionForItemsMock(items);

  return data.items.map((item, index) =>
    item.matched
      ? {
          ...items[index],
          ...item,
          calories: round(item.calories),
          protein: round(item.protein),
          carbs: round(item.carbs),
          fat: round(item.fat),
          fiber: round(item.fiber),
          sugar: round(item.sugar),
          sodium: round(item.sodium),
        }
      : mockFallback[index],
  );
};

export const nutritionService = {
  async getNutritionForItems(items: ParsedMealItem[]) {
    if (!isSupabaseConfigured) {
      return getNutritionForItemsMock(items);
    }

    try {
      return await getNutritionFromRemoteProviders(items);
    } catch (error) {
      console.warn('Falling back to local nutrition matcher:', error);
      return getNutritionForItemsMock(items);
    }
  },
};
