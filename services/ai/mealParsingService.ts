import { isSupabaseConfigured } from '@/lib/supabase';
import type { ParsedMeal } from '@/types/meal';
import { parsedMealSchema } from '@/utils/validation';

const getFunctionUrl = (path: string) => `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${path}`;

export const parseMealTextWithOpenAI = async (text: string, personalizationHints?: string | null): Promise<ParsedMeal> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is niet ingesteld, dus echte maaltijdparsing is niet beschikbaar.');
  }

  const response = await fetch(getFunctionUrl('parse-meal'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({ text, personalizationHints }),
  });

  if (!response.ok) {
    let detail = 'Het verzoek naar de maaltijdparser is mislukt.';
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
        `Maaltijdparsing mislukte met 401 Unauthorized. ${errorSummary ? `${errorSummary} ` : ''}${detail} Als dit over OpenAI gaat, controleer dan het OPENAI_API_KEY-secret in Supabase. Als dit over JWT gaat, deploy de functie opnieuw met uitgeschakelde JWT-verificatie.`,
      );
    }

    throw new Error(
      `Maaltijdparsing mislukt (${response.status} ${response.statusText}). ${errorSummary ? `${errorSummary} ` : ''}${detail}`,
    );
  }

  const json = await response.json();
  const parsedResult = parsedMealSchema.safeParse(json);

  if (!parsedResult.success) {
    throw new Error('De AI-parser gaf een ongeldig maaltijdschema terug.');
  }

  const data = parsedResult.data as ParsedMeal;

  if (!data.items?.length) {
    throw new Error('OpenAI maaltijdparsing gaf geen items terug.');
  }

  return data;
};
