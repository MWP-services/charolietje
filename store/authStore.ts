import { create } from 'zustand';

import { authService } from '@/services/auth/authService';
import type { AppSession } from '@/types/auth';

type AuthState = {
  session: AppSession | null;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<AppSession>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<AppSession>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

let unsubscribeAuth: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitializing: true,
  error: null,
  async initialize() {
    try {
      const session = await authService.getSession();
      set({ session, isInitializing: false });

      if (!unsubscribeAuth) {
        unsubscribeAuth = authService.onAuthStateChange((nextSession) => {
          set({ session: nextSession, isInitializing: false });
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unable to restore session',
        isInitializing: false,
      });
    }
  },
  async signIn(input) {
    try {
      const session = await authService.signIn(input);
      set({ session, error: null });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      set({ error: message });
      throw error;
    }
  },
  async signUp(input) {
    try {
      const session = await authService.signUp(input);
      set({ session, error: null });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account';
      set({ error: message });
      throw error;
    }
  },
  async signOut() {
    await authService.signOut();
    set({ session: null, error: null });
  },
  clearError() {
    set({ error: null });
  },
}));
