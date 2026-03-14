import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { NutritionRow } from '@/components/meal/NutritionRow';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { formatDisplayDate } from '@/utils/date';
import { formatMealType } from '@/utils/formatting';

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = useMealStore((state) => state.meals.find((entry) => entry.id === id));
  const session = useAuthStore((state) => state.session);
  const deleteMeal = useMealStore((state) => state.deleteMeal);

  if (!meal || !session) {
    return null;
  }

  const onDelete = () => {
    Alert.alert('Delete meal', 'Are you sure you want to remove this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(session.userId, meal.id);
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton subtitle={formatDisplayDate(meal.date)} title={formatMealType(meal.meal_type)} />
      <Card style={{ gap: 12 }}>
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Original transcription</Text>
        <Text style={{ fontFamily: 'Manrope_500Medium', lineHeight: 24 }}>{meal.original_text}</Text>
      </Card>
      <Card>
        {meal.items.map((item) => (
          <NutritionRow item={item} key={item.id} />
        ))}
      </Card>
      <Card style={{ gap: 8 }}>
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Nutrition breakdown</Text>
        <Text style={{ fontFamily: 'Manrope_500Medium' }}>
          {Math.round(meal.total_calories)} kcal • {Math.round(meal.total_protein)}g protein • {Math.round(meal.total_carbs)}g carbs • {Math.round(meal.total_fat)}g fat
        </Text>
        <Text style={{ fontFamily: 'Manrope_500Medium' }}>
          Fiber {Math.round(meal.total_fiber)}g • Sugar {Math.round(meal.total_sugar)}g • Sodium {Math.round(meal.total_sodium)}mg
        </Text>
      </Card>
      <PrimaryButton label="Edit meal" onPress={() => router.push(`/meal/edit/${meal.id}`)} />
      <SecondaryButton label="Delete meal" onPress={onDelete} />
    </ScreenContainer>
  );
}
