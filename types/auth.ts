export type AppSession = {
  userId: string;
  email: string | null;
  provider: 'supabase' | 'mock' | 'guest';
};

export type AuthSignUpResult = {
  session: AppSession | null;
  email: string;
  requiresEmailVerification: boolean;
};

export type AuthRedirectResult =
  | {
      status: 'email_verified';
      session: AppSession | null;
    }
  | {
      status: 'password_recovery';
      session: AppSession | null;
    }
  | {
      status: 'session_restored';
      session: AppSession | null;
    }
  | {
      status: 'ignored';
      session: null;
    };
