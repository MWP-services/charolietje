import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const createMemoryStorage = (): SupportedStorage => {
  const store = new Map<string, string>();

  return {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      store.set(key, value);
    },
    removeItem: async (key) => {
      store.delete(key);
    },
  };
};

const createWebStorage = (): SupportedStorage => ({
  getItem: async (key) => {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  },
  setItem: async (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(key);
  },
});

const authStorage =
  Platform.OS === 'web'
    ? createWebStorage()
    : typeof window === 'undefined'
      ? createMemoryStorage()
      : AsyncStorage;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const authBackendMode = isSupabaseConfigured ? 'supabase' : 'mock';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
