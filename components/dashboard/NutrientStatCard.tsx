import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type NutrientStatCardProps = {
  label: string;
  value: string;
  accent?: string;
};

export const NutrientStatCard = ({ label, value, accent = colors.primary }: NutrientStatCardProps) => (
  <Card style={{ flex: 1, padding: 16, gap: 10 }}>
    <View style={{ width: 36, height: 5, borderRadius: 999, backgroundColor: accent }} />
    <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>{label}</Text>
    <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{value}</Text>
  </Card>
);
