import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text } from 'react-native';
import { z } from 'zod';
import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/common/AppHeader';
import { AuthModeNotice } from '@/components/common/AuthModeNotice';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { GoalSelector } from '@/components/settings/GoalSelector';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';
import type { GoalType } from '@/types/profile';
import { settingsSchema } from '@/utils/validation';
import { colors } from '@/constants/colors';

type SettingsValues = z.input<typeof settingsSchema>;

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const session = useAuthStore((state) => state.session);
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const isLoading = useProfileStore((state) => state.isLoading);
  const clearMeals = useMealStore((state) => state.clearMeals);
  const { isRefreshing, refresh } = useAppDataRefresh();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      goal: profile?.goal ?? 'maintain',
      calorieTarget: profile?.calorie_target ? String(profile.calorie_target) : '',
      proteinTarget: profile?.protein_target ? String(profile.protein_target) : '',
    },
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    reset({
      fullName: profile.full_name ?? '',
      goal: profile.goal ?? 'maintain',
      calorieTarget: profile.calorie_target ? String(profile.calorie_target) : '',
      proteinTarget: profile.protein_target ? String(profile.protein_target) : '',
    });
  }, [profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile({
        full_name: values.fullName,
        goal: values.goal as GoalType,
        calorie_target: values.calorieTarget ? Number(values.calorieTarget) : null,
        protein_target: values.proteinTarget ? Number(values.proteinTarget) : null,
      });
      Alert.alert('Opgeslagen', 'Je instellingen zijn bijgewerkt.');
    } catch (error) {
      Alert.alert('Opslaan mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  });

  const handleDeleteAccount = () => {
    const title = session?.provider === 'guest' ? 'Gastgegevens verwijderen?' : 'Account verwijderen?';
    const message =
      session?.provider === 'guest'
        ? 'Je lokale gastgegevens en opgeslagen maaltijden worden van dit apparaat verwijderd. Deze actie kan niet ongedaan worden gemaakt.'
        : 'Je profiel, maaltijden en gekoppelde account worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.';

    Alert.alert(title, message, [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: session?.provider === 'guest' ? 'Verwijderen' : 'Account verwijderen',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setIsDeletingAccount(true);
              await deleteAccount();
              clearProfile();
              clearMeals();
              router.replace('/(auth)/welcome');
            } catch (error) {
              Alert.alert('Verwijderen mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
            } finally {
              setIsDeletingAccount(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScreenContainer loading={isLoading && !profile} loadingLabel="Je instellingen worden geladen..." onRefresh={refresh} refreshing={isRefreshing}>
      <AppHeader subtitle="Profiel, doelen, premiummodus en accountacties." title="Instellingen" />
      <AuthModeNotice compact />
      <Card style={{ gap: 16 }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FormField autoComplete="name" label="Naam" error={errors.fullName?.message} onChangeText={onChange} textContentType="name" value={value} />
          )}
        />
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14 }}>Doel</Text>
        <Controller
          control={control}
          name="goal"
          render={({ field: { onChange, value } }) => <GoalSelector onChange={onChange as (goal: GoalType) => void} value={value as GoalType} />}
        />
        <Controller
          control={control}
          name="calorieTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.calorieTarget?.message} inputMode="numeric" keyboardType="numeric" label="Caloriedoel" onChangeText={onChange} value={value ?? ''} />
          )}
        />
        <Controller
          control={control}
          name="proteinTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.proteinTarget?.message} inputMode="numeric" keyboardType="numeric" label="Eiwitdoel" onChangeText={onChange} value={value ?? ''} />
          )}
        />
        <PrimaryButton label="Instellingen opslaan" loading={isSubmitting} onPress={onSubmit} />
      </Card>

      <Card>
        <SettingsRow
          description="Premium Launch staat tijdelijk gratis open. Activeren of beheren doe je via het premium scherm."
          rightText={profile?.is_premium ? 'Actief' : 'Niet actief'}
          title="Premium plan"
        />
        <SettingsRow rightText={profile?.email ?? 'Geen e-mail'} title="Account" />
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.danger, fontFamily: 'Manrope_700Bold', fontSize: 16 }}>Gevarenzone</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium', fontSize: 14, lineHeight: 22 }}>
          {session?.provider === 'guest'
            ? 'Verwijder alle lokale gastgegevens van dit apparaat als je opnieuw wilt beginnen.'
            : 'Verwijder je account en alle gekoppelde voedingsdata permanent uit NutriVoice.'}
        </Text>
        <PrimaryButton
          accessibilityLabel={session?.provider === 'guest' ? 'Gastgegevens verwijderen' : 'Account verwijderen'}
          label={session?.provider === 'guest' ? 'Gastgegevens verwijderen' : 'Account verwijderen'}
          loading={isDeletingAccount}
          onPress={handleDeleteAccount}
          tone="danger"
        />
      </Card>

      <PrimaryButton label="Uitloggen" onPress={() => signOut()} />
    </ScreenContainer>
  );
}
