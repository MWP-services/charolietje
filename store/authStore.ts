import { create } from 'zustand';

import { authService } from '@/services/auth/authService';
import type { AppSession, AuthRedirectResult, AuthSignUpResult } from '@/types/auth';

type AuthState = {
  session: AppSession | null;
  isInitializing: boolean;
  error: string | null;
  pendingVerificationEmail: string | null;
  isPasswordRecoveryFlow: boolean;
  initialize: () => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<AppSession>;
  signUp: (input: { fullName: string; email: string; password: string }) => Promise<AuthSignUpResult>;
  continueAsGuest: () => Promise<AppSession>;
  resendVerificationEmail: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  handleAuthRedirect: (url: string) => Promise<AuthRedirectResult>;
  setPendingVerificationEmail: (email: string | null) => void;
  setPasswordRecoveryFlow: (active: boolean) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
};

let unsubscribeAuth: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitializing: true,
  error: null,
  pendingVerificationEmail: null,
  isPasswordRecoveryFlow: false,
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
      set({ session, error: null, isPasswordRecoveryFlow: false });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Inloggen mislukt';
      set({ error: message });
      throw error;
    }
  },
  async signUp(input) {
    try {
      const result = await authService.signUp(input);
      set({
        session: result.session,
        error: null,
        pendingVerificationEmail: result.requiresEmailVerification ? result.email : null,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Account aanmaken mislukt';
      set({ error: message });
      throw error;
    }
  },
  async continueAsGuest() {
    try {
      const session = await authService.continueAsGuest();
      set({ session, error: null, isPasswordRecoveryFlow: false, pendingVerificationEmail: null });
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gastmodus starten mislukt';
      set({ error: message });
      throw error;
    }
  },
  async resendVerificationEmail(email) {
    try {
      await authService.resendVerificationEmail(email);
      set({ error: null, pendingVerificationEmail: email });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verificatiemail opnieuw versturen mislukt';
      set({ error: message });
      throw error;
    }
  },
  async requestPasswordReset(email) {
    try {
      await authService.requestPasswordReset(email);
      set({ error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wachtwoord reset aanvragen mislukt';
      set({ error: message });
      throw error;
    }
  },
  async updatePassword(password) {
    try {
      await authService.updatePassword(password);
      set({ error: null, isPasswordRecoveryFlow: false, pendingVerificationEmail: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wachtwoord wijzigen mislukt';
      set({ error: message });
      throw error;
    }
  },
  async handleAuthRedirect(url) {
    try {
      const result = await authService.handleAuthRedirect(url);
      set({
        session: result.session,
        error: null,
        isPasswordRecoveryFlow: result.status === 'password_recovery',
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authenticatielink verwerken mislukt';
      set({ error: message });
      throw error;
    }
  },
  setPendingVerificationEmail(email) {
    set({ pendingVerificationEmail: email });
  },
  setPasswordRecoveryFlow(active) {
    set({ isPasswordRecoveryFlow: active });
  },
  async signOut() {
    await authService.signOut();
    set({ session: null, error: null, pendingVerificationEmail: null, isPasswordRecoveryFlow: false });
  },
  clearError() {
    set({ error: null });
  },
}));
