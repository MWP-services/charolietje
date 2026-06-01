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

const round = (value: number) => Math.round(value * 10) / 10;
const toSafeNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0);

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

const getAiEstimate = async (item: ParsedMealItem, openAiKey: string, model: string) => {
  const unit = normalizeUnit(item.unit);
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
            'Estimate nutrition totals for one food or drink item in a nutrition tracking app. The user may write in Dutch or English. Return total nutrients for the requested quantity and unit, not per 100g. Use practical generic nutrition knowledge when the exact product is unknown. If ambiguous, choose the most common edible interpretation and stay conservative. Sodium must be in milligrams. Never return negative values. If the item is not recognizable food or drink, set matched to false and every nutrient to 0.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            itemName: item.name,
            quantity: item.quantity,
            unit,
            confidence: item.confidence ?? null,
            searchAliases: item.searchAliases ?? [],
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

  const estimate = JSON.parse(content) as AiNutritionEstimate;
  return {
    ...item,
    unit,
    calories: round(toSafeNumber(estimate.calories)),
    protein: round(toSafeNumber(estimate.protein)),
    carbs: round(toSafeNumber(estimate.carbs)),
    fat: round(toSafeNumber(estimate.fat)),
    fiber: round(toSafeNumber(estimate.fiber)),
    sugar: round(toSafeNumber(estimate.sugar)),
    sodium: round(toSafeNumber(estimate.sodium)),
    matched: estimate.matched,
    source: 'ai_estimate',
    matchedName: estimate.matchedName,
  };
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

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const model = Deno.env.get('OPENAI_NUTRITION_MODEL') ?? Deno.env.get('OPENAI_MEAL_PARSER_MODEL') ?? 'gpt-4o-mini';
    const estimatedItems = await Promise.all(items.map((item) => getAiEstimate(item, openAiKey, model)));

    return new Response(JSON.stringify({ items: estimatedItems }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected nutrition estimate failure.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
