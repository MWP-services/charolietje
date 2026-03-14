import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type WeeklySummaryCardProps = {
  averages: Array<{ label: string; value: number }>;
};

export const WeeklySummaryCard = ({ averages }: WeeklySummaryCardProps) => (
  <Card style={{ gap: 16 }}>
    <View style={{ gap: 4 }}>
      <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>Weekly overview</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
        Chart scaffold for your next insight layer.
      </Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
      {averages.map((entry, index) => (
        <View key={entry.label} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
          <View
            style={{
              width: '100%',
              height: 84,
              borderRadius: 16,
              justifyContent: 'flex-end',
              backgroundColor: colors.backgroundAlt,
              overflow: 'hidden',
            }}>
            <View
              style={{
                height: `${Math.min(100, entry.value)}%`,
                backgroundColor: index % 2 === 0 ? colors.primary : colors.secondary,
                borderRadius: 16,
              }}
            />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>{entry.label}</Text>
        </View>
      ))}
    </View>
  </Card>
);
