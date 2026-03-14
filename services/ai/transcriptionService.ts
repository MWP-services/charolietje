import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const DEFAULT_TRANSCRIPTION_PROMPT =
  'This is a nutrition tracking transcript. The user may speak Dutch or English and mention foods, brands, quantities, meal types, and nutrition-related words.';

const guessMimeType = (uri: string) => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.webm')) return 'audio/webm';
  return 'audio/m4a';
};

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

export const transcribeAudioWithOpenAI = async (audioUri: string) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured, so real transcription is unavailable.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    name: 'meal-recording.m4a',
    type: guessMimeType(audioUri),
  } as any);
  formData.append('prompt', DEFAULT_TRANSCRIPTION_PROMPT);

  const response = await fetch(getFunctionUrl('transcribe-audio'), {
    method: 'POST',
    headers: {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      Authorization: `Bearer ${session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let detail = 'The transcription service request failed.';
    try {
      const body = await response.json();
      detail = body.error ?? body.message ?? detail;
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        detail = fallbackText;
      }
    }

    throw new Error(detail);
  }

  const data = (await response.json()) as { text?: string };

  if (!data.text?.trim()) {
    throw new Error('OpenAI transcription returned empty text.');
  }

  return data.text.trim();
};
