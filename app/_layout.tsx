import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Redirect, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

function BootScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Preparing NutriVoice...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const router = useRouter();
  const segments = useSegments();
  const { initialize, isInitializing, session } = useAuthStore();
  const { profile, isLoading: isProfileLoading, loadProfile, clearProfile } = useProfileStore();
  const { loadMeals } = useMealStore();

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (!session) {
      clearProfile();
      return;
    }

    loadProfile(session.userId, session.email);
    loadMeals(session.userId);
  }, [clearProfile, loadMeals, loadProfile, session]);

  useEffect(() => {
    if (isInitializing || !loaded) {
      return;
    }

    const group = segments[0];
    const inAuth = group === '(auth)';
    const inOnboarding = group === '(onboarding)';

    if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (session && !profile) {
      return;
    }

    if (session && profile && !profile.has_completed_onboarding && !inOnboarding) {
      router.replace('/(onboarding)/goals');
      return;
    }

    if (session && profile?.has_completed_onboarding && (inAuth || inOnboarding || !group)) {
      router.replace('/(tabs)');
    }
  }, [isInitializing, loaded, profile, router, segments, session]);

  if (!loaded || isInitializing || (session && isProfileLoading && !profile)) {
    return <BootScreen />;
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meal/log" />
        <Stack.Screen name="meal/result" />
        <Stack.Screen name="meal/[id]" />
        <Stack.Screen name="meal/edit/[id]" />
        <Stack.Screen name="day/[date]" />
      </Stack>
    </ThemeProvider>
  );
}
