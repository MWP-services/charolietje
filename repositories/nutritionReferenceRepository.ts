import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { NutritionReferenceRecord } from '@/types/nutrition';

const nutritionReferencesKey = (userId: string) => `nutrivoice:nutrition-references:${userId}`;
const shouldUseMockNutritionStorage = (userId: string) => userId.startsWith('mock_') || userId.startsWith('guest_');
let shouldBypassRemoteNutritionReferences = false;

const getStoredReferences = async (userId: string) => {
  const raw = await AsyncStorage.getItem(nutritionReferencesKey(userId));
  return raw ? (JSON.parse(raw) as NutritionReferenceRecord[]) : [];
};

const isMissingNutritionReferencesTableError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string; status?: number };
  const message = `${candidate.message ?? ''} ${candidate.details ?? ''}`.toLowerCase();

  return (
    candidate.status === 404 ||
    candidate.code === 'PGRST205' ||
    candidate.code === '42P01' ||
    message.includes('nutrition_references') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
};

const markRemoteNutritionReferencesUnavailable = (error: unknown) => {
  shouldBypassRemoteNutritionReferences = true;
  console.warn('nutrition_references table ontbreekt in Supabase; lokale fallback wordt gebruikt totdat het schema is bijgewerkt.', error);
};

export const nutritionReferenceRepository = {
  async listReferences(userId: string) {
    if (isSupabaseConfigured && supabase && !shouldUseMockNutritionStorage(userId) && !shouldBypassRemoteNutritionReferences) {
      const { data, error } = await supabase
        .from('nutrition_references')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        if (isMissingNutritionReferencesTableError(error)) {
          markRemoteNutritionReferencesUnavailable(error);
          return getStoredReferences(userId);
        }

        throw error;
      }

      return (data ?? []) as NutritionReferenceRecord[];
    }

    return getStoredReferences(userId);
  },

  async upsertReferences(userId: string, references: NutritionReferenceRecord[]) {
    if (!references.length) {
      return [];
    }

    const current = await this.listReferences(userId);
    const existingByName = new Map(current.map((entry) => [entry.normalized_name, entry]));
    const mergedReferences = references.map((reference) => {
      const existing = existingByName.get(reference.normalized_name);
      if (!existing) {
        return reference;
      }

      return {
        ...reference,
        id: existing.id,
        created_at: existing.created_at,
      };
    });

    if (isSupabaseConfigured && supabase && !shouldUseMockNutritionStorage(userId) && !shouldBypassRemoteNutritionReferences) {
      const { data, error } = await supabase
        .from('nutrition_references')
        .upsert(mergedReferences, { onConflict: 'user_id,normalized_name' })
        .select('*');

      if (error) {
        if (isMissingNutritionReferencesTableError(error)) {
          markRemoteNutritionReferencesUnavailable(error);
        } else {
          throw error;
        }
      } else {
        return (data ?? []) as NutritionReferenceRecord[];
      }
    }

    const nextByName = new Map(current.map((entry) => [entry.normalized_name, entry]));

    mergedReferences.forEach((reference) => {
      nextByName.set(reference.normalized_name, reference);
    });

    const next = Array.from(nextByName.values());
    await AsyncStorage.setItem(nutritionReferencesKey(userId), JSON.stringify(next));
    return next;
  },

  async clearLocalReferences(userId: string) {
    await AsyncStorage.removeItem(nutritionReferencesKey(userId));
  },

  resetRemoteBypass() {
    shouldBypassRemoteNutritionReferences = false;
  },
};
