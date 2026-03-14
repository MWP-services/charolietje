import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Tag } from '@/components/common/Tag';
import { PremiumUpsellCard } from '@/components/premium/PremiumUpsellCard';
import { colors } from '@/constants/colors';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useMeals } from '@/hooks/useMeals';
import { premiumAdviceService } from '@/services/premium/premiumAdviceService';
import { useProfileStore } from '@/store/profileStore';

export default function PremiumAdviceScreen() {
  const router = useRouter();
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
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Tag label="Premium locked" tone="warning" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
              Upgrade to unlock coaching
            </Text>
          </View>
          <PremiumUpsellCard onPress={() => router.push('/(tabs)/settings')} />
          <Card style={{ gap: 14 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>What premium unlocks</Text>
            {[
              'Daily AI recommendations tailored to fat loss, maintenance, or muscle gain',
              'Pattern-based warnings like low protein, low fiber, or snack-heavy intake',
              'Strength callouts so users know what habits are already working',
              'Future-ready coaching architecture for subscriptions and richer analysis',
            ].map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
                <Ionicons color={colors.secondary} name="sparkles-outline" size={18} />
                <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>{item}</Text>
              </View>
            ))}
          </Card>
          <PrimaryButton label="Enable premium mock mode" onPress={() => router.push('/(tabs)/settings')} />
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Tag label="Premium active" tone="primary" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
              Coaching is using your current goal and recent meals
            </Text>
          </View>
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
