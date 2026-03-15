import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type TrendPoint = {
  label: string;
  calories: number;
  protein: number;
};

type TrendOverviewCardProps = {
  points: TrendPoint[];
};

export const TrendOverviewCard = ({ points }: TrendOverviewCardProps) => {
  const avgCalories = points.length ? Math.round(points.reduce((sum, point) => sum + point.calories, 0) / points.length) : 0;
  const avgProtein = points.length ? Math.round(points.reduce((sum, point) => sum + point.protein, 0) / points.length) : 0;
  const maxCalories = Math.max(...points.map((point) => point.calories), 1);

  return (
    <Card style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>Weektrend</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
          Gemiddeld {avgCalories} kcal en {avgProtein}g eiwit over de laatste 7 dagen.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        {points.map((point) => (
          <View key={point.label} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
            <View
              style={{
                width: '100%',
                height: 92,
                justifyContent: 'flex-end',
                backgroundColor: colors.backgroundAlt,
                borderRadius: 16,
                overflow: 'hidden',
              }}>
              <View
                style={{
                  height: `${Math.max(8, Math.round((point.calories / maxCalories) * 100))}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 16,
                }}
              />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Manrope_700Bold' }}>{point.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};
