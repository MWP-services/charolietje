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
  bowl: 350,
  tbsp: 15,
  tsp: 5,
  bottle: 500,
  can: 330,
  pot: 150,
};
const weightUnitToGrams: Record<string, number> = {
  handful: 30,
  scoop: 30,
  pack: 100,
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
    case 'bowl':
    case 'bowls':
    case 'kom':
    case 'kommen':
    case 'bak':
    case 'bakje':
    case 'bakjes':
      return 'bowl';
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
    case 'pakket':
    case 'pakketjes':
    case 'pak':
    case 'pakken':
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

const normalizeName = nutritionReferenceService.normalizeName;
const normalizeSearchAliases = (aliases?: string[]) =>
  (aliases ?? []).map((alias) => normalizeName(alias)).filter((alias, index, all) => alias.length >= 3 && all.indexOf(alias) === index);

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
  cappuccino: 'coffee with milk',
  latte: 'coffee with milk',
  'koffie verkeerd': 'coffee with milk',
  tea: 'tea',
  thee: 'tea',
  water: 'water',
  watertje: 'water',
  sinaasappelsap: 'orange juice',
  jus: 'orange juice',
  cola: 'cola',
  coca: 'cola',
  frisdrank: 'cola',
  'cola zero': 'cola zero',
  'cola light': 'cola zero',
  'coca cola zero': 'cola zero',
  chocomel: 'chocolate milk',
  chocolademelk: 'chocolate milk',
  milk: 'semi-skimmed milk',
  melk: 'semi-skimmed milk',
  'halfvolle melk': 'semi-skimmed milk',
  'magere melk': 'skim milk',
  'semi skimmed milk': 'semi-skimmed milk',
  yoghurt: 'yogurt',
  yogurt: 'yogurt',
  kwark: 'quark',
  'magere kwark': 'quark',
  'griekse yoghurt': 'greek yogurt',
  'griekse yogurt': 'greek yogurt',
  huttenkaas: 'cottage cheese',
  huttenkase: 'cottage cheese',
  'hüttenkäse': 'cottage cheese',
  kaas: 'cheese',
  kip: 'chicken breast',
  kipfilet: 'chicken breast',
  kipborst: 'chicken breast',
  kalkoen: 'turkey slices',
  kalkoenfilet: 'turkey slices',
  ham: 'ham',
  tonijn: 'tuna',
  gehakt: 'beef mince',
  rundergehakt: 'beef mince',
  'chicken sandwich': 'chicken sandwich',
  kipsandwich: 'chicken sandwich',
  'kip sandwich': 'chicken sandwich',
  wrap: 'wrap',
  wraps: 'wrap',
  tortilla: 'wrap',
  tortillawrap: 'wrap',
  appel: 'apple',
  banaan: 'banana',
  sinaasappel: 'orange',
  blauwebessen: 'blueberries',
  aardbeien: 'strawberries',
  rijst: 'rice',
  zilvervliesrijst: 'brown rice',
  zalm: 'salmon',
  groenten: 'vegetables',
  groente: 'vegetables',
  aardappel: 'potatoes',
  aardappelen: 'potatoes',
  'zoete aardappel': 'sweet potato',
  broccoli: 'broccoli',
  spinazie: 'spinach',
  komkommer: 'cucumber',
  tomaat: 'tomato',
  tomaten: 'tomato',
  sla: 'lettuce',
  ui: 'onion',
  uien: 'onion',
  wortel: 'carrot',
  wortelen: 'carrot',
  paprika: 'bell pepper',
  bonen: 'beans',
  kidneybonen: 'beans',
  linzen: 'lentils',
  kikkererwten: 'chickpeas',
  proteineyoghurt: 'protein yogurt',
  'proteine yoghurt': 'protein yogurt',
  eiwityoghurt: 'protein yogurt',
  havermout: 'oats',
  muesli: 'muesli',
  granola: 'granola',
  whey: 'whey protein',
  eiwitshake: 'whey protein',
  proteineshake: 'whey protein',
  proteinepoeder: 'whey protein',
  ei: 'egg',
  eieren: 'egg',
  amandelen: 'almonds',
  walnoten: 'walnuts',
  cashewnoten: 'cashews',
  rijstwafels: 'rice cakes',
  rijstwafel: 'rice cakes',
  crackers: 'crackers',
  cracker: 'crackers',
  olijfolie: 'olive oil',
  'extra oil': 'olive oil',
  'extra butter': 'butter',
  'extra sauce': 'pasta sauce',
  'extra dressing': 'dressing',
  'extra cheese': 'cheese',
  pastasaus: 'pasta sauce',
  tomatensaus: 'pasta sauce',
  pesto: 'pesto',
  boter: 'butter',
  butter: 'butter',
  dressing: 'dressing',
  leverworst: 'liverwurst',
  leverpastei: 'liverwurst',
  'liver sausage': 'liverwurst',
  stroopwafels: 'stroopwafel',
  'syrup waffle': 'stroopwafel',
  eiwitreep: 'protein bar',
  proteinebar: 'protein bar',
};

const getPartialReferenceKey = (normalizedName: string, source: Record<string, NutritionReference>) => {
  const candidates = Object.keys(source)
    .filter((key) => {
      if (key.length < 4 || normalizedName === key) {
        return false;
      }

      const keyTokens = key.split(' ');
      const matchedTokens = keyTokens.filter((token) => normalizedName.includes(token)).length;
      return normalizedName.includes(key) || key.includes(normalizedName) || matchedTokens === keyTokens.length;
    })
    .sort((left, right) => right.length - left.length);

  return candidates[0] ?? null;
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

const resolveReference = (item: ParsedMealItem, learnedReferences?: Map<string, NutritionReference>) => {
  const normalizedName = normalizeName(item.name);
  const normalizedAliases = normalizeSearchAliases(item.searchAliases);
  const candidateNames = [normalizedName, ...normalizedAliases];
  const normalizedUnit = normalizeUnit(item.unit);

  const learnedEntries = learnedReferences ? Object.fromEntries(learnedReferences.entries()) : null;

  for (const candidateName of candidateNames) {
    const learnedReference = learnedReferences?.get(candidateName);
    if (learnedReference) {
      return { reference: learnedReference, normalizedUnit };
    }

    const partialLearnedKey = learnedEntries ? getPartialReferenceKey(candidateName, learnedEntries) : null;
    if (partialLearnedKey && learnedReferences?.get(partialLearnedKey)) {
      return { reference: learnedReferences.get(partialLearnedKey)!, normalizedUnit };
    }

    const directReference = mockNutritionDatabase[candidateName];
    if (directReference) {
      return { reference: directReference, normalizedUnit };
    }

    const aliasReferenceKey = nameAliases[candidateName];
    if (aliasReferenceKey && mockNutritionDatabase[aliasReferenceKey]) {
      return { reference: mockNutritionDatabase[aliasReferenceKey], normalizedUnit };
    }

    const partialAliasKey = Object.entries(nameAliases).find(([alias]) => candidateName.includes(alias))?.[1];
    if (partialAliasKey && mockNutritionDatabase[partialAliasKey]) {
      return { reference: mockNutritionDatabase[partialAliasKey], normalizedUnit };
    }

    const partialReferenceKey = getPartialReferenceKey(candidateName, mockNutritionDatabase);
    if (partialReferenceKey) {
      return { reference: mockNutritionDatabase[partialReferenceKey], normalizedUnit };
    }
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

  const currentWeight = weightUnitToGrams[normalizedUnit];
  const referenceWeight = normalizedReferenceUnit === 'gram' ? reference.baseQuantity : weightUnitToGrams[normalizedReferenceUnit];
  if (currentWeight && referenceWeight) {
    return (quantity * currentWeight) / referenceWeight;
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

const mapRemoteNutritionSource = (source?: string | null) => (source === 'ai_estimate' ? 'estimated' : 'matched');

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
    const { reference, normalizedUnit } = resolveReference(item, learnedReferences);
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
          unit: item.unit ? normalizeUnit(item.unit) : items[index].unit,
          calories: round(item.calories ?? 0),
          protein: round(item.protein ?? 0),
          carbs: round(item.carbs ?? 0),
          fat: round(item.fat ?? 0),
          fiber: round(item.fiber ?? 0),
          sugar: round(item.sugar ?? 0),
          sodium: round(item.sodium ?? 0),
          nutritionSource: mapRemoteNutritionSource(item.source),
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
