import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedProfile } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/profile';

const profileKey = (userId: string) => `nutrivoice:mock-profile:${userId}`;

const ensureMockProfile = async (userId: string, email?: string | null) => {
  const raw = await AsyncStorage.getItem(profileKey(userId));
  if (raw) {
    return JSON.parse(raw) as UserProfile;
  }

  const seeded = buildSeedProfile(userId, email);
  await AsyncStorage.setItem(profileKey(userId), JSON.stringify(seeded));
  return seeded;
};

export const profileRepository = {
  async getProfile(userId: string, email?: string | null) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        return data as UserProfile;
      }
    }

    return ensureMockProfile(userId, email);
  },

  async upsertProfile(profile: UserProfile) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
      if (error) {
        throw error;
      }
      return data as UserProfile;
    }

    await AsyncStorage.setItem(profileKey(profile.id), JSON.stringify(profile));
    return profile;
  },
};
