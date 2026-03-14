const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  const model = Deno.env.get('OPENAI_AUDIO_MODEL') ?? 'gpt-4o-mini-transcribe';

  if (!openAiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const prompt = formData.get('prompt');
    const language = formData.get('language');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No audio file was provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const upstreamForm = new FormData();
    upstreamForm.append('file', file, file.name || 'audio.m4a');
    upstreamForm.append('model', model);
    upstreamForm.append('response_format', 'json');

    if (typeof prompt === 'string' && prompt.trim()) {
      upstreamForm.append('prompt', prompt.trim());
    }

    if (typeof language === 'string' && language.trim()) {
      upstreamForm.append('language', language.trim());
    }

    const upstreamResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
      },
      body: upstreamForm,
    });

    const responseText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI transcription request failed.',
          detail: responseText,
        }),
        {
          status: upstreamResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const parsed = JSON.parse(responseText) as { text?: string };

    return new Response(
      JSON.stringify({
        text: parsed.text ?? '',
        model,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected transcription failure.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
