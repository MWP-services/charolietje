import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { forgotPasswordSchema } from '@/utils/validation';

type ForgotPasswordValues = {
  email: string;
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const [hasSent, setHasSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
      setHasSent(true);
    } catch (error) {
      Alert.alert('Resetlink versturen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  });

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader showBackButton subtitle="Vul je e-mailadres in en we sturen je een veilige link om opnieuw in te stellen." title="Wachtwoord vergeten" />

      {hasSent ? (
        <InlineMessage
          description={`We hebben een resetlink gestuurd naar ${submittedEmail}. Open de link op je toestel en NutriVoice brengt je meteen naar het scherm om een nieuw wachtwoord te kiezen.`}
          title="Resetlink verstuurd"
          tone="success"
        />
      ) : null}

      <View style={{ gap: 18 }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
              inputMode="email"
              label="E-mail"
              onChangeText={onChange}
              placeholder="jij@voorbeeld.com"
              returnKeyType="done"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />
      </View>

      <PrimaryButton label="Resetlink versturen" loading={isSubmitting} onPress={onSubmit} />

      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        Weet je je wachtwoord toch weer?{' '}
        <Link href="/(auth)/login" style={{ color: colors.secondary, fontFamily: 'Manrope_700Bold' }}>
          Ga terug naar inloggen
        </Link>
      </Text>
    </ScreenContainer>
  );
}
