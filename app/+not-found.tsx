import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ScreenContainer contentStyle={{ justifyContent: 'center' }} scroll={false}>
      <EmptyState
        description="De pagina die je wilde openen bestaat niet meer, maar je voedingsdata is veilig."
        title="Scherm niet gevonden"
      />
      <PrimaryButton label="Ga naar overzicht" onPress={() => router.replace('/(tabs)')} />
    </ScreenContainer>
  );
}
