import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';

type StreakCardProps = {
  days: number;
};

export const StreakCard = ({ days }: StreakCardProps) => (
  <Card
    style={{
      backgroundColor: colors.surfaceAccent,
      borderColor: colors.primarySoft,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    }}>
    <View
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons color={colors.primary} name="flame" size={24} />
    </View>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{days}-daagse logreeks</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
        Kleine consistente acties stapelen zich op.
      </Text>
    </View>
  </Card>
);
