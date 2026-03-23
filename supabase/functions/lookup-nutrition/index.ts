const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ParsedMealItem = {
  name: string;
  quantity: number;
  unit: string;
  confidence?: number | null;
};

type NutrientMatch = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  matched: boolean;
  source: 'open_food_facts' | 'usda' | null;
  matchedName?: string | null;
};

type OpenFoodFactsProduct = {
  product_name?: string;
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

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
  gram: 1,
  handful: 30,
  scoop: 30,
  pack: 100,
};

const nameAliases: Record<string, string> = {
  brood: 'bread',
  boterham: 'bread',
  boterhammen: 'bread',
  pindakaas: 'peanut butter',
  peanutbutter: 'peanut butter',
  koffie: 'black coffee',
  'zwarte koffie': 'black coffee',
  cappuccino: 'coffee with milk',
  latte: 'coffee with milk',
  thee: 'tea',
  water: 'water',
  sinaasappelsap: 'orange juice',
  jus: 'orange juice',
  cola: 'cola',
  'cola zero': 'cola zero',
  'cola light': 'cola zero',
  chocomel: 'chocolate milk',
  chocolademelk: 'chocolate milk',
  melk: 'semi-skimmed milk',
  'halfvolle melk': 'semi-skimmed milk',
  'magere melk': 'skim milk',
  yoghurt: 'yogurt',
  'griekse yoghurt': 'greek yogurt',
  kwark: 'quark',
  huttenkaas: 'cottage cheese',
  appel: 'apple',
  banaan: 'banana',
  sinaasappel: 'orange',
  blauwebessen: 'blueberries',
  blauwebessen: 'blueberries',
  aardbeien: 'strawberries',
  rijst: 'rice',
  zilvervliesrijst: 'brown rice',
  aardappel: 'potatoes',
  aardappelen: 'potatoes',
  'zoete aardappel': 'sweet potato',
  kip: 'chicken breast',
  kipfilet: 'chicken breast',
  kalkoen: 'turkey slices',
  ham: 'ham',
  tonijn: 'tuna',
  gehakt: 'beef mince',
  rundergehakt: 'beef mince',
  zalm: 'salmon',
  groenten: 'mixed vegetables',
  groente: 'mixed vegetables',
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
  linzen: 'lentils',
  kikkererwten: 'chickpeas',
  'protein yoghurt': 'protein yogurt',
  proteineyoghurt: 'protein yogurt',
  havermout: 'oats',
  muesli: 'muesli',
  granola: 'granola',
  whey: 'whey protein',
  eiwitshake: 'whey protein',
  proteineshake: 'whey protein',
  ei: 'egg',
  eieren: 'egg',
  amandelen: 'almonds',
  walnoten: 'walnuts',
  cashewnoten: 'cashews',
  rijstwafel: 'rice cakes',
  rijstwafels: 'rice cakes',
  cracker: 'crackers',
  crackers: 'crackers',
  wrap: 'wrap',
  kaas: 'cheese',
  pastasaus: 'pasta sauce',
  tomatensaus: 'pasta sauce',
  eiwitreep: 'protein bar',
  proteinebar: 'protein bar',
  leverworst: 'liverwurst',
  leverpastei: 'liverwurst',
  stroopwafels: 'stroopwafel',
  kipsandwich: 'chicken sandwich',
  'kip sandwich': 'chicken sandwich',
};

const round = (value: number) => Math.round(value * 10) / 10;

const emptyMatch = (): NutrientMatch => ({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  matched: false,
  source: null,
  matchedName: null,
});

const readNumeric = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toMilligrams = (value: number | undefined, unit?: string) => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (unit?.toLowerCase() === 'mg') {
    return value ?? 0;
  }

  if (unit?.toLowerCase() === 'g') {
    return (value ?? 0) * 1000;
  }

  return value ?? 0;
};

const normalizeName = (name: string) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[()%,/]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (nameAliases[normalized]) {
    return nameAliases[normalized];
  }

  const partialAlias = Object.entries(nameAliases).find(([alias]) => normalized.includes(alias))?.[1];
  return partialAlias ?? normalized;
};

const getQueryCandidates = (name: string) => {
  const normalized = normalizeName(name);
  const withoutDescriptors = normalized
    .replace(/\b(de|het|een|en|and|with|met|bio|organic|vers|verse|product|original)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return [...new Set([normalized, withoutDescriptors].filter((query) => query.length >= 3))];
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

const toVolume = (quantity: number, unit: string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === 'ml') {
    return quantity;
  }

  if (volumeUnitToMilliliters[normalizedUnit]) {
    return quantity * volumeUnitToMilliliters[normalizedUnit];
  }

  return null;
};

const toWeight = (quantity: number, unit: string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === 'gram') {
    return quantity;
  }

  if (weightUnitToGrams[normalizedUnit]) {
    return quantity * weightUnitToGrams[normalizedUnit];
  }

  return null;
};

const buildMatch = (
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  },
  source: 'open_food_facts' | 'usda',
  matchedName?: string | null,
): NutrientMatch => ({
  calories: round(nutrients.calories),
  protein: round(nutrients.protein),
  carbs: round(nutrients.carbs),
  fat: round(nutrients.fat),
  fiber: round(nutrients.fiber),
  sugar: round(nutrients.sugar),
  sodium: round(nutrients.sodium),
  matched: true,
  source,
  matchedName: matchedName ?? null,
});

const getNutrientsForSuffix = (nutriments: Record<string, number | string | undefined>, suffix: '_100g' | '_100ml' | '_serving', multiplier: number) => ({
  calories: readNumeric(nutriments[`energy-kcal${suffix}`]) * multiplier,
  protein: readNumeric(nutriments[`proteins${suffix}`]) * multiplier,
  carbs: readNumeric(nutriments[`carbohydrates${suffix}`]) * multiplier,
  fat: readNumeric(nutriments[`fat${suffix}`]) * multiplier,
  fiber: readNumeric(nutriments[`fiber${suffix}`]) * multiplier,
  sugar: readNumeric(nutriments[`sugars${suffix}`]) * multiplier,
  sodium: toMilligrams(readNumeric(nutriments[`sodium${suffix}`]) || readNumeric(nutriments[`salt${suffix}`]) / 2.5, 'g') * multiplier,
});

const parseServingInfo = (product: OpenFoodFactsProduct) => {
  const servingQuantity = readNumeric(product.serving_quantity);
  const servingSize = product.serving_size?.toLowerCase().replace(',', '.') ?? '';
  const sizeMatch = servingSize.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|ml|milliliter|milliliters)/);

  if (sizeMatch) {
    return {
      quantity: Number(sizeMatch[1]),
      unit: sizeMatch[2].startsWith('m') ? 'ml' : 'gram',
    };
  }

  if (servingQuantity) {
    return {
      quantity: servingQuantity,
      unit: /ml/.test(servingSize) ? 'ml' : 'gram',
    };
  }

  if (/(piece|pieces|stuk|stuks|bar|reep|serving|portion)/.test(servingSize)) {
    return {
      quantity: 1,
      unit: 'piece',
    };
  }

  return null;
};

const getOpenFoodFactsMatchForQuery = async (query: string, item: ParsedMealItem): Promise<NutrientMatch> => {
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments,serving_quantity,serving_size`,
  );

  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with ${response.status}.`);
  }

  const data = (await response.json()) as { products?: OpenFoodFactsProduct[] };
  const products = data.products ?? [];
  const unit = normalizeUnit(item.unit);
  const requestedVolume = toVolume(item.quantity, unit);
  const requestedWeight = toWeight(item.quantity, unit);
  const requestedCount = countUnits.has(unit) ? item.quantity : null;

  for (const product of products) {
    const nutriments = product.nutriments ?? {};
    const caloriesServing = readNumeric(nutriments['energy-kcal_serving']);
    const calories100g = readNumeric(nutriments['energy-kcal_100g']);
    const calories100ml = readNumeric(nutriments['energy-kcal_100ml']);
    const servingInfo = parseServingInfo(product);

    if (requestedVolume !== null) {
      if (calories100ml) {
        return buildMatch(getNutrientsForSuffix(nutriments, '_100ml', requestedVolume / 100), 'open_food_facts', product.product_name ?? query);
      }

      if (caloriesServing && servingInfo) {
        const servingVolume = toVolume(servingInfo.quantity, servingInfo.unit);
        if (servingVolume) {
          return buildMatch(getNutrientsForSuffix(nutriments, '_serving', requestedVolume / servingVolume), 'open_food_facts', product.product_name ?? query);
        }
      }
    }

    if (requestedWeight !== null) {
      if (calories100g) {
        return buildMatch(getNutrientsForSuffix(nutriments, '_100g', requestedWeight / 100), 'open_food_facts', product.product_name ?? query);
      }

      if (caloriesServing && servingInfo) {
        const servingWeight = toWeight(servingInfo.quantity, servingInfo.unit);
        if (servingWeight) {
          return buildMatch(getNutrientsForSuffix(nutriments, '_serving', requestedWeight / servingWeight), 'open_food_facts', product.product_name ?? query);
        }
      }
    }

    if (requestedCount !== null) {
      if (caloriesServing) {
        const servingCount = servingInfo && countUnits.has(normalizeUnit(servingInfo.unit)) ? servingInfo.quantity : 1;
        return buildMatch(getNutrientsForSuffix(nutriments, '_serving', requestedCount / servingCount), 'open_food_facts', product.product_name ?? query);
      }

      if (calories100g && servingInfo) {
        const servingWeight = toWeight(servingInfo.quantity, servingInfo.unit);
        if (servingWeight) {
          return buildMatch(getNutrientsForSuffix(nutriments, '_100g', (servingWeight * requestedCount) / 100), 'open_food_facts', product.product_name ?? query);
        }
      }
    }
  }

  return emptyMatch();
};

const getOpenFoodFactsMatch = async (item: ParsedMealItem): Promise<NutrientMatch> => {
  const queries = getQueryCandidates(item.name);

  for (const query of queries) {
    const match = await getOpenFoodFactsMatchForQuery(query, item);
    if (match.matched) {
      return match;
    }
  }

  return emptyMatch();
};

const getUsdaNutrientValue = (
  foodNutrients: Array<{ nutrientName?: string; unitName?: string; value?: number }>,
  matcher: (name: string, unit: string) => boolean,
) => {
  const match = foodNutrients.find((entry) => matcher(entry.nutrientName?.toLowerCase() ?? '', entry.unitName?.toLowerCase() ?? ''));
  return match?.value ?? 0;
};

const getUsdaMatchForQuery = async (query: string, item: ParsedMealItem, apiKey: string | null): Promise<NutrientMatch> => {
  if (!apiKey) {
    return emptyMatch();
  }

  const unit = normalizeUnit(item.unit);
  const requestedWeight = toWeight(item.quantity, unit);
  const requestedVolume = toVolume(item.quantity, unit);
  const requestedCount = countUnits.has(unit) ? item.quantity : null;
  const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      pageSize: 8,
    }),
  });

  if (!response.ok) {
    throw new Error(`USDA search failed with ${response.status}.`);
  }

  const data = (await response.json()) as {
    foods?: Array<{
      description?: string;
      foodNutrients?: Array<{ nutrientName?: string; unitName?: string; value?: number }>;
      servingSize?: number;
      servingSizeUnit?: string;
    }>;
  };

  const foods = data.foods ?? [];

  for (const food of foods) {
    const foodNutrients = food.foodNutrients ?? [];
    const calories = getUsdaNutrientValue(foodNutrients, (name, nutrientUnit) => (name === 'energy' || name.includes('energy')) && nutrientUnit === 'kcal');
    if (!calories) {
      continue;
    }

    if (requestedWeight !== null) {
      const multiplier = requestedWeight / 100;
      return buildMatch(
        {
          calories: calories * multiplier,
          protein: getUsdaNutrientValue(foodNutrients, (name) => name.includes('protein')) * multiplier,
          carbs: getUsdaNutrientValue(foodNutrients, (name) => name.includes('carbohydrate')) * multiplier,
          fat: getUsdaNutrientValue(foodNutrients, (name) => name.includes('total lipid')) * multiplier,
          fiber: getUsdaNutrientValue(foodNutrients, (name) => name.includes('fiber')) * multiplier,
          sugar: getUsdaNutrientValue(foodNutrients, (name) => name.includes('sugars, total')) * multiplier,
          sodium: toMilligrams(getUsdaNutrientValue(foodNutrients, (name) => name.includes('sodium')), 'mg') * multiplier,
        },
        'usda',
        food.description ?? query,
      );
    }

    const servingUnit = normalizeUnit(food.servingSizeUnit ?? '');
    const servingSize = food.servingSize ?? 0;

    if (requestedVolume !== null) {
      const servingVolume = toVolume(servingSize, servingUnit);
      if (!servingVolume) {
        continue;
      }

      const multiplier = requestedVolume / servingVolume;
      return buildMatch(
        {
          calories: calories * multiplier,
          protein: getUsdaNutrientValue(foodNutrients, (name) => name.includes('protein')) * multiplier,
          carbs: getUsdaNutrientValue(foodNutrients, (name) => name.includes('carbohydrate')) * multiplier,
          fat: getUsdaNutrientValue(foodNutrients, (name) => name.includes('total lipid')) * multiplier,
          fiber: getUsdaNutrientValue(foodNutrients, (name) => name.includes('fiber')) * multiplier,
          sugar: getUsdaNutrientValue(foodNutrients, (name) => name.includes('sugars, total')) * multiplier,
          sodium: toMilligrams(getUsdaNutrientValue(foodNutrients, (name) => name.includes('sodium')), 'mg') * multiplier,
        },
        'usda',
        food.description ?? query,
      );
    }

    if (requestedCount !== null && countUnits.has(servingUnit) && servingSize) {
      const multiplier = requestedCount / servingSize;
      return buildMatch(
        {
          calories: calories * multiplier,
          protein: getUsdaNutrientValue(foodNutrients, (name) => name.includes('protein')) * multiplier,
          carbs: getUsdaNutrientValue(foodNutrients, (name) => name.includes('carbohydrate')) * multiplier,
          fat: getUsdaNutrientValue(foodNutrients, (name) => name.includes('total lipid')) * multiplier,
          fiber: getUsdaNutrientValue(foodNutrients, (name) => name.includes('fiber')) * multiplier,
          sugar: getUsdaNutrientValue(foodNutrients, (name) => name.includes('sugars, total')) * multiplier,
          sodium: toMilligrams(getUsdaNutrientValue(foodNutrients, (name) => name.includes('sodium')), 'mg') * multiplier,
        },
        'usda',
        food.description ?? query,
      );
    }
  }

  return emptyMatch();
};

const getUsdaMatch = async (item: ParsedMealItem, apiKey: string | null): Promise<NutrientMatch> => {
  const queries = getQueryCandidates(item.name);

  for (const query of queries) {
    const match = await getUsdaMatchForQuery(query, item, apiKey);
    if (match.matched) {
      return match;
    }
  }

  return emptyMatch();
};

const lookupItem = async (item: ParsedMealItem, usdaApiKey: string | null) => {
  try {
    const openFoodFactsMatch = await getOpenFoodFactsMatch(item);
    if (openFoodFactsMatch.matched) {
      return openFoodFactsMatch;
    }
  } catch (error) {
    console.warn('Open Food Facts lookup failed:', error);
  }

  try {
    const usdaMatch = await getUsdaMatch(item, usdaApiKey);
    if (usdaMatch.matched) {
      return usdaMatch;
    }
  } catch (error) {
    console.warn('USDA lookup failed:', error);
  }

  return emptyMatch();
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? (body.items as ParsedMealItem[]) : [];
    if (!items.length) {
      return new Response(JSON.stringify({ error: 'No meal items were provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usdaApiKey = Deno.env.get('USDA_API_KEY') ?? null;
    const matchedItems = await Promise.all(
      items.map(async (item) => {
        const match = await lookupItem(item, usdaApiKey);
        return {
          ...item,
          ...match,
          unit: normalizeUnit(item.unit),
        };
      }),
    );

    return new Response(JSON.stringify({ items: matchedItems }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected nutrition lookup failure.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
