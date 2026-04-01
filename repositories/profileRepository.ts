import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedProfile } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/profile';

const profileKey = (userId: string) => `nutrivoice:mock-profile:${userId}`;
const shouldUseMockProfileStorage = (userId: string) => userId.startsWith('mock_') || userId.startsWith('guest_');

const withProfileDefaults = (profile: UserProfile, defaults?: Partial<UserProfile>) => ({
  ...profile,
  has_received_demo: profile.has_received_demo ?? defaults?.has_received_demo ?? true,
  notifications_enabled: profile.notifications_enabled ?? defaults?.notifications_enabled ?? false,
  meal_reminders_enabled: profile.meal_reminders_enabled ?? defaults?.meal_reminders_enabled ?? true,
  consistency_reminders_enabled: profile.consistency_reminders_enabled ?? defaults?.consistency_reminders_enabled ?? true,
  progress_nudges_enabled: profile.progress_nudges_enabled ?? defaults?.progress_nudges_enabled ?? true,
  notification_permission_status: profile.notification_permission_status ?? defaults?.notification_permission_status ?? 'undetermined',
});

const ensureMockProfile = async (userId: string, email?: string | null) => {
  const raw = await AsyncStorage.getItem(profileKey(userId));
  if (raw) {
    const parsed = withProfileDefaults(JSON.parse(raw) as UserProfile);
    await AsyncStorage.setItem(profileKey(userId), JSON.stringify(parsed));
    return parsed;
  }

  const seeded = withProfileDefaults(buildSeedProfile(userId, email), { has_received_demo: false });
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
        return withProfileDefaults(data as UserProfile);
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
        has_received_demo: false,
        notifications_enabled: false,
        meal_reminders_enabled: true,
        consistency_reminders_enabled: true,
        progress_nudges_enabled: true,
        notification_permission_status: 'undetermined',
        created_at: now,
        updated_at: now,
      };

      const { data: inserted, error: insertError } = await supabase.from('profiles').upsert(createdProfile).select().single();
      if (insertError) {
        throw insertError;
      }
      return withProfileDefaults(inserted as UserProfile, { has_received_demo: false });
    }

    return ensureMockProfile(userId, email);
  },

  async upsertProfile(profile: UserProfile) {
    const normalizedProfile = withProfileDefaults(profile);

    if (isSupabaseConfigured && supabase && !shouldUseMockProfileStorage(profile.id)) {
      const { data, error } = await supabase.from('profiles').upsert(normalizedProfile).select().single();
      if (error) {
        throw error;
      }
      return withProfileDefaults(data as UserProfile);
    }

    await AsyncStorage.setItem(profileKey(profile.id), JSON.stringify(normalizedProfile));
    return normalizedProfile;
  },

  async clearLocalProfile(userId: string) {
    await AsyncStorage.removeItem(profileKey(userId));
  },
};
