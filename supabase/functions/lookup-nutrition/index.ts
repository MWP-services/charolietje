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

const countUnits = new Set(['piece', 'slice', 'serving']);

const nameAliases: Record<string, string> = {
  brood: 'bread',
  boterham: 'bread',
  boterhammen: 'bread',
  pindakaas: 'peanut butter',
  peanutbutter: 'peanut butter',
  melk: 'semi-skimmed milk',
  'halfvolle melk': 'semi-skimmed milk',
  'magere melk': 'skim milk',
  appel: 'apple',
  banaan: 'banana',
  rijst: 'rice',
  zalm: 'salmon',
  groenten: 'mixed vegetables',
  groente: 'mixed vegetables',
  havermout: 'oats',
  ei: 'egg',
  eieren: 'egg',
  leverworst: 'liverwurst',
  leverpastei: 'liverwurst',
  stroopwafels: 'stroopwafel',
  kipsandwich: 'chicken sandwich',
  'kip sandwich': 'chicken sandwich',
  'protein yoghurt': 'protein yogurt',
  proteineyoghurt: 'protein yogurt',
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

const normalizeName = (name: string) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  return nameAliases[normalized] ?? normalized;
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

const readNumeric = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const buildMatch = (nutrients: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}, source: 'open_food_facts' | 'usda', matchedName?: string | null): NutrientMatch => ({
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

const getOpenFoodFactsMatch = async (item: ParsedMealItem): Promise<NutrientMatch> => {
  const query = normalizeName(item.name);
  const unit = normalizeUnit(item.unit);
  const response = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,serving_quantity,serving_size`,
  );

  if (!response.ok) {
    throw new Error(`Open Food Facts search failed with ${response.status}.`);
  }

  const data = (await response.json()) as {
    products?: Array<{
      product_name?: string;
      serving_quantity?: number | string;
      serving_size?: string;
      nutriments?: Record<string, number | string | undefined>;
    }>;
  };

  const products = data.products ?? [];

  for (const product of products) {
    const nutriments = product.nutriments ?? {};
    const calories100g = readNumeric(nutriments['energy-kcal_100g']);
    const calories100ml = readNumeric(nutriments['energy-kcal_100ml']);
    const caloriesServing = readNumeric(nutriments['energy-kcal_serving']);

    if (unit === 'gram' || unit === 'ml') {
      const baseKey = unit === 'ml' && calories100ml ? '_100ml' : '_100g';
      const calories = readNumeric(nutriments[`energy-kcal${baseKey}`]);
      if (!calories) {
        continue;
      }

      const multiplier = item.quantity / 100;
      return buildMatch(
        {
          calories: calories * multiplier,
          protein: readNumeric(nutriments[`proteins${baseKey}`]) * multiplier,
          carbs: readNumeric(nutriments[`carbohydrates${baseKey}`]) * multiplier,
          fat: readNumeric(nutriments[`fat${baseKey}`]) * multiplier,
          fiber: readNumeric(nutriments[`fiber${baseKey}`]) * multiplier,
          sugar: readNumeric(nutriments[`sugars${baseKey}`]) * multiplier,
          sodium: toMilligrams(
            readNumeric(nutriments[`sodium${baseKey}`]) || readNumeric(nutriments[`salt${baseKey}`]) / 2.5,
            'g',
          ) * multiplier,
        },
        'open_food_facts',
        product.product_name ?? query,
      );
    }

    if (countUnits.has(unit) && caloriesServing) {
      const multiplier = item.quantity;
      return buildMatch(
        {
          calories: caloriesServing * multiplier,
          protein: readNumeric(nutriments.proteins_serving) * multiplier,
          carbs: readNumeric(nutriments.carbohydrates_serving) * multiplier,
          fat: readNumeric(nutriments.fat_serving) * multiplier,
          fiber: readNumeric(nutriments.fiber_serving) * multiplier,
          sugar: readNumeric(nutriments.sugars_serving) * multiplier,
          sodium: toMilligrams(
            readNumeric(nutriments.sodium_serving) || readNumeric(nutriments.salt_serving) / 2.5,
            'g',
          ) * multiplier,
        },
        'open_food_facts',
        product.product_name ?? query,
      );
    }

    if (countUnits.has(unit) && calories100g && readNumeric(product.serving_quantity)) {
      const servingQuantity = readNumeric(product.serving_quantity);
      const multiplier = (servingQuantity * item.quantity) / 100;
      return buildMatch(
        {
          calories: calories100g * multiplier,
          protein: readNumeric(nutriments.proteins_100g) * multiplier,
          carbs: readNumeric(nutriments.carbohydrates_100g) * multiplier,
          fat: readNumeric(nutriments.fat_100g) * multiplier,
          fiber: readNumeric(nutriments.fiber_100g) * multiplier,
          sugar: readNumeric(nutriments.sugars_100g) * multiplier,
          sodium: toMilligrams(
            readNumeric(nutriments.sodium_100g) || readNumeric(nutriments.salt_100g) / 2.5,
            'g',
          ) * multiplier,
        },
        'open_food_facts',
        product.product_name ?? query,
      );
    }
  }

  return emptyMatch();
};

const getUsdaNutrientValue = (
  foodNutrients: Array<{ nutrientName?: string; unitName?: string; value?: number }>,
  matcher: (name: string, unit: string) => boolean,
) => {
  const match = foodNutrients.find((entry) => matcher(entry.nutrientName?.toLowerCase() ?? '', entry.unitName?.toLowerCase() ?? ''));
  if (!match) {
    return 0;
  }

  return match.value ?? 0;
};

const getUsdaMatch = async (item: ParsedMealItem, apiKey: string | null): Promise<NutrientMatch> => {
  if (!apiKey) {
    return emptyMatch();
  }

  const unit = normalizeUnit(item.unit);
  const query = normalizeName(item.name);
  const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      pageSize: 5,
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
    const calories = getUsdaNutrientValue(foodNutrients, (name, unit) => (name === 'energy' || name.includes('energy')) && unit === 'kcal');
    if (!calories) {
      continue;
    }

    if (unit === 'gram') {
      const multiplier = item.quantity / 100;
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

    if (countUnits.has(unit) || unit === 'ml') {
      const servingUnit = normalizeUnit(food.servingSizeUnit ?? '');
      const servingSize = food.servingSize ?? 0;
      if (!servingSize || servingUnit !== unit) {
        continue;
      }

      const multiplier = item.quantity / servingSize;
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
