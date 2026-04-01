import { mealRepository } from '@/repositories/mealRepository';
import { profileService } from '@/services/profile/profileService';
import type { MealWithItems } from '@/types/meal';
import type { UserProfile } from '@/types/profile';

export const demoService = {
  async initializeForUser(profile: UserProfile, existingMeals: MealWithItems[]) {
    if (profile.has_received_demo) {
      return { profile, mealsSeeded: false };
    }

    if (existingMeals.length > 0) {
      const nextProfile = await profileService.updateProfile(profile, { has_received_demo: true });
      return { profile: nextProfile, mealsSeeded: false };
    }

    await mealRepository.seedDemoMeals(profile.id);
    const nextProfile = await profileService.updateProfile(profile, { has_received_demo: true });
    return { profile: nextProfile, mealsSeeded: true };
  },
};
