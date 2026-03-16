import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/colors';
import { premiumLaunchPlan } from '@/constants/premiumPlan';

type PremiumUpsellCardProps = {
  onPress: () => void;
};

export const PremiumUpsellCard = ({ onPress }: PremiumUpsellCardProps) => (
  <Card style={{ backgroundColor: '#F0FAFF', borderColor: '#D9EEF6', gap: 16 }}>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons color={colors.secondary} name="sparkles" size={22} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Ontgrendel AI-coaching voor EUR 0</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
          {premiumLaunchPlan.description}
        </Text>
      </View>
    </View>
    <PrimaryButton label={premiumLaunchPlan.ctaLabel} onPress={onPress} />
  </Card>
);
