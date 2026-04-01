import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';
import type { Nutrients } from '@/types/nutrition';

type NutritionSummaryCardProps = {
  title: string;
  subtitle?: string;
  totals: Nutrients;
  children?: React.ReactNode;
};

const SummaryMetric = ({ label, value }: { label: string; value: string }) => (
  <Card style={{ flex: 1, padding: 14, gap: 4, backgroundColor: colors.surfaceMuted }}>
    <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
    <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold' }}>{value}</Text>
  </Card>
);

export const NutritionSummaryCard = ({ title, subtitle, totals, children }: NutritionSummaryCardProps) => (
  <Card style={{ gap: 14 }}>
    <View style={{ gap: 4 }}>
      <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>{subtitle}</Text>
      ) : null}
    </View>

    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>CALORIEEN</Text>
      <Text style={{ color: colors.text, fontSize: 34, fontFamily: 'Manrope_800ExtraBold' }}>{Math.round(totals.calories)} kcal</Text>
    </View>

    <View style={{ flexDirection: 'row', gap: 12 }}>
      <SummaryMetric label="Eiwit" value={`${Math.round(totals.protein)} g`} />
      <SummaryMetric label="Koolhydraten" value={`${Math.round(totals.carbs)} g`} />
      <SummaryMetric label="Vet" value={`${Math.round(totals.fat)} g`} />
    </View>

    <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, fontFamily: 'Manrope_500Medium' }}>
      Vezels {Math.round(totals.fiber)} g • Suiker {Math.round(totals.sugar)} g • Natrium {Math.round(totals.sodium)} mg
    </Text>

    {children}
  </Card>
);
