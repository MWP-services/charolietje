import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type TagProps = {
  label: string;
  tone?: 'primary' | 'neutral' | 'warning';
};

export const Tag = ({ label, tone = 'neutral' }: TagProps) => {
  const backgroundColor =
    tone === 'primary' ? colors.primarySoft : tone === 'warning' ? '#FFF3D6' : colors.surfaceMuted;
  const textColor = tone === 'primary' ? colors.primaryDark : tone === 'warning' ? '#B7791F' : colors.textSecondary;

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 7,
      }}>
      <Text style={{ color: textColor, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
    </View>
  );
};
