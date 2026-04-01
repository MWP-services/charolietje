import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { demoService } from '@/services/demo/demoService';
import { notificationService } from '@/services/notifications/notificationService';
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
      <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>NutriVoice wordt gestart...</Text>
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
  const initialize = useAuthStore((state) => state.initialize);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const isProfileLoading = useProfileStore((state) => state.isLoading);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const loadMeals = useMealStore((state) => state.loadMeals);
  const clearMeals = useMealStore((state) => state.clearMeals);
  const meals = useMealStore((state) => state.meals);
  const isMealsLoading = useMealStore((state) => state.isLoading);
  const demoInitializationRef = useRef<string | null>(null);

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
      clearMeals();
      return;
    }

    void Promise.allSettled([loadProfile(session.userId, session.email), loadMeals(session.userId)]);
  }, [clearMeals, clearProfile, loadMeals, loadProfile, session]);

  useEffect(() => {
    if (!session || !profile || isProfileLoading || isMealsLoading) {
      return;
    }

    if (profile.has_received_demo) {
      demoInitializationRef.current = session.userId;
      return;
    }

    if (demoInitializationRef.current === session.userId) {
      return;
    }

    demoInitializationRef.current = session.userId;
    void (async () => {
      try {
        const result = await demoService.initializeForUser(profile, meals);
        if (result.mealsSeeded) {
          await loadMeals(session.userId);
        }
        await loadProfile(session.userId, session.email);
      } catch (error) {
        console.warn('Demo initialization failed:', error);
        demoInitializationRef.current = null;
      }
    })();
  }, [isMealsLoading, isProfileLoading, loadMeals, loadProfile, meals, profile, session]);

  useEffect(() => {
    if (!session || !profile) {
      void notificationService.cancelSmartReminders();
      return;
    }

    void notificationService.syncSmartReminders({
      profile,
      meals,
      userId: session.userId,
    });
  }, [meals, profile, session]);

  useEffect(() => {
    if (isInitializing || !loaded) {
      return;
    }

    const group = segments[0];
    const inAuth = group === '(auth)';
    const inDirectAuth = group === 'auth';
    const inOnboarding = group === '(onboarding)';

    if (!session && !inAuth && !inDirectAuth) {
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
        <Stack.Screen name="meal/barcode-scan" />
        <Stack.Screen name="meal/[id]" />
        <Stack.Screen name="meal/edit/[id]" />
        <Stack.Screen name="day/[date]" />
        <Stack.Screen name="premium/activate" />
        <Stack.Screen name="auth" />
      </Stack>
    </ThemeProvider>
  );
}
