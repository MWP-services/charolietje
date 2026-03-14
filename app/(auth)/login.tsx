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
import { loginSchema } from '@/utils/validation';

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, error, clearError } = useAuthStore();
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
      Alert.alert('Login failed', submitError instanceof Error ? submitError.message : 'Please try again.');
    }
  });

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader showBackButton subtitle="Welcome back to smarter nutrition tracking." title="Log in" />
      <View style={{ gap: 18 }}>
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
      </View>
      {error ? <Text style={{ color: colors.danger, fontFamily: 'Manrope_600SemiBold' }}>{error}</Text> : null}
      <PrimaryButton label="Log in" loading={isSubmitting} onPress={onSubmit} />
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
        New here?{' '}
        <Link href="/(auth)/register" style={{ color: colors.secondary, fontFamily: 'Manrope_700Bold' }}>
          Create an account
        </Link>
      </Text>
    </ScreenContainer>
  );
}
