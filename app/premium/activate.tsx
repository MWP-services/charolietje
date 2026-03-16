import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Tag } from '@/components/common/Tag';
import { PremiumPlanCard } from '@/components/premium/PremiumPlanCard';
import { colors } from '@/constants/colors';
import { premiumLaunchPlan } from '@/constants/premiumPlan';
import { useProfileStore } from '@/store/profileStore';

export default function PremiumActivateScreen() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onActivate = async () => {
    if (!profile) {
      Alert.alert('Profiel niet beschikbaar', 'Laad je profiel opnieuw voordat je premium activeert.');
      return;
    }

    if (profile?.is_premium) {
      router.replace('/(tabs)/premium');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateProfile({ is_premium: true });
      router.replace('/(tabs)/premium');
    } catch (error) {
      Alert.alert('Premium activeren mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader
        showBackButton
        subtitle="Alle premium coaching staat tijdelijk open zodat de app volledig gebruikt kan worden."
        title="Activeer premium"
      />

      <PremiumPlanCard isActive={profile?.is_premium ?? false} isLoading={isSubmitting} onPress={onActivate} />

      <Card style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ gap: 8, flex: 1 }}>
            <Tag label="Volledige ervaring" tone="primary" />
            <Text style={{ color: colors.text, fontSize: 22, lineHeight: 28, fontFamily: 'Manrope_800ExtraBold' }}>
              Premium is compleet en direct beschikbaar
            </Text>
          </View>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: '#F0FAFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons color={colors.secondary} name="sparkles" size={28} />
          </View>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
          {premiumLaunchPlan.description}
        </Text>
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>Wat je direct krijgt</Text>
        {[
          'Een coach score die je dag samenvat',
          'Volgende-maaltijd advies dat direct toepasbaar is',
          'Checklist, sterke punten en aandachtspunten op basis van je logs',
        ].map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons color={colors.primary} name="checkmark-circle" size={18} />
            <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
              {item}
            </Text>
          </View>
        ))}
      </Card>

      <PrimaryButton
        label={profile?.is_premium ? 'Ga naar premium advies' : premiumLaunchPlan.ctaLabel}
        disabled={!profile}
        loading={isSubmitting}
        onPress={onActivate}
      />
      <SecondaryButton label="Terug naar dashboard" onPress={() => router.replace('/(tabs)')} />
    </ScreenContainer>
  );
}
