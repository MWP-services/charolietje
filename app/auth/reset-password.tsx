import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { resetPasswordSchema } from '@/utils/validation';

type ResetPasswordValues = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const isPasswordRecoveryFlow = useAuthStore((state) => state.isPasswordRecoveryFlow);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const setPasswordRecoveryFlow = useAuthStore((state) => state.setPasswordRecoveryFlow);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const hasRecoverySession = isPasswordRecoveryFlow || session?.provider === 'supabase';

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updatePassword(values.password);
      setPasswordRecoveryFlow(false);
      Alert.alert('Wachtwoord bijgewerkt', 'Je nieuwe wachtwoord is opgeslagen. Je kunt nu veilig verder.');
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Wachtwoord wijzigen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  });

  if (!hasRecoverySession) {
    return (
      <ScreenContainer contentStyle={{ gap: 24 }}>
        <AppHeader subtitle="Deze pagina werkt alleen via een geldige herstel-link uit je e-mail." title="Link verlopen of ongeldig" />
        <EmptyState
          description="Vraag een nieuwe wachtwoordherstel-link aan vanuit het inlogscherm en open die link opnieuw op je iPhone."
          icon="lock-closed-outline"
          title="Geen geldige herstelsessie"
        />
        <PrimaryButton label="Nieuwe resetlink aanvragen" onPress={() => router.replace('/(auth)/forgot-password')} />
        <SecondaryButton label="Terug naar inloggen" onPress={() => router.replace('/(auth)/login')} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader subtitle="Kies een sterk nieuw wachtwoord voor je account." title="Nieuw wachtwoord instellen" />

      <InlineMessage
        description="Na het opslaan sluiten we deze herstelstap af en ga je direct verder in de app."
        title="Je herstel-link is bevestigd"
        tone="success"
      />

      <View style={{ gap: 18 }}>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormField
              autoCapitalize="none"
              autoComplete="new-password"
              error={errors.password?.message}
              label="Nieuw wachtwoord"
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
              label="Bevestig nieuw wachtwoord"
              onChangeText={onChange}
              placeholder="Herhaal je nieuwe wachtwoord"
              returnKeyType="done"
              secureTextEntry
              textContentType="newPassword"
              value={value}
            />
          )}
        />
      </View>

      <PrimaryButton label="Nieuw wachtwoord opslaan" loading={isSubmitting} onPress={onSubmit} />
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        Gebruik een uniek wachtwoord dat je nog niet voor andere diensten gebruikt.
      </Text>
    </ScreenContainer>
  );
}
