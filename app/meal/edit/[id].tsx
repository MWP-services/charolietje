import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { nutritionService } from '@/services/nutrition/nutritionService';
import { useMealStore } from '@/store/mealStore';
import type { MealItem, MealType } from '@/types/meal';
import { createId } from '@/utils/id';
import { calculateMealTotals, toMealTotalsRecord } from '@/utils/nutrition';

export default function EditMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = useMealStore((state) => state.meals.find((entry) => entry.id === id));
  const updateMeal = useMealStore((state) => state.updateMeal);
  const [text, setText] = useState(meal?.original_text ?? '');
  const [items, setItems] = useState<MealItem[]>(meal?.items ?? []);
  const [isSaving, setIsSaving] = useState(false);

  const previewTotals = useMemo(() => calculateMealTotals(items), [items]);

  if (!meal) {
    return null;
  }

  const updateItem = (itemId: string, updates: Partial<MealItem>) => {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: createId('item'),
        meal_id: meal.id,
        name: '',
        quantity: 1,
        unit: 'serving',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      },
    ]);
  };

  const onSave = async () => {
    if (!items.length || items.some((item) => !item.name.trim())) {
      Alert.alert('Check items', 'Every meal item needs a name before saving.');
      return;
    }

    try {
      setIsSaving(true);
      const enriched = await nutritionService.getNutritionForItems(
        items.map((item) => ({
          name: item.name.trim().toLowerCase(),
          quantity: item.quantity,
          unit: item.unit,
          confidence: item.confidence,
        })),
      );
      const nextItems = enriched.map((item, index) => ({
        ...items[index],
        ...item,
      }));
      const totals = calculateMealTotals(nextItems);

      await updateMeal({
        ...meal,
        meal_type: (meal.meal_type || 'unknown') as MealType,
        original_text: text,
        transcription_text: text,
        items: nextItems,
        ...toMealTotalsRecord(totals),
      });
      router.replace(`/meal/${meal.id}`);
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton subtitle="Edit transcription or adjust items manually." title="Edit meal" />
      <FormField label="Original text" multiline onChangeText={setText} value={text} />
      <Card style={{ gap: 16 }}>
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Meal items</Text>
        {items.map((item) => (
          <View key={item.id} style={{ gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#D9E8E1' }}>
            <FormField label="Name" onChangeText={(value) => updateItem(item.id, { name: value })} value={item.name} />
            <FormField
              keyboardType="numeric"
              label="Quantity"
              onChangeText={(value) => updateItem(item.id, { quantity: Number(value) || 0 })}
              value={String(item.quantity)}
            />
            <FormField label="Unit" onChangeText={(value) => updateItem(item.id, { unit: value })} value={item.unit} />
            <SecondaryButton label="Remove item" onPress={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} />
          </View>
        ))}
        <SecondaryButton label="Add item" onPress={addItem} />
      </Card>
      <Card style={{ gap: 8 }}>
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Recalculated preview</Text>
        <Text style={{ fontFamily: 'Manrope_500Medium' }}>
          {Math.round(previewTotals.calories)} kcal • {Math.round(previewTotals.protein)}g protein • {Math.round(previewTotals.carbs)}g carbs • {Math.round(previewTotals.fat)}g fat
        </Text>
      </Card>
      <PrimaryButton label="Save changes" loading={isSaving} onPress={onSave} />
    </ScreenContainer>
  );
}
