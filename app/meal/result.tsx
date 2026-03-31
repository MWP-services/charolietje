import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { ClarificationCard } from '@/components/meal/ClarificationCard';
import { NutritionInputs } from '@/components/meal/NutritionInputs';
import { NutritionRow } from '@/components/meal/NutritionRow';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import { formatMealType } from '@/utils/formatting';
import { getMissingNutritionLabels, hasCompleteNutrition, scaleItemNutritionToQuantity } from '@/utils/nutrition';

export default function MealAnalysisResultScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const draftAnalysis = useMealStore((state) => state.draftAnalysis);
  const saveDraft = useMealStore((state) => state.saveDraft);
  const updateDraftItem = useMealStore((state) => state.updateDraftItem);
  const answerDraftClarification = useMealStore((state) => state.answerDraftClarification);
  const skipDraftClarification = useMealStore((state) => state.skipDraftClarification);
  const isAnalyzing = useMealStore((state) => state.isAnalyzing);
  const isSaving = useMealStore((state) => state.isSaving);
  const error = useMealStore((state) => state.error);
  const clearError = useMealStore((state) => state.clearError);
  const [expandedEditors, setExpandedEditors] = useState<number[]>([]);

  if (!draftAnalysis || !session) {
    return null;
  }

  const hasIncompleteItems = draftAnalysis.items.some((item) => !hasCompleteNutrition(item));
  const pendingClarifications = draftAnalysis.clarifications.filter((question) => !question.answered && !question.skipped);
  const activeClarification = pendingClarifications[0] ?? null;

  const toggleEditor = (index: number) => {
    setExpandedEditors((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index]));
  };

  const updatePortion = (index: number, nextQuantity: number, nextUnit?: string) => {
    const item = draftAnalysis.items[index];
    updateDraftItem(index, scaleItemNutritionToQuantity(item, nextQuantity, nextUnit ?? item.unit));
  };

  const openBarcodeScanner = (index: number) => {
    if (!profile?.is_premium) {
      router.push('/premium/activate');
      return;
    }

    router.push({
      pathname: '/meal/barcode-scan',
      params: { draftIndex: String(index) },
    });
  };

  const onSave = async () => {
    try {
      const meal = await saveDraft(session.userId);
      Alert.alert('Maaltijd opgeslagen', 'Je totalen in het overzicht zijn bijgewerkt.');
      router.replace(`/meal/${meal.id}`);
    } catch (error) {
      Alert.alert('Opslaan mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  };

  const onAnswerClarification = async (selectedOptionIds: string[]) => {
    if (!activeClarification) {
      return;
    }

    try {
      await answerDraftClarification(activeClarification.id, selectedOptionIds, session.userId);
    } catch (clarificationError) {
      Alert.alert('Bijwerken mislukt', clarificationError instanceof Error ? clarificationError.message : 'Probeer het opnieuw.');
    }
  };

  const onSkipClarification = async () => {
    if (!activeClarification) {
      return;
    }

    try {
      await skipDraftClarification(activeClarification.id, session.userId);
    } catch (clarificationError) {
      Alert.alert('Overslaan mislukt', clarificationError instanceof Error ? clarificationError.message : 'Probeer het opnieuw.');
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
        {activeClarification ? (
          <ClarificationCard isLoading={isAnalyzing} onConfirm={onAnswerClarification} onSkip={onSkipClarification} question={activeClarification} />
        ) : null}
      </FadeInView>

      {activeClarification ? (
        <FadeInView delay={100}>
          <Card style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>Slimmere inschatting actief</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
              {pendingClarifications.length > 1
                ? `Nog ${pendingClarifications.length} korte vragen over portie of bereiding. Je kunt ze ook overslaan en de standaardinschatting bewaren.`
                : 'Nog 1 korte vraag over portie of bereiding. Je kunt deze ook overslaan en doorgaan met de standaardinschatting.'}
            </Text>
          </Card>
        </FadeInView>
      ) : null}

      <FadeInView delay={120}>
        <Card>
          {draftAnalysis.items.map((item, index) => (
            <View key={`${item.name}-${item.quantity}-${index}`} style={{ gap: 12 }}>
              <NutritionRow item={item} />
              {item.derivedFromClarification ? (
                <InlineMessage
                  description="Dit is een globale extra-inschatting uit je snelle check. We houden het bewust generiek als soort saus of extra toevoeging niet precies bekend is."
                  title={`Extra uit snelle check voor ${item.parentItemName ?? 'je maaltijd'}`}
                  tone="info"
                />
              ) : null}
              {item.needsClarification && item.clarificationQuestion ? (
                <Text style={{ color: colors.warning, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>{item.clarificationQuestion}</Text>
              ) : null}
              {hasCompleteNutrition(item) ? (
                <SecondaryButton
                  label={expandedEditors.includes(index) ? 'Klaar met aanpassen' : 'Portie, barcode of waardes aanpassen'}
                  onPress={() => toggleEditor(index)}
                />
              ) : null}
              {!hasCompleteNutrition(item) ? (
                <>
                  <InlineMessage
                    description="We hebben hier geen betrouwbare voedingswaarde voor gevonden. Vul de waardes hieronder zelf in voordat je opslaat."
                    title={`Ontbrekend voor ${item.name}: ${getMissingNutritionLabels(item).join(', ')}`}
                    tone="info"
                  />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <FormField
                        inputMode="decimal"
                        keyboardType="numeric"
                        label="Hoeveelheid"
                        onChangeText={(value) => updatePortion(index, Number(value) || 0)}
                        value={String(item.quantity)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <FormField autoCapitalize="none" label="Eenheid" onChangeText={(value) => updatePortion(index, item.quantity, value)} value={item.unit} />
                    </View>
                  </View>
                  <SecondaryButton
                    label={profile?.is_premium ? 'Barcode scannen voor dit item' : 'Barcode scannen is premium'}
                    onPress={() => openBarcodeScanner(index)}
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
              ) : expandedEditors.includes(index) ? (
                <>
                  <InlineMessage
                    description="Pas hoeveelheid, barcode of voedingswaardes aan als je verpakking of portie afwijkt van wat de app heeft gevonden."
                    title={`Bewerk voedingswaarde voor ${item.name}`}
                    tone="info"
                  />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <FormField
                        inputMode="decimal"
                        keyboardType="numeric"
                        label="Hoeveelheid"
                        onChangeText={(value) => updatePortion(index, Number(value) || 0)}
                        value={String(item.quantity)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <FormField autoCapitalize="none" label="Eenheid" onChangeText={(value) => updatePortion(index, item.quantity, value)} value={item.unit} />
                    </View>
                  </View>
                  <SecondaryButton
                    label={profile?.is_premium ? 'Barcode scannen voor dit item' : 'Barcode scannen is premium'}
                    onPress={() => openBarcodeScanner(index)}
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

      <FadeInView delay={160}>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Maaltijdtotalen</Text>
          {draftAnalysis.clarificationAnswers.length ? (
            <InlineMessage
              description="De totalen hieronder zijn al bijgewerkt met je gekozen porties, bereiding of extra's."
              title="Verduidelijkingen verwerkt"
              tone="info"
            />
          ) : null}
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
