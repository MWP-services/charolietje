import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { AuthModeNotice } from '@/components/common/AuthModeNotice';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const pendingEmail = useAuthStore((state) => state.pendingVerificationEmail);
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail);
  const setPendingVerificationEmail = useAuthStore((state) => state.setPendingVerificationEmail);
  const [isResending, setIsResending] = useState(false);

  const email = params.email ?? pendingEmail ?? '';

  const onResend = async () => {
    if (!email) {
      Alert.alert('Geen e-mailadres gevonden', 'Ga terug en maak je account opnieuw aan of log in.');
      return;
    }

    try {
      setIsResending(true);
      await resendVerificationEmail(email);
      Alert.alert('Verificatiemail verstuurd', 'We hebben een nieuwe verificatiemail naar je inbox gestuurd.');
    } catch (error) {
      Alert.alert('Opnieuw versturen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader
        showBackButton
        subtitle="Bevestig eerst je e-mailadres om je account veilig te activeren en daarna verder te gaan met onboarding."
        title="Controleer je e-mail"
      />
      <AuthModeNotice />

      <InlineMessage
        description={email ? `We hebben een verificatielink gestuurd naar ${email}. Open die link op je iPhone om je account direct te activeren.` : 'We hebben een verificatielink gestuurd naar je inbox.'}
        title="Je account wacht op verificatie"
        tone="info"
      />

      <View style={{ gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 26, fontFamily: 'Manrope_500Medium' }}>
          Zodra je op de link in de e-mail klikt, opent NutriVoice automatisch en zetten we je door naar de volgende stap.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
          Zie je niets binnen een paar minuten? Controleer ook je spammap of stuur de e-mail opnieuw.
        </Text>
      </View>

      <PrimaryButton label={isResending ? 'Verificatiemail verzenden...' : 'Verificatiemail opnieuw sturen'} loading={isResending} onPress={onResend} />
      <SecondaryButton
        label="Terug naar inloggen"
        onPress={() => {
          setPendingVerificationEmail(email || null);
          router.replace('/(auth)/login');
        }}
      />
    </ScreenContainer>
  );
}
