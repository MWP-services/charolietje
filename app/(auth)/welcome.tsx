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
            Voice-first nutrition tracking that actually feels easy.
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 16, lineHeight: 26, fontFamily: 'Manrope_500Medium' }}>
            Speak what you ate, review the transcript, and get smart nutrition insights with premium coaching built in.
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
              <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_800ExtraBold' }}>From spoken meals to daily clarity</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
                Transcription, nutrition extraction, daily totals, and AI advice in one flow.
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
            {['Voice logging in seconds', 'Protein and calorie progress', 'Premium goal-based coaching'].map((item) => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons color={colors.primary} name="checkmark-circle" size={18} />
                <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{item}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      <View style={{ gap: 12 }}>
        <PrimaryButton label="Create account" onPress={() => router.push('/(auth)/register')} />
        <SecondaryButton label="Log in" onPress={() => router.push('/(auth)/login')} />
      </View>
    </ScreenContainer>
  );
}
