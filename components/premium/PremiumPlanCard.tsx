import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Tag } from '@/components/common/Tag';
import { colors } from '@/constants/colors';
import { premiumLaunchPlan } from '@/constants/premiumPlan';

type PremiumPlanCardProps = {
  isActive: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export const PremiumPlanCard = ({ isActive, isLoading = false, onPress }: PremiumPlanCardProps) => (
  <Card style={{ backgroundColor: '#F7FCFF', borderColor: '#D8EBF6', gap: 18 }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <View style={{ flex: 1, gap: 8 }}>
        <Tag label={isActive ? premiumLaunchPlan.activeLabel : premiumLaunchPlan.cadenceLabel} tone="primary" />
        <Text style={{ color: colors.text, fontSize: 24, lineHeight: 30, fontFamily: 'Manrope_800ExtraBold' }}>
          {premiumLaunchPlan.name}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
          {premiumLaunchPlan.description}
        </Text>
      </View>
      <View
        style={{
          minWidth: 92,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: '#D8EBF6',
          gap: 4,
          alignItems: 'center',
        }}>
        <Text style={{ color: colors.secondary, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>PLAN</Text>
        <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>{premiumLaunchPlan.priceLabel}</Text>
      </View>
    </View>

    <View style={{ gap: 12 }}>
      {premiumLaunchPlan.features.map((feature) => (
        <View key={feature} style={{ flexDirection: 'row', gap: 10 }}>
          <Ionicons color={colors.primary} name="checkmark-circle" size={18} />
          <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
            {feature}
          </Text>
        </View>
      ))}
    </View>

    <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_600SemiBold' }}>
      {premiumLaunchPlan.reassurance}
    </Text>
    <PrimaryButton
      label={isActive ? 'Bekijk premium advies' : premiumLaunchPlan.ctaLabel}
      loading={isLoading}
      onPress={onPress}
    />
  </Card>
);
