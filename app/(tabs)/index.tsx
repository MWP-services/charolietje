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
import { useDailyTotals } from '@/hooks/useDailyTotals';
import { useMeals } from '@/hooks/useMeals';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import { getTodayIsoDate, getLastNDates } from '@/utils/date';
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
  const setDraftText = useMealStore((state) => state.setDraftText);
  const profile = useProfileStore((state) => state.profile);
  const totals = useDailyTotals();
  const todayMeals = useMeals(getTodayIsoDate());
  const allMeals = useMeals();
  const streak = getStreak([...new Set(allMeals.map((meal) => meal.date))]);
  const last7Dates = getLastNDates(7);

  const weeklyAverages = last7Dates.map((date) => {
    const mealsForDay = allMeals.filter((meal) => meal.date === date);
    const calories = mealsForDay.reduce((sum, meal) => sum + meal.total_calories, 0);
    return {
      label: date.slice(5),
      value: Math.min(100, Math.round((calories / 2800) * 100)),
    };
  });

  return (
    <ScreenContainer>
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_700Bold', letterSpacing: 0.6 }}>TODAY</Text>
        <Text style={{ color: colors.text, fontSize: 31, lineHeight: 38, fontFamily: 'Manrope_800ExtraBold' }}>
          Hi {profile?.full_name?.split(' ')[0] ?? 'there'}, your nutrition snapshot is ready.
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        <PrimaryButton
          icon={<Ionicons color={colors.surface} name="mic" size={18} />}
          label="Log meal with voice"
          onPress={() => router.push('/meal/log')}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setDraftText('I had ');
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
          <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>Quick add typed meal</Text>
        </Pressable>
      </View>

      <StreakCard days={streak} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard label="Calories" value={formatCalories(totals.calories)} />
        <NutrientStatCard accent={colors.secondary} label="Protein" value={`${Math.round(totals.protein)} g`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard accent="#F59E0B" label="Carbs" value={`${Math.round(totals.carbs)} g`} />
        <NutrientStatCard accent="#E85D75" label="Fat" value={`${Math.round(totals.fat)} g`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard accent="#8B5CF6" label="Fiber" value={`${Math.round(totals.fiber)} g`} />
        <NutrientStatCard accent="#F97316" label="Sugar" value={`${Math.round(totals.sugar)} g`} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <NutrientStatCard accent="#2563EB" label="Sodium" value={`${Math.round(totals.sodium)} mg`} />
        <NutrientStatCard accent="#0F766E" label="Meals today" value={String(todayMeals.length)} />
      </View>

      <InsightBanner
        text={
          profile?.goal === 'build_muscle'
            ? 'Protein looks solid when lunch and dinner both carry enough volume. Keep breakfast from becoming the weak link.'
            : profile?.goal === 'lose_weight'
              ? 'Fiber and protein are your best levers today if you want to stay full with fewer calories.'
              : 'Consistency is strong when your first logged meal already includes protein and structure.'
        }
      />

      <MacroProgressCard color={colors.primary} current={totals.calories} target={profile?.calorie_target ?? null} title="Calorie goal" unit=" kcal" />
      <MacroProgressCard color={colors.secondary} current={totals.protein} target={profile?.protein_target ?? null} title="Protein goal" unit=" g" />

      <SectionHeader
        action={
          todayMeals.length ? (
            <Pressable onPress={() => router.push(`/day/${getTodayIsoDate()}`)}>
              <Text style={{ color: colors.secondary, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>View day</Text>
            </Pressable>
          ) : null
        }
        subtitle="Meals logged today update instantly."
        title="Today’s meals"
      />

      {todayMeals.length ? (
        <View style={{ gap: 14 }}>
          {todayMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onPress={() => router.push(`/meal/${meal.id}`)} />
          ))}
        </View>
      ) : (
        <EmptyState
          description="Log your first meal today and NutriVoice will calculate your calories, macros, and daily progress instantly."
          icon="restaurant-outline"
          title="No meals yet today"
        />
      )}

      <WeeklySummaryCard averages={weeklyAverages} />

      {profile?.is_premium ? (
        <SectionHeader subtitle="Your AI coach is unlocked." title="Premium coaching" />
      ) : null}
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
            <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>See today’s AI recommendations</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
              Goal-aware advice, warning flags, and practical next-step suggestions.
            </Text>
          </View>
        </Pressable>
      ) : (
        <PremiumUpsellCard onPress={() => router.push('/(tabs)/premium')} />
      )}
    </ScreenContainer>
  );
}
