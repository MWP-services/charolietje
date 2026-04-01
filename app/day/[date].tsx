import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { FadeInView } from '@/components/common/FadeInView';
import { NutritionSummaryCard } from '@/components/common/NutritionSummaryCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { MealCard } from '@/components/dashboard/MealCard';
import { colors } from '@/constants/colors';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useMeals } from '@/hooks/useMeals';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import { formatLongDate } from '@/utils/date';
import { calculateDayTotals, calculateProgress } from '@/utils/nutrition';

export default function DayDetailScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const isMealsLoading = useMealStore((state) => state.isLoading);
  const meals = useMeals(date);
  const deleteMeal = useMealStore((state) => state.deleteMeal);
  const { isRefreshing, refresh } = useAppDataRefresh();

  if (!date) {
    return (
      <ScreenContainer>
        <AppHeader showBackButton subtitle="We konden deze dag niet laden." title="Dag niet gevonden" />
        <EmptyState description="Open een dag vanuit je historie of dashboard om de totalen en maaltijden te bekijken." title="Geen geldige datum" />
        <PrimaryButton label="Naar historie" onPress={() => router.replace('/(tabs)/history')} />
      </ScreenContainer>
    );
  }

  const totals = calculateDayTotals(date, meals);
  const calorieProgress = calculateProgress(totals.calories, profile?.calorie_target ?? null);
  const proteinProgress = calculateProgress(totals.protein, profile?.protein_target ?? null);

  return (
    <ScreenContainer loading={isMealsLoading && !meals.length} loadingLabel="Dagdetails worden geladen..." onRefresh={refresh} refreshing={isRefreshing}>
      <AppHeader showBackButton subtitle="Dagtotalen en details van je maaltijden" title={formatLongDate(date)} />
      <FadeInView delay={20}>
        <NutritionSummaryCard subtitle="Je belangrijkste cijfers van deze dag in een oogopslag." title="Dagoverzicht" totals={totals}>
          <Text style={{ fontFamily: 'Manrope_600SemiBold', color: colors.textSecondary }}>
            Doelvoortgang: {calorieProgress}% calorieen • {proteinProgress}% eiwit
          </Text>
        </NutritionSummaryCard>
      </FadeInView>

      <SectionHeader subtitle="Tik op een maaltijd voor details of om te bewerken." title="Maaltijden" />
      {meals.length ? (
        <View style={{ gap: 14 }}>
          {meals.map((meal, index) => (
            <FadeInView delay={80 + index * 30} key={meal.id}>
              <View style={{ gap: 10 }}>
                <MealCard meal={meal} onPress={() => router.push(`/meal/${meal.id}`)} />
                <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 6 }}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/meal/edit/[id]',
                        params: { id: meal.id },
                      })
                    }>
                    <Text style={{ fontFamily: 'Manrope_700Bold' }}>Maaltijd bewerken</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Maaltijd verwijderen', 'Deze maaltijd van de geselecteerde dag verwijderen?', [
                        { text: 'Annuleren', style: 'cancel' },
                        {
                          text: 'Verwijderen',
                          style: 'destructive',
                          onPress: async () => {
                            if (!session) {
                              return;
                            }

                            try {
                              await deleteMeal(session.userId, meal.id);
                            } catch (error) {
                              Alert.alert('Verwijderen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
                            }
                          },
                        },
                      ])
                    }>
                    <Text style={{ color: '#E85D75', fontFamily: 'Manrope_700Bold' }}>Maaltijd verwijderen</Text>
                  </Pressable>
                </View>
              </View>
            </FadeInView>
          ))}
        </View>
      ) : (
        <>
          <EmptyState description="Er zijn nog geen opgeslagen maaltijden op deze dag. Voeg een nieuwe maaltijd toe of kies een andere dag in je historie." title="Geen maaltijden op deze dag" />
          <PrimaryButton label="Nieuwe maaltijd loggen" onPress={() => router.push('/meal/log?mode=typed')} />
          <SecondaryButton label="Terug naar historie" onPress={() => router.replace('/(tabs)/history')} />
        </>
      )}
    </ScreenContainer>
  );
}
