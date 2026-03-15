import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Text } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { FadeInView } from '@/components/common/FadeInView';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { NutritionRow } from '@/components/meal/NutritionRow';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { formatDisplayDate } from '@/utils/date';
import { formatMealType } from '@/utils/formatting';

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = useMealStore((state) => state.meals.find((entry) => entry.id === id));
  const isMealsLoading = useMealStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);
  const deleteMeal = useMealStore((state) => state.deleteMeal);
  const { isRefreshing, refresh } = useAppDataRefresh();

  if (!meal || !session) {
    return (
      <ScreenContainer loading={isMealsLoading} loadingLabel="Maaltijd wordt geladen..." onRefresh={refresh} refreshing={isRefreshing}>
        <AppHeader showBackButton subtitle="Deze maaltijd is niet meer beschikbaar of kon niet worden geladen." title="Maaltijd niet gevonden" />
        <EmptyState description="Ga terug naar je dashboard of historie om een andere maaltijd te openen." title="Geen maaltijd gevonden" />
        <PrimaryButton label="Naar dashboard" onPress={() => router.replace('/(tabs)')} />
        <SecondaryButton label="Open historie" onPress={() => router.replace('/(tabs)/history')} />
      </ScreenContainer>
    );
  }

  const onDelete = () => {
    Alert.alert('Maaltijd verwijderen', 'Weet je zeker dat je deze maaltijd wilt verwijderen?', [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Verwijderen',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal(session.userId, meal.id);
            router.replace('/(tabs)');
          } catch (error) {
            Alert.alert('Verwijderen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer loading={isMealsLoading && !meal} loadingLabel="Maaltijd wordt geladen..." onRefresh={refresh} refreshing={isRefreshing}>
      <AppHeader showBackButton subtitle={formatDisplayDate(meal.date)} title={formatMealType(meal.meal_type)} />
      <FadeInView delay={20}>
        <Card style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Originele transcriptie</Text>
          <Text style={{ fontFamily: 'Manrope_500Medium', lineHeight: 24 }}>{meal.original_text}</Text>
        </Card>
      </FadeInView>
      <FadeInView delay={60}>
        <Card>
          {meal.items.map((item) => (
            <NutritionRow item={item} key={item.id} />
          ))}
        </Card>
      </FadeInView>
      <FadeInView delay={100}>
        <Card style={{ gap: 8 }}>
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Voedingsverdeling</Text>
          <Text style={{ fontFamily: 'Manrope_500Medium' }}>
            {Math.round(meal.total_calories)} kcal - {Math.round(meal.total_protein)}g eiwit - {Math.round(meal.total_carbs)}g koolhydraten - {Math.round(meal.total_fat)}g vet
          </Text>
          <Text style={{ fontFamily: 'Manrope_500Medium' }}>
            Vezels {Math.round(meal.total_fiber)}g - Suiker {Math.round(meal.total_sugar)}g - Natrium {Math.round(meal.total_sodium)}mg
          </Text>
        </Card>
      </FadeInView>
      <PrimaryButton label="Maaltijd bewerken" onPress={() => router.push(`/meal/edit/${meal.id}`)} />
      <SecondaryButton label="Maaltijd verwijderen" onPress={onDelete} />
    </ScreenContainer>
  );
}
