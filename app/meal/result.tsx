import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { NutritionSummaryCard } from '@/components/common/NutritionSummaryCard';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { ClarificationCard } from '@/components/meal/ClarificationCard';
import { QuickEditControls } from '@/components/meal/QuickEditControls';
import { NutritionInputs } from '@/components/meal/NutritionInputs';
import { NutritionRow } from '@/components/meal/NutritionRow';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import { getQuickEditPresets, getQuickEditStep } from '@/utils/mealEditing';
import { formatMealType } from '@/utils/formatting';
import { getMissingNutritionLabels, hasCompleteNutrition, scaleItemNutritionToQuantity } from '@/utils/nutrition';

export default function MealAnalysisResultScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const draftAnalysis = useMealStore((state) => state.draftAnalysis);
  const saveDraft = useMealStore((state) => state.saveDraft);
  const updateDraftItem = useMealStore((state) => state.updateDraftItem);
  const duplicateDraftItem = useMealStore((state) => state.duplicateDraftItem);
  const removeDraftItem = useMealStore((state) => state.removeDraftItem);
  const answerDraftClarification = useMealStore((state) => state.answerDraftClarification);
  const skipDraftClarification = useMealStore((state) => state.skipDraftClarification);
  const isAnalyzing = useMealStore((state) => state.isAnalyzing);
  const isSaving = useMealStore((state) => state.isSaving);
  const error = useMealStore((state) => state.error);
  const clearError = useMealStore((state) => state.clearError);
  const [expandedEditors, setExpandedEditors] = useState<number[]>([]);

  const goBackToDraft = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/meal/log?mode=typed');
  };

  if (!draftAnalysis || !session) {
    return null;
  }

  const hasIncompleteItems = draftAnalysis.items.some((item) => !hasCompleteNutrition(item));
  const mealSizeQuestion = draftAnalysis.clarifications.find((question) => question.type === 'meal_size') ?? null;
  const mealSizeAnswer = mealSizeQuestion ? draftAnalysis.clarificationAnswers.find((answer) => answer.questionId === mealSizeQuestion.id && !answer.skipped) : null;
  const itemClarifications = draftAnalysis.clarifications.filter((question) => question.type !== 'meal_size');
  const pendingClarifications = itemClarifications.filter((question) => !question.answered && !question.skipped);

  const toggleEditor = (index: number) => {
    setExpandedEditors((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index]));
  };

  const updatePortion = (index: number, nextQuantity: number, nextUnit?: string) => {
    const item = draftAnalysis.items[index];
    updateDraftItem(index, scaleItemNutritionToQuantity(item, nextQuantity, nextUnit ?? item.unit));
  };

  const nudgePortion = (index: number, direction: -1 | 1) => {
    const item = draftAnalysis.items[index];
    const step = getQuickEditStep(item.unit);
    const nextQuantity = Math.max(step < 1 ? 0.5 : 1, Math.round((item.quantity + direction * step) * 10) / 10);
    updatePortion(index, nextQuantity);
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

  const onAnswerClarification = async (questionId: string, selectedOptionIds: string[]) => {
    try {
      await answerDraftClarification(questionId, selectedOptionIds, session.userId);
    } catch (clarificationError) {
      Alert.alert('Bijwerken mislukt', clarificationError instanceof Error ? clarificationError.message : 'Probeer het opnieuw.');
    }
  };

  const onSkipClarification = async (questionId: string) => {
    try {
      await skipDraftClarification(questionId, session.userId);
    } catch (clarificationError) {
      Alert.alert('Overslaan mislukt', clarificationError instanceof Error ? clarificationError.message : 'Probeer het opnieuw.');
    }
  };

  const onAnswerMealSize = async (selectedOptionIds: string[]) => {
    if (!mealSizeQuestion) {
      return;
    }

    try {
      await answerDraftClarification(mealSizeQuestion.id, selectedOptionIds, session.userId);
    } catch (clarificationError) {
      Alert.alert('Bijwerken mislukt', clarificationError instanceof Error ? clarificationError.message : 'Probeer het opnieuw.');
    }
  };

  const onSkipMealSize = async () => {
    if (!mealSizeQuestion) {
      return;
    }

    try {
      await skipDraftClarification(mealSizeQuestion.id, session.userId);
    } catch (clarificationError) {
      Alert.alert('Overslaan mislukt', clarificationError instanceof Error ? clarificationError.message : 'Probeer het opnieuw.');
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        backHref="/meal/log?mode=typed"
        showBackButton
        subtitle="Loop je porties en opvallende details nog even na. Daarna kun je meteen opslaan."
        title="Controleer je voedingsschatting"
      />
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
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>GEDETECTEERDE MAALTIJD</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'Manrope_800ExtraBold' }}>{formatMealType(draftAnalysis.mealType)}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>{draftAnalysis.originalText}</Text>
        </Card>
      </FadeInView>

      <FadeInView delay={40}>
        <InlineMessage
          description="NutriVoice maakt eerst een slimme schatting en jij finetunet alleen wat nodig is. Kijk vooral naar portie, bereiding en extra's."
          title="AI helpt met de eerste inschatting"
          tone="info"
        />
      </FadeInView>

      <FadeInView delay={80}>
        {mealSizeQuestion ? (
          <ClarificationCard
            confirmLabel={mealSizeAnswer ? 'Maaltijdgrootte bijwerken' : 'Werk maaltijdgrootte bij'}
            initialSelectedOptionIds={mealSizeAnswer?.selectedOptionIds ?? []}
            isLoading={isAnalyzing}
            onConfirm={onAnswerMealSize}
            onSkip={onSkipMealSize}
            question={mealSizeQuestion}
          />
        ) : null}
      </FadeInView>

      <FadeInView delay={100}>
        <View style={{ gap: 12 }}>
          {itemClarifications.map((question) => {
            const answer = draftAnalysis.clarificationAnswers.find((entry) => entry.questionId === question.id && !entry.skipped) ?? null;

            return (
              <ClarificationCard
                key={question.id}
                confirmLabel={answer ? 'Keuze bijwerken' : 'Werk inschatting bij'}
                initialSelectedOptionIds={answer?.selectedOptionIds ?? []}
                isLoading={isAnalyzing}
                onConfirm={(selectedOptionIds) => void onAnswerClarification(question.id, selectedOptionIds)}
                onSkip={() => void onSkipClarification(question.id)}
                question={question}
              />
            );
          })}
        </View>
      </FadeInView>

      {itemClarifications.length ? (
        <FadeInView delay={120}>
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

      <FadeInView delay={140}>
        <View style={{ gap: 14 }}>
          {draftAnalysis.items.map((item, index) => {
            const manualEditorOpen = expandedEditors.includes(index) || !hasCompleteNutrition(item);

            return (
              <Card key={`${item.name}-${item.quantity}-${index}`} style={{ gap: 12 }}>
                <NutritionRow item={item} />
                {item.derivedFromClarification ? (
                  <InlineMessage
                    description="Dit is een globale extra-inschatting uit je snelle check. We houden hem bewust algemeen zolang het type saus of extra niet zeker is."
                    title={`Extra uit snelle check voor ${item.parentItemName ?? 'je maaltijd'}`}
                    tone="info"
                  />
                ) : null}
                {item.needsClarification && item.clarificationQuestion ? (
                  <Text style={{ color: colors.warning, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>{item.clarificationQuestion}</Text>
                ) : null}

                <QuickEditControls
                  canRemove={draftAnalysis.items.length > 1}
                  manualOpen={manualEditorOpen}
                  onDecrease={() => nudgePortion(index, -1)}
                  onDuplicate={() => duplicateDraftItem(index)}
                  onIncrease={() => nudgePortion(index, 1)}
                  onPresetPress={(preset) => updatePortion(index, preset.quantity, preset.unit)}
                  onRemove={() => removeDraftItem(index)}
                  onToggleManual={() => toggleEditor(index)}
                  presets={getQuickEditPresets(item.quantity, item.unit)}
                  showManualToggle={hasCompleteNutrition(item)}
                />

                {manualEditorOpen ? (
                  <>
                    <InlineMessage
                      description={
                        hasCompleteNutrition(item)
                          ? 'Pas hoeveelheid, barcode of losse voedingswaardes aan als de schatting net niet klopt.'
                          : 'We vonden hier nog geen betrouwbare voedingswaarde voor. Vul hem hieronder aan om op te slaan.'
                      }
                      title={hasCompleteNutrition(item) ? `Fijnslijpen voor ${item.name}` : `Nog aan te vullen voor ${item.name}`}
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
              </Card>
            );
          })}
        </View>
      </FadeInView>

      <FadeInView delay={160}>
        <NutritionSummaryCard
          subtitle="Dit is het totaal van wat nu op je bord staat, inclusief aanpassingen die je hierboven hebt gedaan."
          title="Maaltijdtotaal"
          totals={draftAnalysis.totals}>
          {draftAnalysis.clarificationAnswers.length ? (
            <InlineMessage
              description="Je gekozen porties, bereiding en extra's zijn al verwerkt in dit totaal."
              title="Bijgewerkt met jouw keuzes"
              tone="info"
            />
          ) : null}
          {hasIncompleteItems ? (
            <InlineMessage
              description="Dit totaal telt alleen de bekende waardes mee totdat je de ontbrekende velden invult."
              title="Nog niet helemaal compleet"
              tone="info"
            />
          ) : null}
        </NutritionSummaryCard>
      </FadeInView>

      <PrimaryButton
        disabled={hasIncompleteItems}
        label={hasIncompleteItems ? 'Vul eerst ontbrekende waardes in' : 'Maaltijd opslaan'}
        loading={isSaving}
        onPress={onSave}
      />
      <SecondaryButton label="Transcriptie bewerken" onPress={goBackToDraft} />
    </ScreenContainer>
  );
}
