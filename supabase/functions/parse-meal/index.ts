const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const mealSchema = {
  name: 'meal_parse',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['mealType', 'items', 'originalText', 'overallConfidence', 'needsClarification', 'clarificationPriority', 'clarifications'],
    properties: {
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack', 'unknown'],
      },
      originalText: {
        type: 'string',
      },
      overallConfidence: {
        type: 'number',
      },
      needsClarification: {
        type: 'boolean',
      },
      clarificationPriority: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['meal_size', 'portion_size', 'quantity', 'preparation_method', 'hidden_calories', 'source_context'],
        },
      },
      clarifications: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'question', 'options'],
          properties: {
            type: {
              type: 'string',
              enum: ['meal_size', 'portion_size', 'quantity', 'preparation_method', 'hidden_calories', 'source_context'],
            },
            question: {
              type: 'string',
            },
            selectionMode: {
              type: 'string',
              enum: ['single', 'multiple'],
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['label'],
                properties: {
                  label: { type: 'string' },
                  grams: { type: ['number', 'null'] },
                  quantity: { type: ['number', 'null'] },
                  unit: { type: ['string', 'null'] },
                  multiplier: { type: ['number', 'null'] },
                  mealSizeKey: {
                    type: ['string', 'null'],
                    enum: ['small', 'normal', 'large', null],
                  },
                  prep: {
                    type: ['string', 'null'],
                    enum: ['grilled', 'pan_fried', 'sauce', 'fried', 'oven_baked', 'boiled', 'raw', null],
                  },
                  hiddenCalorie: {
                    type: ['string', 'null'],
                    enum: ['oil', 'butter', 'sauce', 'dressing', 'cheese', 'not_sure', null],
                  },
                  sourceContext: {
                    type: ['string', 'null'],
                    enum: ['home_made', 'restaurant', 'takeaway', null],
                  },
                },
              },
            },
          },
        },
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'name',
            'quantity',
            'unit',
            'confidence',
            'confidenceFood',
            'confidenceAmount',
            'estimatedGrams',
            'needsClarification',
            'clarificationType',
            'clarificationQuestion',
            'clarificationOptions',
            'possiblePreparationMethods',
            'possibleHiddenCalories',
            'searchAliases',
          ],
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            confidence: { type: 'number' },
            confidenceFood: { type: 'number' },
            confidenceAmount: { type: 'number' },
            estimatedGrams: { type: ['number', 'null'] },
            needsClarification: { type: 'boolean' },
            clarificationType: {
              type: ['string', 'null'],
              enum: ['meal_size', 'portion_size', 'quantity', 'preparation_method', 'hidden_calories', 'source_context', null],
            },
            clarificationQuestion: { type: ['string', 'null'] },
            clarificationOptions: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['label'],
                properties: {
                  label: { type: 'string' },
                  grams: { type: ['number', 'null'] },
                  quantity: { type: ['number', 'null'] },
                  unit: { type: ['string', 'null'] },
                  multiplier: { type: ['number', 'null'] },
                  mealSizeKey: {
                    type: ['string', 'null'],
                    enum: ['small', 'normal', 'large', null],
                  },
                  prep: {
                    type: ['string', 'null'],
                    enum: ['grilled', 'pan_fried', 'sauce', 'fried', 'oven_baked', 'boiled', 'raw', null],
                  },
                  hiddenCalorie: {
                    type: ['string', 'null'],
                    enum: ['oil', 'butter', 'sauce', 'dressing', 'cheese', 'not_sure', null],
                  },
                  sourceContext: {
                    type: ['string', 'null'],
                    enum: ['home_made', 'restaurant', 'takeaway', null],
                  },
                },
              },
            },
            possiblePreparationMethods: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['grilled', 'pan_fried', 'sauce', 'fried', 'oven_baked', 'boiled', 'raw'],
              },
            },
            possibleHiddenCalories: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['oil', 'butter', 'sauce', 'dressing', 'cheese', 'not_sure'],
              },
            },
            searchAliases: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  },
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

  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_MEAL_PARSER_MODEL') ?? 'gpt-4o-mini';

  if (!openAiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const personalizationHints = typeof body?.personalizationHints === 'string' ? body.personalizationHints.trim() : '';

    if (!text) {
      return new Response(JSON.stringify({ error: 'No meal text was provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
              'You extract foods from meal descriptions for a nutrition app. The user may write in Dutch or English. Return canonical food names in English where practical, split combined meals into recognizable edible ingredients, and prefer generic product types over brand slogans. Be conservative about quantity certainty: if the user did not state an amount clearly, do not pretend precision. Estimate practical default quantities, but lower confidenceAmount and mark clarification when needed. Reason explicitly about six things before answering: food identification, quantity certainty, overall meal size certainty for composite meals, whether a follow-up clarification is needed, preparation method uncertainty, and likely hidden calories such as oil, butter, sauce, dressing, cheese, or restaurant extras. Standardize units where possible: prefer gram for solids, ml for drinks, and piece, slice, or serving only when weight or volume is genuinely unknown. Convert cups, glasses, mugs, bowls, coffee servings, cans, bottles, and scoops into approximate ml or gram when you can. If a text contains packaged foods, return the edible product itself instead of packaging words. For each item, also return 2 to 5 short searchAliases that could help nutrition lookup, using likely Dutch and English variants, singular forms, and important preparation qualifiers such as grilled, cooked, whole wheat, low fat, smoked, pesto, or fried when they materially change the nutrition match. For composite plate meals like rice with chicken and vegetables, prefer one short Dutch meal_size clarification over multiple portion questions when the whole plate size is the main uncertainty. Clarification questions and option labels must be in Dutch. Ask at most 3 clarifications overall. If the meal already contains clear grams or counts, keep clarifications empty.',
          },
          {
            role: 'user',
            content: `Parse this meal for a nutrition app: ${text}${personalizationHints ? `\n\nRecent accepted user tendencies for similar meals: ${personalizationHints}` : ''}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: mealSchema.name,
            strict: true,
            schema: mealSchema.schema,
          },
        },
      }),
    });

    const responseText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI meal parsing request failed.',
          detail: responseText,
        }),
        {
          status: upstreamResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
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
      return new Response(JSON.stringify({ error: 'OpenAI returned empty structured content.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(content, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected meal parsing failure.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
