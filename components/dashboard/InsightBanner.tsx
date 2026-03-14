import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type InsightBannerProps = {
  text: string;
};

export const InsightBanner = ({ text }: InsightBannerProps) => (
  <View
    style={{
      backgroundColor: '#ECF7FF',
      borderRadius: radii.lg,
      padding: 16,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
      borderWidth: 1,
      borderColor: '#D3EAF6',
    }}>
    <Ionicons color={colors.secondary} name="bulb-outline" size={20} />
    <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_600SemiBold', flex: 1 }}>{text}</Text>
  </View>
);
