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
import { premiumLaunchPlan } from '@/constants/premiumPlan';
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
              Activeer het launch-plan om coaching te ontgrendelen
            </Text>
          </View>
          <PremiumUpsellCard onPress={() => router.push('/premium/activate')} />
          <Card style={{ gap: 14 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Wat dit plan vrijspeelt</Text>
            {premiumLaunchPlan.features.map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
                <Ionicons color={colors.secondary} name="sparkles-outline" size={18} />
                <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
                  {item}
                </Text>
              </View>
            ))}
          </Card>
          <PrimaryButton label={premiumLaunchPlan.ctaLabel} onPress={() => router.push('/premium/activate')} />
        </View>
      ) : (
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Tag label="Premium actief" tone="primary" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
              {premiumLaunchPlan.priceLabel} launch-plan actief
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1, gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>COACH SCORE</Text>
              <Text style={{ color: colors.text, fontSize: 30, fontFamily: 'Manrope_800ExtraBold' }}>{advice?.coach_score ?? '--'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_600SemiBold' }}>
                {advice?.score_label ?? 'We beoordelen je dag'}
              </Text>
            </Card>
            <Card style={{ flex: 1, gap: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>VOLGENDE FOCUS</Text>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22, fontFamily: 'Manrope_700Bold' }}>
                {advice?.next_meal_focus ?? 'We bepalen je volgende slimme stap.'}
              </Text>
            </Card>
          </View>

          <Card style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Analyse van vandaag</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
              {advice?.summary ?? 'Je premium aanbevelingen worden gegenereerd...'}
            </Text>
          </Card>

          <Card style={{ gap: 12 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Snelle productscan</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
              Scan een streepjescode van een verpakking en stuur het product direct door naar de maaltijdanalyse, waar je de gekozen voedingswaardes nog kunt aanpassen.
            </Text>
            <PrimaryButton label="Barcode scannen" onPress={() => router.push('/meal/barcode-scan')} />
          </Card>

          <Card style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Patroon dat opvalt</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
              {advice?.pattern_summary ?? 'We zoeken naar patronen in je dag.'}
            </Text>
          </Card>

          <SectionHeader title="Checklist voor vandaag" />
          {advice?.checklist.map((tip) => (
            <Card key={tip} style={{ padding: 16 }}>
              <Text style={{ color: colors.text, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_600SemiBold' }}>{tip}</Text>
            </Card>
          ))}

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

          <SectionHeader title="Verbeterideeen" />
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
