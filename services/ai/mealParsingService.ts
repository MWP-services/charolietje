import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ParsedMeal } from '@/types/meal';

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

export const parseMealTextWithOpenAI = async (text: string): Promise<ParsedMeal> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured, so real meal parsing is unavailable.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(getFunctionUrl('parse-meal'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      Authorization: `Bearer ${session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    let detail = 'The meal parsing service request failed.';
    try {
      const body = await response.json();
      detail = body.error ?? body.detail ?? body.message ?? detail;
    } catch {
      const fallbackText = await response.text();
      if (fallbackText) {
        detail = fallbackText;
      }
    }
    throw new Error(detail);
  }

  const data = (await response.json()) as ParsedMeal;

  if (!data.items?.length) {
    throw new Error('OpenAI meal parsing returned no items.');
  }

  return data;
};
