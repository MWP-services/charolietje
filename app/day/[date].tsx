import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { FadeInView } from '@/components/common/FadeInView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { MealCard } from '@/components/dashboard/MealCard';
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
  const meals = useMealStore((state) => state.meals.filter((meal) => meal.date === date));
  const deleteMeal = useMealStore((state) => state.deleteMeal);

  if (!date) {
    return null;
  }

  const totals = calculateDayTotals(date, meals);
  const calorieProgress = calculateProgress(totals.calories, profile?.calorie_target ?? null);
  const proteinProgress = calculateProgress(totals.protein, profile?.protein_target ?? null);

  return (
    <ScreenContainer>
      <AppHeader showBackButton subtitle="Daily totals and meal log detail" title={formatLongDate(date)} />
      <FadeInView delay={20}>
        <Card style={{ gap: 12 }}>
          <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Total daily nutrients</Text>
          <Text style={{ fontFamily: 'Manrope_500Medium' }}>
            {Math.round(totals.calories)} kcal • {Math.round(totals.protein)}g protein • {Math.round(totals.carbs)}g carbs • {Math.round(totals.fat)}g fat
          </Text>
          <Text style={{ fontFamily: 'Manrope_500Medium' }}>
            Fiber {Math.round(totals.fiber)}g • Sugar {Math.round(totals.sugar)}g • Sodium {Math.round(totals.sodium)}mg
          </Text>
          <Text style={{ fontFamily: 'Manrope_600SemiBold' }}>Goal progress: {calorieProgress}% calories • {proteinProgress}% protein</Text>
        </Card>
      </FadeInView>

      <SectionHeader subtitle="Tap into any meal for detail or editing." title="Meals" />
      {meals.length ? (
        <View style={{ gap: 14 }}>
          {meals.map((meal, index) => (
            <FadeInView delay={80 + index * 30} key={meal.id}>
              <View style={{ gap: 10 }}>
                <MealCard meal={meal} onPress={() => router.push(`/meal/${meal.id}`)} />
                <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 6 }}>
                  <Pressable onPress={() => router.push(`/meal/edit/${meal.id}`)}>
                    <Text style={{ fontFamily: 'Manrope_700Bold' }}>Edit meal</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Delete meal', 'Remove this meal from the selected day?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: async () => {
                            if (session) {
                              await deleteMeal(session.userId, meal.id);
                            }
                          },
                        },
                      ])
                    }>
                    <Text style={{ color: '#E85D75', fontFamily: 'Manrope_700Bold' }}>Delete meal</Text>
                  </Pressable>
                </View>
              </View>
            </FadeInView>
          ))}
        </View>
      ) : (
        <EmptyState description="This day has no saved meals yet." title="No meals on this day" />
      )}
    </ScreenContainer>
  );
}
