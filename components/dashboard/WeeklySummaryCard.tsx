import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import { colors } from '@/constants/colors';
import type { WeeklyOverview } from '@/types/meal';

type WeeklySummaryCardProps = {
  overview: WeeklyOverview;
  onPress?: () => void;
};

export const WeeklySummaryCard = ({ overview, onPress }: WeeklySummaryCardProps) => {
  const maxCalories = Math.max(...overview.days.map((day) => day.totals.calories), 1);
  const trendLabel =
    overview.trendDirection === 'up'
      ? 'Eiwit stijgt'
      : overview.trendDirection === 'down'
        ? 'Even opletten'
        : 'Rustige week';

  const content = (
    <Card style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Deze week in een oogopslag</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>{overview.summary}</Text>
        </View>
        <Tag label={trendLabel} tone={overview.trendDirection === 'down' ? 'warning' : 'primary'} />
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, padding: 14, gap: 6, backgroundColor: colors.surfaceMuted }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>GEM. CALORIEEN</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{Math.round(overview.averageCaloriesPerLoggedDay)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>per gelogde dag</Text>
        </Card>
        <Card style={{ flex: 1, padding: 14, gap: 6, backgroundColor: colors.surfaceMuted }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>GEM. EIWIT</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{Math.round(overview.averageProteinPerLoggedDay)} g</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>per gelogde dag</Text>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, padding: 14, gap: 6, backgroundColor: colors.surfaceMuted }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>REGELMAAT</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{overview.loggedDays}/7</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>{overview.consistencyRate}% van de week gelogd</Text>
        </Card>
        <Card style={{ flex: 1, padding: 14, gap: 6, backgroundColor: colors.surfaceMuted }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>MAALTIJDEN</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{overview.totalMeals}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>totaal deze week</Text>
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>Calorieen per dag</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {overview.days.map((day) => (
            <View key={day.date} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: 90,
                  borderRadius: 14,
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                  backgroundColor: colors.backgroundAlt,
                }}>
                <View
                  style={{
                    height: `${day.mealCount ? Math.max(10, Math.round((day.totals.calories / maxCalories) * 100)) : 0}%`,
                    borderRadius: 14,
                    backgroundColor: day.mealCount ? colors.primary : colors.border,
                  }}
                />
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Manrope_700Bold' }}>{day.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_500Medium' }}>{overview.supportMessage}</Text>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
};
