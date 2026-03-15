import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { loginSchema } from '@/utils/validation';

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verified?: string }>();
  const { signIn, continueAsGuest, error, clearError, setPendingVerificationEmail } = useAuthStore();
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'micha@nutrivoice.app',
      password: 'Password123',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    try {
      await signIn(values);
      router.replace('/(tabs)');
    } catch (submitError) {
      if (submitError instanceof Error && /email.*confirmed|email.*verification|not confirmed/i.test(submitError.message)) {
        setPendingVerificationEmail(values.email);
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: values.email },
        });
        return;
      }

      Alert.alert('Inloggen mislukt', submitError instanceof Error ? submitError.message : 'Probeer het opnieuw.');
    }
  });

  const onContinueAsGuest = async () => {
    clearError();
    try {
      setIsGuestLoading(true);
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch (guestError) {
      Alert.alert('Gastmodus mislukt', guestError instanceof Error ? guestError.message : 'Probeer het opnieuw.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader showBackButton subtitle="Welkom terug bij slimmer voeding tracken." title="Inloggen" />
      {params.verified === '1' ? (
        <InlineMessage
          description="Je e-mailadres is bevestigd. Log nu in om door te gaan met onboarding of direct naar je dashboard te gaan."
          title="Je account is geverifieerd"
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
              inputMode="email"
              error={errors.email?.message}
              label="E-mail"
              onChangeText={onChange}
              placeholder="jij@voorbeeld.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="current-password"
              error={errors.password?.message}
              label="Wachtwoord"
              onChangeText={onChange}
              placeholder="Minimaal 8 tekens"
              returnKeyType="done"
              secureTextEntry
              textContentType="password"
              value={value}
            />
          )}
        />
      </View>
      {error ? <Text style={{ color: colors.danger, fontFamily: 'Manrope_600SemiBold' }}>{error}</Text> : null}
      <PrimaryButton label="Inloggen" loading={isSubmitting} onPress={onSubmit} />
      <SecondaryButton label={isGuestLoading ? 'Gastmodus openen...' : 'Ga verder als gast'} onPress={onContinueAsGuest} disabled={isSubmitting || isGuestLoading} />
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        In gastmodus kun je de app gebruiken en maaltijden typen, maar spraaktranscriptie is uitgeschakeld.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        <Link href="/(auth)/forgot-password" style={{ color: colors.secondary, fontFamily: 'Manrope_700Bold' }}>
          Wachtwoord vergeten?
        </Link>
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        Nieuw hier?{' '}
        <Link href="/(auth)/register" style={{ color: colors.secondary, fontFamily: 'Manrope_700Bold' }}>
          Maak een account aan
        </Link>
      </Text>
    </ScreenContainer>
  );
}
