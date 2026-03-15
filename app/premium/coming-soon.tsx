import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { Tag } from '@/components/common/Tag';
import { colors } from '@/constants/colors';

export default function PremiumComingSoonScreen() {
  const router = useRouter();

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader
        showBackButton
        subtitle="We bouwen aan een sterkere premium-ervaring voor NutriVoice."
        title="Premium komt eraan"
      />

      <Card style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ gap: 8, flex: 1 }}>
            <Tag label="Binnenkort beschikbaar" tone="primary" />
            <Text style={{ color: colors.text, fontSize: 24, lineHeight: 30, fontFamily: 'Manrope_800ExtraBold' }}>
              Premium coaching is nog in ontwikkeling.
            </Text>
          </View>
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              backgroundColor: '#F0FAFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons color={colors.secondary} name="sparkles" size={28} />
          </View>
        </View>

        <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>
          We werken aan persoonlijke AI-coaching, slimmere inzichten per doel en een echte premium-ervaring. Deze functie komt eraan, maar is nog niet klaar voor gebruik.
        </Text>
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 17, fontFamily: 'Manrope_700Bold' }}>Wat eraan komt</Text>
        {[
          'Dagelijkse adviezen op basis van afvallen, onderhoud of spieropbouw',
          'Patroonherkenning zoals lage eiwitinname, snackmomenten en vezeltekorten',
          'Meer praktische aanbevelingen die passen bij jouw gelogde maaltijden',
        ].map((item) => (
          <View key={item} style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons color={colors.primary} name="checkmark-circle" size={18} />
            <Text style={{ color: colors.textSecondary, flex: 1, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
              {item}
            </Text>
          </View>
        ))}
      </Card>

      <PrimaryButton label="Terug naar overzicht" onPress={() => router.replace('/(tabs)')} />
      <SecondaryButton label="Terug" onPress={() => router.back()} />
    </ScreenContainer>
  );
}
