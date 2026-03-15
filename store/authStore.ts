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
  continueAsGuest: () => Promise<AppSession>;
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
        error: error instanceof Error ? error.message : 'Sessie herstellen mislukt',
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
      const message = error instanceof Error ? error.message : 'Inloggen mislukt';
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
      const message = error instanceof Error ? error.message : 'Account aanmaken mislukt';
      set({ error: message });
      throw error;
    }
  },
  async continueAsGuest() {
    try {
      const session = await authService.continueAsGuest();
      set({ session, error: null });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gastmodus starten mislukt';
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
