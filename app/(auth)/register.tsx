import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { registerSchema } from '@/utils/validation';

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, error, clearError, setPendingVerificationEmail } = useAuthStore();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: 'Micha Example',
      email: 'micha@nutrivoice.app',
      password: 'Password123',
      confirmPassword: 'Password123',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    try {
      const result = await signUp(values);
      if (result.requiresEmailVerification) {
        setPendingVerificationEmail(result.email);
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: result.email },
        });
        return;
      }

      router.replace('/(onboarding)/goals');
    } catch (submitError) {
      Alert.alert('Registratie mislukt', submitError instanceof Error ? submitError.message : 'Probeer het opnieuw.');
    }
  });

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader showBackButton subtitle="Maak je account aan en begin met tracken via je stem." title="Account aanmaken" />
      <InlineMessage
        description="Na registratie bevestig je eerst je e-mailadres. Daarna sturen we je automatisch door naar onboarding."
        title="Veilige accountactivatie"
      />
      <View style={{ gap: 18 }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FormField
              autoComplete="name"
              error={errors.fullName?.message}
              label="Volledige naam"
              onChangeText={onChange}
              placeholder="Jouw naam"
              returnKeyType="next"
              textContentType="name"
              value={value}
            />
          )}
        />
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
              autoComplete="new-password"
              error={errors.password?.message}
              label="Wachtwoord"
              onChangeText={onChange}
              placeholder="Minimaal 8 tekens"
              returnKeyType="next"
              secureTextEntry
              textContentType="newPassword"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              label="Bevestig wachtwoord"
              onChangeText={onChange}
              placeholder="Herhaal wachtwoord"
              returnKeyType="done"
              secureTextEntry
              textContentType="newPassword"
              value={value}
            />
          )}
        />
      </View>
      {error ? <Text style={{ color: colors.danger, fontFamily: 'Manrope_600SemiBold' }}>{error}</Text> : null}
      <PrimaryButton label="Account aanmaken" loading={isSubmitting} onPress={onSubmit} />
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        Heb je al een account?{' '}
        <Link href="/(auth)/login" style={{ color: colors.secondary, fontFamily: 'Manrope_700Bold' }}>
          Inloggen
        </Link>
      </Text>
    </ScreenContainer>
  );
}
