import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { Card } from '@/components/common/Card';

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export const EmptyState = ({
  title,
  description,
  icon = 'sparkles-outline',
}: EmptyStateProps) => (
  <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
    <View
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons color={colors.primaryDark} name={icon} size={28} />
    </View>
    <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold', textAlign: 'center' }}>{title}</Text>
    <Text
      style={{
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
        fontFamily: 'Manrope_500Medium',
        textAlign: 'center',
      }}>
      {description}
    </Text>
  </Card>
);
