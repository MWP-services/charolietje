import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

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
import { NutritionInputs } from '@/components/meal/NutritionInputs';
import { colors } from '@/constants/colors';
import { useMeals } from '@/hooks/useMeals';
import { aiService } from '@/services/ai/aiService';
import { nutritionService } from '@/services/nutrition/nutritionService';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import type { MealItem, MealType } from '@/types/meal';
import type { NutrientKey } from '@/types/nutrition';
import { createId, createUuid } from '@/utils/id';
import { calculateMealTotals, emptyOptionalNutrients, getMissingNutritionLabels, hasCompleteNutrition, scaleItemNutritionToQuantity, toMealTotalsRecord } from '@/utils/nutrition';

export default function EditMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meals = useMeals();
  const meal = meals.find((entry) => entry.id === id);
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const updateMeal = useMealStore((state) => state.updateMeal);
  const consumePendingScannedItem = useMealStore((state) => state.consumePendingScannedItem);
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

  const updateItemPortion = (itemId: string, nextQuantity: number, nextUnit?: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    updateItem(itemId, scaleItemNutritionToQuantity(item, nextQuantity, nextUnit ?? item.unit));
  };

  const updateItemNutrient = (itemId: string, key: NutrientKey, value: number | null) => {
    updateItem(itemId, {
      [key]: value,
      nutritionSource: 'manual',
    } as Partial<MealItem>);
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
        ...emptyOptionalNutrients(),
        nutritionSource: 'unresolved',
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

  const openBarcodeScanner = (itemId: string) => {
    if (!profile?.is_premium) {
      router.push('/premium/activate');
      return;
    }

    router.push({
      pathname: '/meal/barcode-scan',
      params: { targetKey: `edit:${meal.id}:${itemId}` },
    });
  };

  useFocusEffect(
    useCallback(() => {
      for (const item of items) {
        const scannedItem = consumePendingScannedItem(`edit:${meal.id}:${item.id}`);
        if (!scannedItem) {
          continue;
        }

        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  name: scannedItem.name,
                  quantity: scannedItem.quantity,
                  unit: scannedItem.unit,
                  calories: scannedItem.calories,
                  protein: scannedItem.protein,
                  carbs: scannedItem.carbs,
                  fat: scannedItem.fat,
                  fiber: scannedItem.fiber,
                  sugar: scannedItem.sugar,
                  sodium: scannedItem.sodium,
                  confidence: scannedItem.confidence,
                  nutritionSource: scannedItem.nutritionSource,
                }
              : entry,
          ),
        );
        setError(null);
        break;
      }
    }, [consumePendingScannedItem, items, meal.id]),
  );

  const reparseFromText = async () => {
    if (!text.trim()) {
      setError('Voer eerst een maaltijdomschrijving in voordat je opnieuw analyseert.');
      return;
    }

    try {
      setError(null);
      setIsReparsing(true);
      const analysis = await aiService.analyzeText(text, session?.userId);
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
      const itemsNeedingLookup = items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !hasCompleteNutrition(item));

      let nextItems = items;

      if (itemsNeedingLookup.length) {
        const enriched = await nutritionService.getNutritionForItems(
          itemsNeedingLookup.map(({ item }) => ({
            name: item.name.trim().toLowerCase(),
            quantity: item.quantity,
            unit: item.unit,
            confidence: item.confidence,
          })),
          session?.userId,
        );

        nextItems = items.map((item) => ({ ...item }));
        itemsNeedingLookup.forEach(({ index, item }, lookupIndex) => {
          const resolved = enriched[lookupIndex];
          nextItems[index] = {
            ...nextItems[index],
            unit: resolved.unit,
            calories: item.calories ?? resolved.calories,
            protein: item.protein ?? resolved.protein,
            carbs: item.carbs ?? resolved.carbs,
            fat: item.fat ?? resolved.fat,
            fiber: item.fiber ?? resolved.fiber,
            sugar: item.sugar ?? resolved.sugar,
            sodium: item.sodium ?? resolved.sodium,
            nutritionSource: item.nutritionSource === 'manual' ? 'manual' : resolved.nutritionSource,
          };
        });
      }

      const unresolvedItem = nextItems.find((item) => !hasCompleteNutrition(item));
      if (unresolvedItem) {
        setError(`Vul eerst alle ontbrekende voedingswaarden in voor ${unresolvedItem.name}. Ontbrekend: ${getMissingNutritionLabels(unresolvedItem).join(', ')}.`);
        return;
      }

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
                    onChangeText={(value) => updateItemPortion(item.id, Number(value) || 0)}
                    value={String(item.quantity)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField autoCapitalize="none" label="Eenheid" onChangeText={(value) => updateItemPortion(item.id, item.quantity, value)} value={item.unit} />
                </View>
              </View>
              <SecondaryButton
                label={profile?.is_premium ? 'Barcode scannen voor dit item' : 'Barcode scannen is premium'}
                onPress={() => openBarcodeScanner(item.id)}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
                {hasCompleteNutrition(item)
                  ? `Voorbeeld: ${Math.round(item.calories ?? 0)} kcal - ${Math.round(item.protein ?? 0)}g eiwit - ${Math.round(item.carbs ?? 0)}g koolhydraten - ${Math.round(item.fat ?? 0)}g vet`
                  : `Voedingswaarde ontbreekt nog: ${getMissingNutritionLabels(item).join(', ')}`}
              </Text>
              <NutritionInputs onChange={(key, value) => updateItemNutrient(item.id, key, value)} values={item} />
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
          {items.some((item) => !hasCompleteNutrition(item)) ? (
            <InlineMessage
              description="De preview telt alleen de bekende waardes mee totdat je de ontbrekende velden hebt ingevuld."
              title="Preview is nog niet volledig"
              tone="info"
            />
          ) : null}
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
