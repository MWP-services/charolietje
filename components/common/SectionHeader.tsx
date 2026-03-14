import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>{subtitle}</Text>
      ) : null}
    </View>
    {action}
  </View>
);
