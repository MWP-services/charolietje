import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer contentStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingTop: 24 }}>
      <View style={{ gap: 24 }}>
        <View style={{ gap: 14 }}>
          <Text style={{ color: colors.primary, fontSize: 13, letterSpacing: 1.2, fontFamily: 'Manrope_700Bold' }}>NUTRIVOICE</Text>
          <Text style={{ color: colors.text, fontSize: 40, lineHeight: 48, fontFamily: 'Manrope_800ExtraBold' }}>
            Voeding tracken met je stem, zonder gedoe.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 26, fontFamily: 'Manrope_500Medium' }}>
            Vertel wat je hebt gegeten, controleer de transcriptie en krijg slimme voedingsinzichten met ingebouwde premium coaching.
          </Text>
        </View>

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
          style={{
            borderRadius: radii.xl,
            padding: 22,
            gap: 18,
            borderWidth: 1,
            borderColor: '#DCEDE6',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ gap: 6, flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>Van uitgesproken maaltijden naar dagelijks inzicht</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
                Transcriptie, voedingsanalyse, dagtotalen en AI-advies in een vloeiende flow.
              </Text>
            </View>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons color={colors.primary} name="mic" size={28} />
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {['Maaltijden loggen in seconden', 'Voortgang op eiwitten en calorieen', 'Premium coaching op basis van je doel'].map((item) => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons color={colors.primary} name="checkmark-circle" size={18} />
                <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{item}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      <View style={{ gap: 12 }}>
        <PrimaryButton label="Account aanmaken" onPress={() => router.push('/(auth)/register')} />
        <SecondaryButton label="Inloggen" onPress={() => router.push('/(auth)/login')} />
      </View>
    </ScreenContainer>
  );
}
