import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedProfile } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { profileRepository } from '@/repositories/profileRepository';
import type { AppSession } from '@/types/auth';

const mockSessionKey = 'nutrivoice:mock-session';

type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
};

type SignInInput = {
  email: string;
  password: string;
};

const persistMockSession = async (session: AppSession | null) => {
  if (!session) {
    await AsyncStorage.removeItem(mockSessionKey);
    return;
  }

  await AsyncStorage.setItem(mockSessionKey, JSON.stringify(session));
};

export const authService = {
  async getSession() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      const session = data.session;
      if (!session) {
        return null;
      }

      return {
        userId: session.user.id,
        email: session.user.email ?? null,
        provider: 'supabase',
      } satisfies AppSession;
    }

    const raw = await AsyncStorage.getItem(mockSessionKey);
    return raw ? (JSON.parse(raw) as AppSession) : null;
  },

  async signUp({ fullName, email, password }: SignUpInput) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Unable to create account');
      }

      await profileRepository.upsertProfile({
        ...buildSeedProfile(data.user.id, email),
        full_name: fullName,
        email,
        is_premium: false,
        has_completed_onboarding: false,
      });

      return {
        userId: data.user.id,
        email,
        provider: 'supabase',
      } satisfies AppSession;
    }

    const session = {
      userId: `mock_${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      email,
      provider: 'mock',
    } satisfies AppSession;
    await persistMockSession(session);
    await profileRepository.upsertProfile({
      ...buildSeedProfile(session.userId, email),
      full_name: fullName,
      email,
      is_premium: false,
      has_completed_onboarding: false,
    });
    return session;
  },

  async signIn({ email, password }: SignInInput) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Unable to sign in');
      }

      return {
        userId: data.user.id,
        email: data.user.email ?? email,
        provider: 'supabase',
      } satisfies AppSession;
    }

    const session = {
      userId: `mock_${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      email,
      provider: 'mock',
    } satisfies AppSession;
    await persistMockSession(session);
    await profileRepository.getProfile(session.userId, email);
    return session;
  },

  async signOut() {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      return;
    }

    await persistMockSession(null);
  },

  onAuthStateChange(callback: (session: AppSession | null) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(
        session
          ? {
              userId: session.user.id,
              email: session.user.email ?? null,
              provider: 'supabase',
            }
          : null,
      );
    });

    return () => {
      data.subscription.unsubscribe();
    };
  },
};
