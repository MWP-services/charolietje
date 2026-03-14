import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SectionHeader } from '@/components/common/SectionHeader';
import { colors } from '@/constants/colors';
import { useMeals } from '@/hooks/useMeals';
import { formatDisplayDate, formatRelativeDay } from '@/utils/date';
import { calculateDayTotals } from '@/utils/nutrition';

export default function HistoryScreen() {
  const router = useRouter();
  const meals = useMeals();
  const grouped = [...new Set(meals.map((meal) => meal.date))].sort((a, b) => b.localeCompare(a));

  return (
    <ScreenContainer>
      <AppHeader subtitle="Browse previous days, totals, and logged meals." title="History" />
      <SectionHeader subtitle="Your recent nutrition timeline" title="Previous days" />
      {grouped.length ? (
        <View style={{ gap: 14 }}>
          {grouped.map((date) => {
            const mealsForDay = meals.filter((meal) => meal.date === date);
            const totals = calculateDayTotals(date, mealsForDay);

            return (
              <Pressable key={date} onPress={() => router.push(`/day/${date}`)}>
                <Card style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ gap: 4 }}>
                      <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>{formatDisplayDate(date)}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{formatRelativeDay(date)}</Text>
                    </View>
                    <Text style={{ color: colors.primary, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{Math.round(totals.calories)} kcal</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
                      Protein {Math.round(totals.protein)}g
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
                      Meals {mealsForDay.length}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <EmptyState description="Once you log meals, your day cards and weekly patterns will appear here." title="No history yet" />
      )}
    </ScreenContainer>
  );
}
