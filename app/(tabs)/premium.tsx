import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Tag } from '@/components/common/Tag';
import { PremiumUpsellCard } from '@/components/premium/PremiumUpsellCard';
import { colors } from '@/constants/colors';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useMeals } from '@/hooks/useMeals';
import { premiumAdviceService } from '@/services/premium/premiumAdviceService';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';

export default function PremiumAdviceScreen() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const isProfileLoading = useProfileStore((state) => state.isLoading);
  const isMealsLoading = useMealStore((state) => state.isLoading);
  const { isRefreshing, refresh } = useAppDataRefresh();
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
    <ScreenContainer
      loading={isLoading || isProfileLoading || (isMealsLoading && !meals.length)}
      loadingLabel="Premiuminzichten worden geladen..."
      onRefresh={refresh}
      refreshing={isRefreshing}>
      <AppHeader subtitle="Voedingsadvies op basis van je doel en je huidige dag." title="Premium advies" />

      {!profile?.is_premium ? (
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Tag label="Premium vergrendeld" tone="warning" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
              Upgrade om coaching te ontgrendelen
            </Text>
          </View>
          <PremiumUpsellCard onPress={() => router.push('/premium/coming-soon')} />
          <Card style={{ gap: 14 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Wat premium vrijspeelt</Text>
            {[
              'Dagelijkse AI-aanbevelingen voor afvallen, behoud of spieropbouw',
              'Patroongestuurde waarschuwingen zoals weinig eiwit, weinig vezels of veel snacks',
              'Sterke punten zodat je weet welke gewoontes al goed werken',
              'Een coachingarchitectuur die klaar is voor abonnementen en rijkere analyse',
            ].map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
                <Ionicons color={colors.secondary} name="sparkles-outline" size={18} />
                <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>{item}</Text>
              </View>
            ))}
          </Card>
          <PrimaryButton label="Schakel premium testmodus in" onPress={() => router.push('/(tabs)/settings')} />
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Tag label="Premium actief" tone="primary" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
              Coaching gebruikt je huidige doel en recente maaltijden
            </Text>
          </View>
          <Card style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Analyse van vandaag</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
              {advice?.summary ?? 'Je premium aanbevelingen worden gegenereerd...'}
            </Text>
          </Card>

          <SectionHeader title="Aanbevelingen" />
          {advice?.goal_specific_tips.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

          <SectionHeader title="Sterke punten" />
          {advice?.strengths.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

          <SectionHeader title="Aandachtspunten" />
          {(advice?.warnings.length ? advice.warnings : ['Er zijn nu geen grote waarschuwingssignalen.']).map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

          <SectionHeader title="Verbeterideeën" />
          {advice?.improvements.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}
