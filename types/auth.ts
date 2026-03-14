export type AppSession = {
  userId: string;
  email: string | null;
  provider: 'supabase' | 'mock';
};
