import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { FormField } from '@/components/common/FormField';
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
  const { signUp, error, clearError } = useAuthStore();
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
      await signUp(values);
      router.replace('/(onboarding)/goals');
    } catch (submitError) {
      Alert.alert('Sign up failed', submitError instanceof Error ? submitError.message : 'Please try again.');
    }
  });

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader showBackButton subtitle="Create your account and start tracking with your voice." title="Create account" />
      <View style={{ gap: 18 }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.fullName?.message} label="Full name" onChangeText={onChange} placeholder="Your name" value={value} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.email?.message} label="Email" onChangeText={onChange} placeholder="you@example.com" value={value} />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormField
              error={errors.password?.message}
              label="Password"
              onChangeText={onChange}
              placeholder="Minimum 8 characters"
              secureTextEntry
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <FormField
              error={errors.confirmPassword?.message}
              label="Confirm password"
              onChangeText={onChange}
              placeholder="Repeat password"
              secureTextEntry
              value={value}
            />
          )}
        />
      </View>
      {error ? <Text style={{ color: colors.danger, fontFamily: 'Manrope_600SemiBold' }}>{error}</Text> : null}
      <PrimaryButton label="Create account" loading={isSubmitting} onPress={onSubmit} />
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        Already have an account?{' '}
        <Link href="/(auth)/login" style={{ color: colors.secondary, fontFamily: 'Manrope_700Bold' }}>
          Log in
        </Link>
      </Text>
    </ScreenContainer>
  );
}
