import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import { colors } from '@/constants/colors';
import type { WeeklyOverview } from '@/types/meal';
import { formatDisplayDate } from '@/utils/date';

type TrendOverviewCardProps = {
  overview: WeeklyOverview;
};

export const TrendOverviewCard = ({ overview }: TrendOverviewCardProps) => {
  const maxProtein = Math.max(...overview.days.map((day) => day.totals.protein), 1);

  return (
    <Card style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Weektrend</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>{overview.summary}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, padding: 14, gap: 6, backgroundColor: colors.surfaceMuted }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>BESTE DAG</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>
            {overview.strongestDay ? formatDisplayDate(overview.strongestDay.date) : 'Nog niet genoeg data'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>
            {overview.strongestDay ? `${Math.round(overview.strongestDay.totals.protein)} g eiwit` : 'Log een paar dagen voor trends'}
          </Text>
        </Card>
        <Card style={{ flex: 1, padding: 14, gap: 6, backgroundColor: colors.surfaceMuted }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>MEEST FRISSE FOCUS</Text>
          <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>
            {overview.weakestDay ? formatDisplayDate(overview.weakestDay.date) : 'Nog niet genoeg data'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>
            {overview.weakestDay ? `${Math.round(overview.weakestDay.totals.protein)} g eiwit` : 'Nog geen logdag gevonden'}
          </Text>
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>Eiwit per dag</Text>
          <Tag
            label={overview.trendDirection === 'up' ? 'Stijgende lijn' : overview.trendDirection === 'down' ? 'Lichte daling' : 'Stabiele lijn'}
            tone={overview.trendDirection === 'down' ? 'warning' : 'primary'}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
          {overview.days.map((day) => (
            <View key={day.date} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  height: 94,
                  justifyContent: 'flex-end',
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: 16,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: `${day.mealCount ? Math.max(10, Math.round((day.totals.protein / maxProtein) * 100)) : 0}%`,
                    backgroundColor: day.mealCount ? colors.secondary : colors.border,
                    borderRadius: 16,
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
};
