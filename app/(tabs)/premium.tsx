import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { PremiumUpsellCard } from '@/components/premium/PremiumUpsellCard';
import { colors } from '@/constants/colors';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useMeals } from '@/hooks/useMeals';
import { premiumAdviceService } from '@/services/premium/premiumAdviceService';
import { useProfileStore } from '@/store/profileStore';

export default function PremiumAdviceScreen() {
  const profile = useProfileStore((state) => state.profile);
  const totals = useDailyTotals();
  const meals = useMeals();
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<Awaited<ReturnType<typeof premiumAdviceService.generateAdvice>> | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!profile?.is_premium || !profile) {
      return;
    }

    setIsLoading(true);
    premiumAdviceService
      .generateAdvice({
        goal: profile.goal,
        dailyTotals: totals,
        recentMeals: meals.slice(0, 8),
        calorieTarget: profile.calorie_target,
        proteinTarget: profile.protein_target,
      })
      .then((result) => {
        if (mounted) {
          setAdvice(result);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [meals, profile, totals]);

  return (
    <ScreenContainer>
      <AppHeader subtitle="Goal-specific nutrition guidance powered by the current day." title="Premium advice" />

      {!profile?.is_premium ? (
        <PremiumUpsellCard onPress={() => {}} />
      ) : (
        <View style={{ gap: 18 }}>
          <Card style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Today’s analysis</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
              {advice?.summary ?? 'Generating your premium recommendations...'}
            </Text>
          </Card>

          <SectionHeader title="Recommendations" />
          {advice?.goal_specific_tips.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

          <SectionHeader title="Strengths" />
          {advice?.strengths.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

          <SectionHeader title="Warning areas" />
          {(advice?.warnings.length ? advice.warnings : ['No major warning flags right now.']).map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

          <SectionHeader title="Improvement ideas" />
          {advice?.improvements.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}
        </View>
      )}
      <LoadingOverlay label="Analyzing your day..." visible={isLoading} />
    </ScreenContainer>
  );
}
