import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type NutrientStatCardProps = {
  label: string;
  value: string;
  accent?: string;
  priority?: 'primary' | 'secondary';
};

export const NutrientStatCard = ({ label, value, accent = colors.primary, priority = 'primary' }: NutrientStatCardProps) => (
  <Card style={{ flex: 1, padding: priority === 'primary' ? 16 : 14, gap: priority === 'primary' ? 10 : 8 }}>
    <View style={{ width: 36, height: 5, borderRadius: 999, backgroundColor: accent }} />
    <Text style={{ color: colors.textSecondary, fontSize: priority === 'primary' ? 12 : 11, fontFamily: 'Manrope_600SemiBold' }}>{label}</Text>
    <Text style={{ color: colors.text, fontSize: priority === 'primary' ? 22 : 18, fontFamily: 'Manrope_800ExtraBold' }}>{value}</Text>
  </Card>
);
