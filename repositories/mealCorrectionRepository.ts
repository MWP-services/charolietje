import AsyncStorage from '@react-native-async-storage/async-storage';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MealCorrectionSignalRecord } from '@/types/meal';

const correctionSignalsKey = (userId: string) => `nutrivoice:meal-correction-signals:${userId}`;
const shouldUseMockCorrectionStorage = (userId: string) => userId.startsWith('mock_') || userId.startsWith('guest_');
let shouldBypassRemoteCorrectionSignals = false;

const getStoredSignals = async (userId: string) => {
  const raw = await AsyncStorage.getItem(correctionSignalsKey(userId));
  return raw ? (JSON.parse(raw) as MealCorrectionSignalRecord[]) : [];
};

const isMissingCorrectionSignalsTableError = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: string; message?: string; details?: string; status?: number };
  const message = `${candidate.message ?? ''} ${candidate.details ?? ''}`.toLowerCase();

  return (
    candidate.status === 404 ||
    candidate.code === 'PGRST205' ||
    candidate.code === '42P01' ||
    message.includes('meal_correction_signals') ||
    message.includes('relation') ||
    message.includes('schema cache')
  );
};

const markRemoteCorrectionSignalsUnavailable = (error: unknown) => {
  shouldBypassRemoteCorrectionSignals = true;
  console.warn('meal_correction_signals table ontbreekt in Supabase; lokale fallback wordt gebruikt totdat het schema is bijgewerkt.', error);
};

export const mealCorrectionRepository = {
  async listSignals(userId: string, limit = 25) {
    if (isSupabaseConfigured && supabase && !shouldUseMockCorrectionStorage(userId) && !shouldBypassRemoteCorrectionSignals) {
      const { data, error } = await supabase
        .from('meal_correction_signals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (isMissingCorrectionSignalsTableError(error)) {
          markRemoteCorrectionSignalsUnavailable(error);
          return (await getStoredSignals(userId)).slice(0, limit);
        }

        throw error;
      }

      return (data ?? []) as MealCorrectionSignalRecord[];
    }

    return (await getStoredSignals(userId))
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, limit);
  },

  async insertSignal(signal: MealCorrectionSignalRecord) {
    const { user_id: userId } = signal;

    if (isSupabaseConfigured && supabase && !shouldUseMockCorrectionStorage(userId) && !shouldBypassRemoteCorrectionSignals) {
      const { data, error } = await supabase.from('meal_correction_signals').insert(signal).select('*').single();

      if (error) {
        if (isMissingCorrectionSignalsTableError(error)) {
          markRemoteCorrectionSignalsUnavailable(error);
        } else {
          throw error;
        }
      } else {
        return data as MealCorrectionSignalRecord;
      }
    }

    const current = await getStoredSignals(userId);
    const next = [signal, ...current].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
    await AsyncStorage.setItem(correctionSignalsKey(userId), JSON.stringify(next));
    return signal;
  },

  async clearLocalSignals(userId: string) {
    await AsyncStorage.removeItem(correctionSignalsKey(userId));
  },

  resetRemoteBypass() {
    shouldBypassRemoteCorrectionSignals = false;
  },
};
