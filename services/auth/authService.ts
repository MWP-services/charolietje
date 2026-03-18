import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { buildSeedProfile } from '@/constants/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { mealRepository } from '@/repositories/mealRepository';
import { profileRepository } from '@/repositories/profileRepository';
import type { AppSession, AuthRedirectResult, AuthSignUpResult } from '@/types/auth';

const mockSessionKey = 'nutrivoice:mock-session';
const guestSessionId = 'guest_local';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
};

type SignInInput = {
  email: string;
  password: string;
};

type VerificationType = 'email' | 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change';

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

const toAppSession = (session: { user: { id: string; email?: string | null } }): AppSession => ({
  userId: session.user.id,
  email: session.user.email ?? null,
  provider: 'supabase',
});

const buildAuthRedirectUrl = () => Linking.createURL('/auth/callback');
const isLocalOnlySession = (session: AppSession) => session.provider === 'guest' || session.provider === 'mock';

const clearLocalAccountData = async (userId: string) => {
  await Promise.all([profileRepository.clearLocalProfile(userId), mealRepository.clearLocalMeals(userId), persistMockSession(null)]);
};

const normalizeVerificationType = (type: string | null): VerificationType | null => {
  switch (type) {
    case 'signup':
    case 'magiclink':
    case 'email':
    case 'recovery':
    case 'invite':
    case 'email_change':
      return type;
    default:
      return null;
  }
};

const parseAuthUrl = (url: string) => {
  const parsedUrl = new URL(url);
  const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;
  const hashParams = new URLSearchParams(hash);

  const get = (key: string) => parsedUrl.searchParams.get(key) ?? hashParams.get(key);

  return {
    tokenHash: get('token_hash'),
    type: get('type'),
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    errorDescription: get('error_description') ?? get('error'),
  };
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

      return toAppSession(session);
    }

    return localSession;
  },

  async signUp({ fullName, email, password }: SignUpInput): Promise<AuthSignUpResult> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthRedirectUrl(),
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

      const session = data.session ? toAppSession(data.session) : null;
      await persistMockSession(null);

      if (session) {
        await profileRepository.upsertProfile({
          ...buildSeedProfile(data.user.id, email),
          full_name: fullName,
          email,
          is_premium: false,
          has_completed_onboarding: false,
        });
      }

      return {
        session,
        email,
        requiresEmailVerification: !session,
      };
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
    return {
      session,
      email,
      requiresEmailVerification: false,
    };
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
      is_premium: false,
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

  async deleteAccount(session: AppSession) {
    if (isLocalOnlySession(session)) {
      await clearLocalAccountData(session.userId);
      return;
    }

    if (!isSupabaseConfigured || !supabase || !supabaseUrl || !supabaseAnonKey) {
      throw new Error('Account verwijderen is alleen beschikbaar wanneer Supabase correct is ingesteld.');
    }

    const {
      data: { session: currentSession },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    const accessToken = currentSession?.access_token;
    if (!accessToken) {
      throw new Error('Je sessie is verlopen. Log opnieuw in om je account te verwijderen.');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });

    const responseText = await response.text();

    if (!response.ok) {
      let detail = responseText;

      try {
        const parsed = JSON.parse(responseText) as { error?: string; detail?: string };
        detail = parsed.error || parsed.detail || responseText;
      } catch {
        // Ignore invalid JSON and keep the raw response text.
      }

      if (response.status === 401) {
        throw new Error(`Account verwijderen geweigerd (${response.status}). ${detail || 'Log opnieuw in en probeer het nog eens.'}`);
      }

      throw new Error(`Account verwijderen mislukt (${response.status}). ${detail || 'Probeer het opnieuw.'}`);
    }

    await persistMockSession(null);

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw signOutError;
    }
  },

  async resendVerificationEmail(email: string) {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: buildAuthRedirectUrl(),
      },
    });

    if (error) {
      throw error;
    }
  },

  async requestPasswordReset(email: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Wachtwoord resetten is alleen beschikbaar wanneer Supabase is ingesteld.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthRedirectUrl(),
    });

    if (error) {
      throw error;
    }
  },

  async updatePassword(password: string) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Wachtwoord wijzigen is alleen beschikbaar wanneer Supabase is ingesteld.');
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Er is geen geldige sessie om het wachtwoord te wijzigen.');
    }
  },

  async handleAuthRedirect(url: string): Promise<AuthRedirectResult> {
    if (!isSupabaseConfigured || !supabase) {
      return { status: 'ignored', session: null };
    }

    const { tokenHash, type, accessToken, refreshToken, errorDescription } = parseAuthUrl(url);

    if (errorDescription) {
      throw new Error(decodeURIComponent(errorDescription));
    }

    if (accessToken && refreshToken) {
      await persistMockSession(null);
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        throw error;
      }

      return {
        status: type === 'recovery' ? 'password_recovery' : 'session_restored',
        session: data.session ? toAppSession(data.session) : null,
      };
    }

    const normalizedType = normalizeVerificationType(type);

    if (tokenHash && normalizedType) {
      await persistMockSession(null);
      const verifyType = normalizedType === 'signup' || normalizedType === 'magiclink' ? 'email' : normalizedType;
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: verifyType,
      });

      if (error) {
        throw error;
      }

      return {
        status: normalizedType === 'recovery' ? 'password_recovery' : 'email_verified',
        session: data.session ? toAppSession(data.session) : null,
      };
    }

    return { status: 'ignored', session: null };
  },

  onAuthStateChange(callback: (session: AppSession | null) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return () => undefined;
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        const localSession = await getPersistedLocalSession();
        if (!session && localSession && localSession.provider !== 'supabase') {
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
