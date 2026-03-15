import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { FadeInView } from '@/components/common/FadeInView';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { TrendOverviewCard } from '@/components/history/TrendOverviewCard';
import { colors } from '@/constants/colors';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useMeals } from '@/hooks/useMeals';
import { useMealStore } from '@/store/mealStore';
import { calculateDayTotals } from '@/utils/nutrition';
import { formatDisplayDate, formatRelativeDay, getLastNDates } from '@/utils/date';

export default function HistoryScreen() {
  const router = useRouter();
  const { isRefreshing, refresh } = useAppDataRefresh();
  const isMealsLoading = useMealStore((state) => state.isLoading);
  const meals = useMeals();
  const grouped = [...new Set(meals.map((meal) => meal.date))].sort((a, b) => b.localeCompare(a));
  const last7Dates = getLastNDates(7).reverse();
  const weeklyPoints = last7Dates
    .map((date) => {
      const mealsForDay = meals.filter((meal) => meal.date === date);
      const totals = calculateDayTotals(date, mealsForDay);
      return {
        label: date.slice(5),
        calories: totals.calories,
        protein: totals.protein,
      };
    })
    .reverse();

  const activeDays = weeklyPoints.filter((point) => point.calories > 0).length;
  const avgMealsPerLoggedDay = grouped.length > 0 ? Math.round((meals.length / grouped.length) * 10) / 10 : 0;

  return (
    <ScreenContainer loading={isMealsLoading && !meals.length} loadingLabel="Je historie wordt geladen..." onRefresh={refresh} refreshing={isRefreshing}>
      <AppHeader subtitle="Bekijk eerdere dagen, trends en je regelmaat door de tijd heen." title="Historie" />

      {grouped.length ? (
        <>
          <FadeInView delay={20}>
            <TrendOverviewCard points={weeklyPoints} />
          </FadeInView>

          <FadeInView delay={60}>
            <Card style={{ gap: 14 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>Trendinzichten</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Card style={{ flex: 1, padding: 14, backgroundColor: colors.surfaceMuted }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>ACTIEVE DAGEN</Text>
                  <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{activeDays}/7</Text>
                </Card>
                <Card style={{ flex: 1, padding: 14, backgroundColor: colors.surfaceMuted }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>GEM. MAALTIJDEN</Text>
                  <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{avgMealsPerLoggedDay}</Text>
                </Card>
              </View>
            </Card>
          </FadeInView>

          <SectionHeader subtitle="Tik op een dag om totalen en maaltijddetails te openen." title="Vorige dagen" />
          <View style={{ gap: 14 }}>
            {grouped.map((date, index) => {
              const mealsForDay = meals.filter((meal) => meal.date === date);
              const totals = calculateDayTotals(date, mealsForDay);

              return (
                <FadeInView delay={100 + index * 35} key={date}>
                  <Pressable onPress={() => router.push(`/day/${date}`)}>
                    <Card style={{ gap: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ gap: 4 }}>
                          <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>{formatDisplayDate(date)}</Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{formatRelativeDay(date)}</Text>
                        </View>
                        <Text style={{ color: colors.primary, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{Math.round(totals.calories)} kcal</Text>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>Eiwit {Math.round(totals.protein)}g</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>Vezels {Math.round(totals.fiber)}g</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>Maaltijden {mealsForDay.length}</Text>
                      </View>
                    </Card>
                  </Pressable>
                </FadeInView>
              );
            })}
          </View>
        </>
      ) : (
        <EmptyState description="Zodra je maaltijden logt verschijnen hier je dagkaarten en weekpatronen." title="Nog geen historie" />
      )}
    </ScreenContainer>
  );
}
