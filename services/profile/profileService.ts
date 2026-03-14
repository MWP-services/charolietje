import { profileRepository } from '@/repositories/profileRepository';
import type { UserProfile } from '@/types/profile';

export const profileService = {
  getProfile: profileRepository.getProfile,
  saveProfile: profileRepository.upsertProfile,
  async updateProfile(profile: UserProfile, updates: Partial<UserProfile>) {
    const nextProfile = {
      ...profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return profileRepository.upsertProfile(nextProfile);
  },
};
