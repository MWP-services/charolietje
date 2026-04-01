import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type MacroProgressCardProps = {
  title: string;
  current: number;
  target: number | null;
  unit: string;
  color?: string;
};

export const MacroProgressCard = ({
  title,
  current,
  target,
  unit,
  color = colors.primary,
}: MacroProgressCardProps) => {
  const percentage = target ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <Card style={{ padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{title}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
          {Math.round(current)}
          {unit}
          {target ? ` / ${target}${unit}` : ''}
        </Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 28, fontFamily: 'Manrope_800ExtraBold' }}>
        {Math.round(current)}
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}> {unit.trim()}</Text>
      </Text>
      <View style={{ height: 10, backgroundColor: colors.backgroundAlt, borderRadius: 999, overflow: 'hidden' }}>
        <View style={{ width: `${percentage}%`, height: '100%', borderRadius: 999, backgroundColor: color }} />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_500Medium' }}>
        {target ? `${percentage}% van je doel bereikt` : 'Nog geen doel ingesteld'}
      </Text>
    </Card>
  );
};
