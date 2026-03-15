import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { InsightBanner } from '@/components/dashboard/InsightBanner';
import { MacroProgressCard } from '@/components/dashboard/MacroProgressCard';
import { MealCard } from '@/components/dashboard/MealCard';
import { NutrientStatCard } from '@/components/dashboard/NutrientStatCard';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';
import { PremiumUpsellCard } from '@/components/premium/PremiumUpsellCard';
import { colors } from '@/constants/colors';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useMeals } from '@/hooks/useMeals';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import { getLastNDates, getTodayIsoDate } from '@/utils/date';
import { formatCalories } from '@/utils/formatting';

const getStreak = (dates: string[]) => {
  let streak = 0;
  const days = new Set(dates);
  const today = new Date();

  while (true) {
    const current = new Date(today);
    current.setDate(today.getDate() - streak);
    const iso = current.toISOString().slice(0, 10);
    if (!days.has(iso)) {
      break;
    }
    streak += 1;
  }

  return streak;
};

export default function DashboardScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const setDraftText = useMealStore((state) => state.setDraftText);
  const isMealsLoading = useMealStore((state) => state.isLoading);
  const profile = useProfileStore((state) => state.profile);
  const isProfileLoading = useProfileStore((state) => state.isLoading);
  const { isRefreshing, refresh } = useAppDataRefresh();
  const totals = useDailyTotals();
  const todayMeals = useMeals(getTodayIsoDate());
  const allMeals = useMeals();
  const streak = getStreak([...new Set(allMeals.map((meal) => meal.date))]);
  const last7Dates = getLastNDates(7);
  const isGuestMode = session?.provider === 'guest';

  const weeklyAverages = last7Dates.map((date) => {
    const mealsForDay = allMeals.filter((meal) => meal.date === date);
    const calories = mealsForDay.reduce((sum, meal) => sum + meal.total_calories, 0);
    return {
      label: date.slice(5),
      value: Math.min(100, Math.round((calories / 2800) * 100)),
    };
  });

  return (
    <ScreenContainer
      loading={isProfileLoading || (isMealsLoading && !allMeals.length)}
      loadingLabel="Je dashboard wordt geladen..."
      onRefresh={refresh}
      refreshing={isRefreshing}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold', letterSpacing: 0.6 }}>VANDAAG</Text>
        <Text style={{ color: colors.text, fontSize: 31, lineHeight: 38, fontFamily: 'Manrope_800ExtraBold' }}>
          Hoi {profile?.full_name?.split(' ')[0] ?? 'daar'}, je voedingsoverzicht staat klaar.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <PrimaryButton
          icon={<Ionicons color={colors.surface} name="mic" size={18} />}
          label={isGuestMode ? 'Maaltijd toevoegen' : 'Maaltijd loggen met stem'}
          onPress={() => router.push(isGuestMode ? '/meal/log?mode=typed' : '/meal/log')}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setDraftText('Ik had ');
            router.push('/meal/log?mode=typed');
          }}
          style={{
            minHeight: 52,
            borderRadius: 999,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>Snel een getypte maaltijd toevoegen</Text>
        </Pressable>
      </View>

      <StreakCard days={streak} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard label="Calorieen" value={formatCalories(totals.calories)} />
        <NutrientStatCard accent={colors.secondary} label="Eiwit" value={`${Math.round(totals.protein)} g`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard accent="#F59E0B" label="Koolhydraten" value={`${Math.round(totals.carbs)} g`} />
        <NutrientStatCard accent="#E85D75" label="Vet" value={`${Math.round(totals.fat)} g`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard accent="#8B5CF6" label="Vezels" value={`${Math.round(totals.fiber)} g`} />
        <NutrientStatCard accent="#F97316" label="Suiker" value={`${Math.round(totals.sugar)} g`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard accent="#2563EB" label="Natrium" value={`${Math.round(totals.sodium)} mg`} />
        <NutrientStatCard accent="#0F766E" label="Maaltijden vandaag" value={String(todayMeals.length)} />
      </View>

      <InsightBanner
        text={
          profile?.goal === 'build_muscle'
            ? 'Je eiwitinname ziet er sterk uit als lunch en avondeten genoeg volume hebben. Zorg dat ontbijt geen zwakke schakel wordt.'
            : profile?.goal === 'lose_weight'
              ? 'Vezels en eiwitten zijn vandaag je beste hefbomen als je met minder calorieen verzadigd wilt blijven.'
              : 'Je bouwt sterke regelmaat op wanneer je eerste gelogde maaltijd al eiwit en structuur bevat.'
        }
      />

      <MacroProgressCard color={colors.primary} current={totals.calories} target={profile?.calorie_target ?? null} title="Caloriedoel" unit=" kcal" />
      <MacroProgressCard color={colors.secondary} current={totals.protein} target={profile?.protein_target ?? null} title="Eiwitdoel" unit=" g" />

      <SectionHeader
        action={
          todayMeals.length ? (
            <Pressable onPress={() => router.push(`/day/${getTodayIsoDate()}`)}>
              <Text style={{ color: colors.secondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>Bekijk dag</Text>
            </Pressable>
          ) : null
        }
        subtitle="Maaltijden die je vandaag logt worden direct bijgewerkt."
        title="Maaltijden van vandaag"
      />

      {todayMeals.length ? (
        <View style={{ gap: 14 }}>
          {todayMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onPress={() => router.push(`/meal/${meal.id}`)} />
          ))}
        </View>
      ) : (
        <EmptyState
          description="Log vandaag je eerste maaltijd en NutriVoice berekent direct je calorieen, macro's en dagvoortgang."
          icon="restaurant-outline"
          title="Nog geen maaltijden vandaag"
        />
      )}

      <WeeklySummaryCard averages={weeklyAverages} />

      {profile?.is_premium ? <SectionHeader subtitle="Je AI-coach is ontgrendeld." title="Premium advies" /> : null}
      {profile?.is_premium ? (
        <Pressable onPress={() => router.push('/(tabs)/premium')}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 18,
              gap: 8,
            }}>
            <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>Bekijk de AI-aanbevelingen van vandaag</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
              Advies op basis van je doel, waarschuwingssignalen en praktische vervolgstappen.
            </Text>
          </View>
        </Pressable>
      ) : (
        <PremiumUpsellCard onPress={() => router.push('/premium/coming-soon')} />
      )}
    </ScreenContainer>
  );
}
