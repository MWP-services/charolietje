import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { isSupabaseConfigured } from '@/lib/supabase';
import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { MealTypeSelector } from '@/components/meal/MealTypeSelector';
import { colors } from '@/constants/colors';
import { useMeals } from '@/hooks/useMeals';
import { aiService } from '@/services/ai/aiService';
import { nutritionService } from '@/services/nutrition/nutritionService';
import { useMealStore } from '@/store/mealStore';
import type { MealItem, MealType } from '@/types/meal';
import { createId, createUuid } from '@/utils/id';
import { calculateMealTotals, toMealTotalsRecord } from '@/utils/nutrition';

export default function EditMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meals = useMeals();
  const meal = meals.find((entry) => entry.id === id);
  const updateMeal = useMealStore((state) => state.updateMeal);
  const [text, setText] = useState(meal?.original_text ?? '');
  const [mealType, setMealType] = useState<MealType>(meal?.meal_type ?? 'unknown');
  const [items, setItems] = useState<MealItem[]>(meal?.items ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        id: isSupabaseConfigured ? createUuid() : createId('item'),
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

  const duplicateItem = (item: MealItem) => {
    setItems((current) => [
      ...current,
      {
        ...item,
        id: isSupabaseConfigured ? createUuid() : createId('item'),
      },
    ]);
  };

  const removeItem = (itemId: string) => {
    setItems((current) => (current.length === 1 ? current : current.filter((entry) => entry.id !== itemId)));
  };

  const reparseFromText = async () => {
    if (!text.trim()) {
      setError('Voer eerst een maaltijdomschrijving in voordat je opnieuw analyseert.');
      return;
    }

    try {
      setError(null);
      setIsReparsing(true);
      const analysis = await aiService.analyzeText(text);
      setMealType(analysis.mealType);
      setItems(
        analysis.items.map((item) => ({
          ...item,
          id: isSupabaseConfigured ? createUuid() : createId('item'),
          meal_id: meal.id,
        })),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'De maaltijdtekst kon niet opnieuw worden geparseerd.');
    } finally {
      setIsReparsing(false);
    }
  };

  const onSave = async () => {
    if (!text.trim()) {
      setError('Originele tekst mag niet leeg zijn.');
      return;
    }

    if (!items.length || items.some((item) => !item.name.trim())) {
      setError('Elk maaltijditem moet een naam hebben voordat je opslaat.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
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
        meal_type: mealType,
        original_text: text,
        transcription_text: text,
        items: nextItems,
        ...toMealTotalsRecord(totals),
      });
      router.replace(`/meal/${meal.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Probeer het opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton subtitle="Verfijn maaltijdtekst, itemschattingen en maaltijdtype." title="Maaltijd bewerken" />
      {error ? <InlineMessage actionLabel="Sluiten" onActionPress={() => setError(null)} title={error} tone="error" /> : null}

      <FadeInView delay={20}>
        <FormField label="Originele tekst" multiline onChangeText={setText} value={text} />
      </FadeInView>

      <FadeInView delay={60}>
        <Card style={{ gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Maaltijdtype</Text>
          <MealTypeSelector onChange={setMealType} value={mealType} />
          <SecondaryButton label={isReparsing ? 'Opnieuw analyseren...' : 'Opnieuw analyseren op basis van tekst'} onPress={reparseFromText} disabled={isReparsing} />
        </Card>
      </FadeInView>

      <FadeInView delay={100}>
        <Card style={{ gap: 16 }}>
          <Text style={{ color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Maaltijditems</Text>
          {items.map((item, index) => (
            <View key={item.id} style={{ gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>ITEM {index + 1}</Text>
              <FormField autoCapitalize="words" label="Naam" onChangeText={(value) => updateItem(item.id, { name: value })} value={item.name} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    inputMode="decimal"
                    keyboardType="numeric"
                    label="Hoeveelheid"
                    onChangeText={(value) => updateItem(item.id, { quantity: Number(value) || 0 })}
                    value={String(item.quantity)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField autoCapitalize="none" label="Eenheid" onChangeText={(value) => updateItem(item.id, { unit: value })} value={item.unit} />
                </View>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
                Voorbeeld: {Math.round(item.calories)} kcal - {Math.round(item.protein)}g eiwit - {Math.round(item.carbs)}g koolhydraten - {Math.round(item.fat)}g vet
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton label="Item dupliceren" onPress={() => duplicateItem(item)} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton disabled={items.length === 1} label={items.length === 1 ? 'Minstens 1 item nodig' : 'Item verwijderen'} onPress={() => removeItem(item.id)} />
                </View>
              </View>
            </View>
          ))}
          <SecondaryButton label="Item toevoegen" onPress={addItem} />
        </Card>
      </FadeInView>

      <FadeInView delay={140}>
        <Card style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Herberekende preview</Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>
            {Math.round(previewTotals.calories)} kcal - {Math.round(previewTotals.protein)}g eiwit - {Math.round(previewTotals.carbs)}g koolhydraten - {Math.round(previewTotals.fat)}g vet
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>
            Vezels {Math.round(previewTotals.fiber)}g - Suiker {Math.round(previewTotals.sugar)}g - Natrium {Math.round(previewTotals.sodium)}mg
          </Text>
        </Card>
      </FadeInView>

      <PrimaryButton label="Wijzigingen opslaan" loading={isSaving} onPress={onSave} />
    </ScreenContainer>
  );
}
