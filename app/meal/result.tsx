import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { NutritionInputs } from '@/components/meal/NutritionInputs';
import { NutritionRow } from '@/components/meal/NutritionRow';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { formatMealType } from '@/utils/formatting';
import { getMissingNutritionLabels, hasCompleteNutrition } from '@/utils/nutrition';

export default function MealAnalysisResultScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const draftAnalysis = useMealStore((state) => state.draftAnalysis);
  const saveDraft = useMealStore((state) => state.saveDraft);
  const updateDraftItem = useMealStore((state) => state.updateDraftItem);
  const isSaving = useMealStore((state) => state.isSaving);
  const error = useMealStore((state) => state.error);
  const clearError = useMealStore((state) => state.clearError);

  if (!draftAnalysis || !session) {
    return null;
  }

  const hasIncompleteItems = draftAnalysis.items.some((item) => !hasCompleteNutrition(item));

  const onSave = async () => {
    try {
      const meal = await saveDraft(session.userId);
      Alert.alert('Maaltijd opgeslagen', 'Je totalen in het overzicht zijn bijgewerkt.');
      router.replace(`/meal/${meal.id}`);
    } catch (error) {
      Alert.alert('Opslaan mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton subtitle="Controleer de AI-inschatting voordat je deze aan je dag toevoegt." title="Maaltijdanalyse" />
      {error ? (
        <InlineMessage
          actionLabel="Sluiten"
          description="Je kunt teruggaan om de transcriptie te bewerken of opnieuw opslaan zodra het probleem is opgelost."
          onActionPress={clearError}
          title={error}
          tone="error"
        />
      ) : null}

      <FadeInView delay={20}>
        <Card style={{ gap: 10 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>GEDETECTEERD MAALTIJDTYPE</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'Manrope_800ExtraBold' }}>{formatMealType(draftAnalysis.mealType)}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>{draftAnalysis.originalText}</Text>
        </Card>
      </FadeInView>

      <FadeInView delay={80}>
        <Card>
          {draftAnalysis.items.map((item, index) => (
            <View key={`${item.name}-${item.quantity}-${index}`} style={{ gap: 12 }}>
              <NutritionRow item={item} />
              {!hasCompleteNutrition(item) ? (
                <>
                  <InlineMessage
                    description="We hebben hier geen betrouwbare voedingswaarde voor gevonden. Vul de waardes hieronder zelf in voordat je opslaat."
                    title={`Ontbrekend voor ${item.name}: ${getMissingNutritionLabels(item).join(', ')}`}
                    tone="info"
                  />
                  <NutritionInputs
                    onChange={(key, value) =>
                      updateDraftItem(index, {
                        [key]: value,
                        nutritionSource: 'manual',
                      })
                    }
                    values={item}
                  />
                </>
              ) : null}
            </View>
          ))}
        </Card>
      </FadeInView>

      <FadeInView delay={140}>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Maaltijdtotalen</Text>
          {hasIncompleteItems ? (
            <InlineMessage
              description="De totalen hieronder tellen alleen de bekende waardes mee totdat je de ontbrekende velden hebt ingevuld."
              title="Totalen zijn nog niet volledig"
              tone="info"
            />
          ) : null}
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>
            {Math.round(draftAnalysis.totals.calories)} kcal - {Math.round(draftAnalysis.totals.protein)}g eiwit - {Math.round(draftAnalysis.totals.carbs)}g koolhydraten -{' '}
            {Math.round(draftAnalysis.totals.fat)}g vet
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>
            Vezels {Math.round(draftAnalysis.totals.fiber)}g - Suiker {Math.round(draftAnalysis.totals.sugar)}g - Natrium {Math.round(draftAnalysis.totals.sodium)}mg
          </Text>
        </Card>
      </FadeInView>

      <PrimaryButton
        disabled={hasIncompleteItems}
        label={hasIncompleteItems ? 'Vul eerst ontbrekende waardes in' : 'Maaltijd opslaan'}
        loading={isSaving}
        onPress={onSave}
      />
      <SecondaryButton label="Transcriptie bewerken" onPress={() => router.back()} />
    </ScreenContainer>
  );
}
