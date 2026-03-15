import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedProfile } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/profile';

const profileKey = (userId: string) => `nutrivoice:mock-profile:${userId}`;
const shouldUseMockProfileStorage = (userId: string) => userId.startsWith('mock_') || userId.startsWith('guest_');

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
    if (isSupabaseConfigured && supabase && !shouldUseMockProfileStorage(userId)) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      if (data) {
        return data as UserProfile;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const now = new Date().toISOString();
      const createdProfile: UserProfile = {
        ...buildSeedProfile(userId, email ?? user?.email ?? null),
        id: userId,
        full_name:
          ((typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
            (typeof user?.user_metadata?.name === 'string' && user.user_metadata.name) ||
            email?.split('@')[0] ||
            'NutriVoice gebruiker') as string,
        email: email ?? user?.email ?? undefined,
        is_premium: false,
        has_completed_onboarding: false,
        created_at: now,
        updated_at: now,
      };

      const { data: inserted, error: insertError } = await supabase.from('profiles').upsert(createdProfile).select().single();
      if (insertError) {
        throw insertError;
      }
      return inserted as UserProfile;
    }

    return ensureMockProfile(userId, email);
  },

  async upsertProfile(profile: UserProfile) {
    if (isSupabaseConfigured && supabase && !shouldUseMockProfileStorage(profile.id)) {
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
