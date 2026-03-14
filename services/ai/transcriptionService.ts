import { Platform } from 'react-native';

import { isSupabaseConfigured } from '@/lib/supabase';

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

const appendAudioFile = async (formData: FormData, audioUri: string) => {
  const mimeType = guessMimeType(audioUri);

  if (Platform.OS === 'web') {
    const response = await fetch(audioUri);
    const blob = await response.blob();
    formData.append('file', new File([blob], 'meal-recording.webm', { type: blob.type || mimeType }));
    return;
  }

  formData.append('file', {
    uri: audioUri,
    name: 'meal-recording.m4a',
    type: mimeType,
  } as any);
};

export const transcribeAudioWithOpenAI = async (audioUri: string) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured, so real transcription is unavailable.');
  }

  const formData = new FormData();
  await appendAudioFile(formData, audioUri);
  formData.append('prompt', DEFAULT_TRANSCRIPTION_PROMPT);

  const response = await fetch(getFunctionUrl('transcribe-audio'), {
    method: 'POST',
    headers: {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: formData,
  });

  if (!response.ok) {
    let detail = 'The transcription service request failed.';
    let errorSummary = '';
    try {
      const body = await response.json();
      errorSummary = body.error ?? '';
      detail = body.detail ?? body.message ?? body.error ?? detail;
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        detail = fallbackText;
      }
    }

    if (response.status === 401) {
      throw new Error(
        `Transcription request failed with 401 Unauthorized. ${errorSummary ? `${errorSummary} ` : ''}${detail} If this mentions OpenAI, check the OPENAI_API_KEY secret in Supabase. If it mentions JWT, redeploy the function with JWT verification disabled.`,
      );
    }

    throw new Error(
      `Transcription request failed (${response.status} ${response.statusText}). ${errorSummary ? `${errorSummary} ` : ''}${detail}`,
    );
  }

  const data = (await response.json()) as { text?: string };

  if (!data.text?.trim()) {
    throw new Error('OpenAI transcription returned empty text.');
  }

  return data.text.trim();
};
