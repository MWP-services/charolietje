import { useState } from 'react';
import { Alert } from 'react-native';

import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';

export const useAppDataRefresh = () => {
  const session = useAuthStore((state) => state.session);
  const loadMeals = useMealStore((state) => state.loadMeals);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    if (!session) {
      return;
    }

    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([loadProfile(session.userId, session.email), loadMeals(session.userId)]);
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => (result.reason instanceof Error ? result.reason.message : 'Onbekende fout'));

      if (errors.length) {
        throw new Error(errors[0]);
      }
    } catch (error) {
      Alert.alert('Verversen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    isRefreshing,
    refresh,
  };
};
