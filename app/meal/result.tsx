import { useRouter } from 'expo-router';
import { Alert, Text } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { NutritionRow } from '@/components/meal/NutritionRow';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { formatMealType } from '@/utils/formatting';

export default function MealAnalysisResultScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const { draftAnalysis, saveDraft, isSaving, error, clearError } = useMealStore();

  if (!draftAnalysis || !session) {
    return null;
  }

  const onSave = async () => {
    try {
      const meal = await saveDraft(session.userId);
      Alert.alert('Meal saved', 'Your dashboard totals have been updated.');
      router.replace(`/meal/${meal.id}`);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <ScreenContainer>
      <AppHeader showBackButton subtitle="Review the AI estimate before saving it to your day." title="Meal analysis" />
      {error ? (
        <InlineMessage
          actionLabel="Dismiss"
          description="You can go back to edit the transcript or try saving again once the issue is resolved."
          onActionPress={clearError}
          title={error}
          tone="error"
        />
      ) : null}

      <FadeInView delay={20}>
        <Card style={{ gap: 10 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>DETECTED MEAL TYPE</Text>
          <Text style={{ color: colors.text, fontSize: 24, fontFamily: 'Manrope_800ExtraBold' }}>{formatMealType(draftAnalysis.mealType)}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>{draftAnalysis.originalText}</Text>
        </Card>
      </FadeInView>

      <FadeInView delay={80}>
        <Card>
          {draftAnalysis.items.map((item) => (
            <NutritionRow item={item} key={`${item.name}-${item.quantity}`} />
          ))}
        </Card>
      </FadeInView>

      <FadeInView delay={140}>
        <Card style={{ gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Meal totals</Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>
            {Math.round(draftAnalysis.totals.calories)} kcal • {Math.round(draftAnalysis.totals.protein)}g protein • {Math.round(draftAnalysis.totals.carbs)}g carbs •{' '}
            {Math.round(draftAnalysis.totals.fat)}g fat
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>
            Fiber {Math.round(draftAnalysis.totals.fiber)}g • Sugar {Math.round(draftAnalysis.totals.sugar)}g • Sodium {Math.round(draftAnalysis.totals.sodium)}mg
          </Text>
        </Card>
      </FadeInView>

      <PrimaryButton label="Save meal" loading={isSaving} onPress={onSave} />
      <SecondaryButton label="Edit transcription" onPress={() => router.back()} />
    </ScreenContainer>
  );
}
