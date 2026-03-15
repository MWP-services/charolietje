import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildSeedProfile } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { profileRepository } from '@/repositories/profileRepository';
import type { AppSession } from '@/types/auth';

const mockSessionKey = 'nutrivoice:mock-session';
const guestSessionId = 'guest_local';

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

const getPersistedLocalSession = async () => {
  const raw = await AsyncStorage.getItem(mockSessionKey);
  return raw ? (JSON.parse(raw) as AppSession) : null;
};

export const authService = {
  async getSession() {
    const localSession = await getPersistedLocalSession();
    if (localSession && localSession.provider !== 'supabase') {
      return localSession;
    }

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

    return localSession;
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
        throw new Error('Account aanmaken mislukt');
      }

      await persistMockSession(null);

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
        throw new Error('Inloggen mislukt');
      }

      await persistMockSession(null);

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

  async continueAsGuest() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase sign-out during guest entry failed:', error.message);
      }
    }

    const session = {
      userId: guestSessionId,
      email: null,
      provider: 'guest',
    } satisfies AppSession;

    await persistMockSession(session);
    await profileRepository.upsertProfile({
      ...buildSeedProfile(session.userId, null),
      full_name: 'Gast',
      email: undefined,
      has_completed_onboarding: true,
    });

    return session;
  },

  async signOut() {
    await persistMockSession(null);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    }
  },

  onAuthStateChange(callback: (session: AppSession | null) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const localSession = await getPersistedLocalSession();
        if (localSession && localSession.provider !== 'supabase') {
          callback(localSession);
          return;
        }

        callback(
          session
            ? {
                userId: session.user.id,
                email: session.user.email ?? null,
                provider: 'supabase',
              }
            : null,
        );
      })();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  },
};
