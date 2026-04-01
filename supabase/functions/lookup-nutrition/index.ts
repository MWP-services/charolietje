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
  searchAliases?: string[];
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
  source: 'open_food_facts' | 'usda' | 'ai_estimate' | null;
  matchedName?: string | null;
  matchScore?: number;
};

type AiNutritionEstimate = {
  matched: boolean;
  matchedName: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
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
  lasagne: 'lasagna',
  lasagna: 'lasagna',
  eiwitreep: 'protein bar',
  proteinebar: 'protein bar',
  leverworst: 'liverwurst',
  leverpastei: 'liverwurst',
  stroopwafels: 'stroopwafel',
  kipsandwich: 'chicken sandwich',
  'kip sandwich': 'chicken sandwich',
};

const round = (value: number) => Math.round(value * 10) / 10;

const nutritionEstimateSchema = {
  name: 'nutrition_estimate',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['matched', 'matchedName', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium'],
    properties: {
      matched: { type: 'boolean' },
      matchedName: { type: ['string', 'null'] },
      calories: { type: 'number' },
      protein: { type: 'number' },
      carbs: { type: 'number' },
      fat: { type: 'number' },
      fiber: { type: 'number' },
      sugar: { type: 'number' },
      sodium: { type: 'number' },
    },
  },
};

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
  matchScore: 0,
});

const toSafeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
};

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

const cleanQuery = (value: string) =>
  value
    .replace(/\b(de|het|een|en|and|with|met|bio|organic|vers|verse|product|original)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getQueryCandidates = (item: ParsedMealItem) => {
  const normalized = normalizeName(item.name);
  const aliasQueries = (item.searchAliases ?? []).map((alias) => normalizeName(alias));

  return [...new Set([normalized, cleanQuery(normalized), ...aliasQueries.map(cleanQuery)].filter((query) => query.length >= 3))];
};

const getNameTokens = (value: string) =>
  cleanQuery(normalizeName(value))
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

const getNameSimilarity = (query: string, candidate: string) => {
  const normalizedQuery = cleanQuery(normalizeName(query));
  const normalizedCandidate = cleanQuery(normalizeName(candidate));

  if (!normalizedQuery || !normalizedCandidate) {
    return 0;
  }

  if (normalizedQuery === normalizedCandidate) {
    return 1;
  }

  if (normalizedCandidate.includes(normalizedQuery) || normalizedQuery.includes(normalizedCandidate)) {
    return 0.9;
  }

  const queryTokens = getNameTokens(normalizedQuery);
  const candidateTokens = getNameTokens(normalizedCandidate);
  if (!queryTokens.length || !candidateTokens.length) {
    return 0;
  }

  const candidateTokenSet = new Set(candidateTokens);
  const matchedTokens = queryTokens.filter((token) => candidateTokenSet.has(token)).length;
  const queryCoverage = matchedTokens / queryTokens.length;
  const candidateCoverage = matchedTokens / candidateTokens.length;

  return Math.max(queryCoverage * 0.75 + candidateCoverage * 0.25, 0);
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
  source: 'open_food_facts' | 'usda' | 'ai_estimate',
  matchedName?: string | null,
  matchScore = 1,
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
  matchScore,
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

const buildAiEstimateMatch = (estimate: AiNutritionEstimate): NutrientMatch => {
  if (!estimate.matched) {
    return emptyMatch();
  }

  return buildMatch(
    {
      calories: toSafeNumber(estimate.calories),
      protein: toSafeNumber(estimate.protein),
      carbs: toSafeNumber(estimate.carbs),
      fat: toSafeNumber(estimate.fat),
      fiber: toSafeNumber(estimate.fiber),
      sugar: toSafeNumber(estimate.sugar),
      sodium: toSafeNumber(estimate.sodium),
    },
    'ai_estimate',
    estimate.matchedName,
  );
};

const isNutritionPlausibleForQuantity = (item: ParsedMealItem, match: NutrientMatch) => {
  const normalizedUnit = normalizeUnit(item.unit);

  if (!match.matched || (normalizedUnit !== 'gram' && normalizedUnit !== 'ml')) {
    return true;
  }

  const quantityBasis = Math.max(item.quantity, 1);
  const protein = Math.max(match.protein ?? 0, 0);
  const carbs = Math.max(match.carbs ?? 0, 0);
  const fat = Math.max(match.fat ?? 0, 0);
  const calories = Math.max(match.calories ?? 0, 0);
  const macroMass = protein + carbs + fat;

  if (protein > quantityBasis * 1.05 || carbs > quantityBasis * 1.05 || fat > quantityBasis * 1.05) {
    return false;
  }

  if (macroMass > quantityBasis * 1.12) {
    return false;
  }

  if (calories > quantityBasis * 9.1) {
    return false;
  }

  return true;
};

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
  let bestMatch = emptyMatch();

  for (const product of products) {
    const matchName = product.product_name ?? query;
    const matchScore = getNameSimilarity(query, matchName);
    if (matchScore < 0.52) {
      continue;
    }

    const nutriments = product.nutriments ?? {};
    const caloriesServing = readNumeric(nutriments['energy-kcal_serving']);
    const calories100g = readNumeric(nutriments['energy-kcal_100g']);
    const calories100ml = readNumeric(nutriments['energy-kcal_100ml']);
    const servingInfo = parseServingInfo(product);
    let candidateMatch = emptyMatch();

    if (requestedVolume !== null) {
      if (calories100ml) {
        candidateMatch = buildMatch(getNutrientsForSuffix(nutriments, '_100ml', requestedVolume / 100), 'open_food_facts', matchName, matchScore);
      }

      if (!candidateMatch.matched && caloriesServing && servingInfo) {
        const servingVolume = toVolume(servingInfo.quantity, servingInfo.unit);
        if (servingVolume) {
          candidateMatch = buildMatch(getNutrientsForSuffix(nutriments, '_serving', requestedVolume / servingVolume), 'open_food_facts', matchName, matchScore);
        }
      }
    }

    if (!candidateMatch.matched && requestedWeight !== null) {
      if (calories100g) {
        candidateMatch = buildMatch(getNutrientsForSuffix(nutriments, '_100g', requestedWeight / 100), 'open_food_facts', matchName, matchScore);
      }

      if (!candidateMatch.matched && caloriesServing && servingInfo) {
        const servingWeight = toWeight(servingInfo.quantity, servingInfo.unit);
        if (servingWeight) {
          candidateMatch = buildMatch(getNutrientsForSuffix(nutriments, '_serving', requestedWeight / servingWeight), 'open_food_facts', matchName, matchScore);
        }
      }
    }

    if (!candidateMatch.matched && requestedCount !== null) {
      if (caloriesServing) {
        const servingCount = servingInfo && countUnits.has(normalizeUnit(servingInfo.unit)) ? servingInfo.quantity : 1;
        candidateMatch = buildMatch(getNutrientsForSuffix(nutriments, '_serving', requestedCount / servingCount), 'open_food_facts', matchName, matchScore);
      }

      if (!candidateMatch.matched && calories100g && servingInfo) {
        const servingWeight = toWeight(servingInfo.quantity, servingInfo.unit);
        if (servingWeight) {
          candidateMatch = buildMatch(getNutrientsForSuffix(nutriments, '_100g', (servingWeight * requestedCount) / 100), 'open_food_facts', matchName, matchScore);
        }
      }
    }

    if (candidateMatch.matched && isNutritionPlausibleForQuantity(item, candidateMatch) && (candidateMatch.matchScore ?? 0) > (bestMatch.matchScore ?? 0)) {
      bestMatch = candidateMatch;
    }
  }

  return bestMatch;
};

const getOpenFoodFactsMatch = async (item: ParsedMealItem): Promise<NutrientMatch> => {
  const queries = getQueryCandidates(item);
  let bestMatch = emptyMatch();

  for (const query of queries) {
    const match = await getOpenFoodFactsMatchForQuery(query, item);
    if (match.matched && (match.matchScore ?? 0) > (bestMatch.matchScore ?? 0)) {
      bestMatch = match;
    }
  }

  return bestMatch;
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
  let bestMatch = emptyMatch();

  for (const food of foods) {
    const matchName = food.description ?? query;
    const matchScore = getNameSimilarity(query, matchName);
    if (matchScore < 0.52) {
      continue;
    }

    const foodNutrients = food.foodNutrients ?? [];
    const calories = getUsdaNutrientValue(foodNutrients, (name, nutrientUnit) => (name === 'energy' || name.includes('energy')) && nutrientUnit === 'kcal');
    if (!calories) {
      continue;
    }

    let candidateMatch = emptyMatch();

    if (requestedWeight !== null) {
      const multiplier = requestedWeight / 100;
      candidateMatch = buildMatch(
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
        matchName,
        matchScore,
      );
    }

    const servingUnit = normalizeUnit(food.servingSizeUnit ?? '');
    const servingSize = food.servingSize ?? 0;

    if (!candidateMatch.matched && requestedVolume !== null) {
      const servingVolume = toVolume(servingSize, servingUnit);
      if (!servingVolume) {
        continue;
      }

      const multiplier = requestedVolume / servingVolume;
      candidateMatch = buildMatch(
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
        matchName,
        matchScore,
      );
    }

    if (!candidateMatch.matched && requestedCount !== null && countUnits.has(servingUnit) && servingSize) {
      const multiplier = requestedCount / servingSize;
      candidateMatch = buildMatch(
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
        matchName,
        matchScore,
      );
    }

    if (candidateMatch.matched && isNutritionPlausibleForQuantity(item, candidateMatch) && (candidateMatch.matchScore ?? 0) > (bestMatch.matchScore ?? 0)) {
      bestMatch = candidateMatch;
    }
  }

  return bestMatch;
};

const getUsdaMatch = async (item: ParsedMealItem, apiKey: string | null): Promise<NutrientMatch> => {
  const queries = getQueryCandidates(item);
  let bestMatch = emptyMatch();

  for (const query of queries) {
    const match = await getUsdaMatchForQuery(query, item, apiKey);
    if (match.matched && (match.matchScore ?? 0) > (bestMatch.matchScore ?? 0)) {
      bestMatch = match;
    }
  }

  return bestMatch;
};

const getAiEstimate = async (item: ParsedMealItem, openAiKey: string | null, model: string): Promise<NutrientMatch> => {
  if (!openAiKey) {
    return emptyMatch();
  }

  const normalizedUnit = normalizeUnit(item.unit);
  const queryCandidates = getQueryCandidates(item);
  const upstreamResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'Estimate nutrition totals for one food or drink item in a nutrition tracking app. The user may write in Dutch or English. Return the total nutrients for the requested quantity and unit, not per 100g. Use practical generic nutrition references when the exact product is unknown. If the item is ambiguous, choose the most common edible interpretation and stay conservative. Sodium must be returned in milligrams. Never return negative values. If the item is not a recognizable edible product, set matched to false and set every nutrient to 0.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            itemName: item.name,
            quantity: item.quantity,
            unit: normalizedUnit,
            searchAliases: item.searchAliases ?? [],
            queryCandidates,
          }),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: nutritionEstimateSchema.name,
          strict: true,
          schema: nutritionEstimateSchema.schema,
        },
      },
    }),
  });

  const responseText = await upstreamResponse.text();

  if (!upstreamResponse.ok) {
    throw new Error(`OpenAI nutrition estimate failed with ${upstreamResponse.status}: ${responseText}`);
  }

  const parsed = JSON.parse(responseText) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = parsed.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty structured content for nutrition estimate.');
  }

  return buildAiEstimateMatch(JSON.parse(content) as AiNutritionEstimate);
};

const lookupItem = async (item: ParsedMealItem, usdaApiKey: string | null, openAiKey: string | null, aiNutritionModel: string) => {
  try {
    const openFoodFactsMatch = await getOpenFoodFactsMatch(item);
    if (openFoodFactsMatch.matched && isNutritionPlausibleForQuantity(item, openFoodFactsMatch)) {
      return openFoodFactsMatch;
    }
  } catch (error) {
    console.warn('Open Food Facts lookup failed:', error);
  }

  try {
    const usdaMatch = await getUsdaMatch(item, usdaApiKey);
    if (usdaMatch.matched && isNutritionPlausibleForQuantity(item, usdaMatch)) {
      return usdaMatch;
    }
  } catch (error) {
    console.warn('USDA lookup failed:', error);
  }

  try {
    const aiEstimate = await getAiEstimate(item, openAiKey, aiNutritionModel);
    if (aiEstimate.matched && isNutritionPlausibleForQuantity(item, aiEstimate)) {
      return aiEstimate;
    }
  } catch (error) {
    console.warn('AI nutrition estimate failed:', error);
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
    const openAiKey = Deno.env.get('OPENAI_API_KEY') ?? null;
    const aiNutritionModel = Deno.env.get('OPENAI_NUTRITION_MODEL') ?? Deno.env.get('OPENAI_MEAL_PARSER_MODEL') ?? 'gpt-4o-mini';
    const matchedItems = await Promise.all(
      items.map(async (item) => {
        const match = await lookupItem(item, usdaApiKey, openAiKey, aiNutritionModel);
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
