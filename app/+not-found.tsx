import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ScreenContainer contentStyle={{ justifyContent: 'center' }} scroll={false}>
      <EmptyState
        description="The page you tried to open doesn’t exist anymore, but your nutrition data is safe."
        title="Screen not found"
      />
      <PrimaryButton label="Go to dashboard" onPress={() => router.replace('/(tabs)')} />
    </ScreenContainer>
  );
}
