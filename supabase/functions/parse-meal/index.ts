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
    required: ['mealType', 'items', 'originalText'],
    properties: {
      mealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack', 'unknown'],
      },
      originalText: {
        type: 'string',
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'quantity', 'unit', 'confidence'],
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            confidence: { type: 'number' },
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
              'Extract foods from meal descriptions for a nutrition app. The user may write in Dutch or English. Return canonical food names in English where practical, split combined meals into recognizable ingredients, and prefer generic product types over brand slogans. Estimate quantities conservatively, classify meal type, and never invent unrelated foods. Standardize units where possible: prefer gram for solids, ml for drinks, and piece, slice, or serving only when weight or volume is genuinely unknown. Convert cups, glasses, mugs, bowls, coffee servings, cans, bottles, and scoops into approximate ml or gram when you can. If a text contains packaged foods, return the edible product itself instead of packaging words.',
          },
          {
            role: 'user',
            content: `Parse this meal for a nutrition app: ${text}`,
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
