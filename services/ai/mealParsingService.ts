import { isSupabaseConfigured } from '@/lib/supabase';
import type { ParsedMeal } from '@/types/meal';

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

export const parseMealTextWithOpenAI = async (text: string): Promise<ParsedMeal> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured, so real meal parsing is unavailable.');
  }

  const response = await fetch(getFunctionUrl('parse-meal'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let detail = 'The meal parsing service request failed.';
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
        `Meal parsing request failed with 401 Unauthorized. ${errorSummary ? `${errorSummary} ` : ''}${detail} If this mentions OpenAI, check the OPENAI_API_KEY secret in Supabase. If it mentions JWT, redeploy the function with JWT verification disabled.`,
      );
    }

    throw new Error(
      `Meal parsing request failed (${response.status} ${response.statusText}). ${errorSummary ? `${errorSummary} ` : ''}${detail}`,
    );
  }

  const data = (await response.json()) as ParsedMeal;

  if (!data.items?.length) {
    throw new Error('OpenAI meal parsing returned no items.');
  }

  return data;
};
