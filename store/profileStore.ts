import { create } from 'zustand';

import { profileService } from '@/services/profile/profileService';
import type { UserProfile } from '@/types/profile';

type ProfileState = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: (userId: string, email?: string | null) => Promise<UserProfile>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  async loadProfile(userId, email) {
    set({ isLoading: true, error: null });
    try {
      const profile = await profileService.getProfile(userId, email);
      set({ profile, isLoading: false });
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load profile';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  async updateProfile(updates) {
    const current = get().profile;
    if (!current) {
      throw new Error('No profile loaded');
    }

    set({ isLoading: true, error: null });
    try {
      const next = await profileService.updateProfile(current, updates);
      set({ profile: next, isLoading: false });
      return next;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update profile';
      set({ isLoading: false, error: message });
      throw error;
    }
  },
  clearProfile() {
    set({ profile: null, error: null, isLoading: false });
  },
}));
