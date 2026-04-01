import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import { AppHeader } from '@/components/common/AppHeader';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

type CallbackState =
  | { status: 'loading'; title: string; description: string }
  | { status: 'error'; title: string; description: string }
  | { status: 'success'; title: string; description: string };

export default function AuthCallbackScreen() {
  const router = useRouter();
  const currentUrl = Linking.useURL();
  const handleAuthRedirect = useAuthStore((state) => state.handleAuthRedirect);
  const setPasswordRecoveryFlow = useAuthStore((state) => state.setPasswordRecoveryFlow);
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
    title: 'Je beveiligde link wordt gecontroleerd',
    description: 'We verwerken je link en brengen je daarna automatisch naar de juiste plek in de app.',
  });
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) {
      return;
    }

    hasHandled.current = true;

    const processLink = async () => {
      try {
        const url = currentUrl ?? (await Linking.getInitialURL());
        if (!url) {
          throw new Error('Er is geen geldige authenticatielink gevonden.');
        }

        const result = await handleAuthRedirect(url);
        if (result.status === 'password_recovery') {
          setPasswordRecoveryFlow(true);
          router.replace('/auth/reset-password');
          return;
        }

        if (result.status === 'email_verified' || result.status === 'session_restored') {
          setCallbackState({
            status: 'success',
            title: 'Je account is bevestigd',
            description: 'NutriVoice opent nu je account zodat je meteen verder kunt.',
          });
          router.replace(result.session ? '/(tabs)' : '/(auth)/login?verified=1');
          return;
        }

        throw new Error('De link bevatte geen bruikbare verificatie- of herstelinformatie.');
      } catch (error) {
        setCallbackState({
          status: 'error',
          title: 'Authenticatielink verwerken mislukt',
          description: error instanceof Error ? error.message : 'Probeer de link opnieuw te openen of vraag een nieuwe e-mail aan.',
        });
      }
    };

    void processLink();
  }, [currentUrl, handleAuthRedirect, router, setPasswordRecoveryFlow]);

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader subtitle="Hier verwerken we verificatie- en herstellinks uit je e-mail." title="Beveiligde link verwerken" />

      {callbackState.status === 'loading' ? (
        <View style={{ gap: 16 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>{callbackState.title}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 24, fontFamily: 'Manrope_500Medium' }}>{callbackState.description}</Text>
        </View>
      ) : (
        <InlineMessage description={callbackState.description} title={callbackState.title} tone={callbackState.status === 'error' ? 'error' : 'success'} />
      )}

      {callbackState.status === 'error' ? (
        <>
          <PrimaryButton label="Terug naar inloggen" onPress={() => router.replace('/(auth)/login')} />
          <SecondaryButton label="Nieuwe resetlink aanvragen" onPress={() => router.replace('/(auth)/forgot-password')} />
        </>
      ) : null}
    </ScreenContainer>
  );
}
