import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text } from 'react-native';
import { z } from 'zod';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { GoalSelector } from '@/components/settings/GoalSelector';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useAppDataRefresh } from '@/hooks/useAppDataRefresh';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import type { GoalType } from '@/types/profile';
import { settingsSchema } from '@/utils/validation';

type SettingsValues = z.input<typeof settingsSchema>;

export default function ProfileSettingsScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const isLoading = useProfileStore((state) => state.isLoading);
  const { isRefreshing, refresh } = useAppDataRefresh();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: profile?.full_name ?? '',
      calorieTarget: profile?.calorie_target ? String(profile.calorie_target) : '',
      proteinTarget: profile?.protein_target ? String(profile.protein_target) : '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile({
        full_name: values.fullName,
        calorie_target: values.calorieTarget ? Number(values.calorieTarget) : null,
        protein_target: values.proteinTarget ? Number(values.proteinTarget) : null,
      });
      Alert.alert('Opgeslagen', 'Je instellingen zijn bijgewerkt.');
    } catch (error) {
      Alert.alert('Opslaan mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  });

  return (
    <ScreenContainer loading={isLoading && !profile} loadingLabel="Je instellingen worden geladen..." onRefresh={refresh} refreshing={isRefreshing}>
      <AppHeader subtitle="Profiel, doelen, premiummodus en accountacties." title="Instellingen" />
      <Card style={{ gap: 16 }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FormField autoComplete="name" label="Naam" error={errors.fullName?.message} onChangeText={onChange} textContentType="name" value={value} />
          )}
        />
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14 }}>Doel</Text>
        <GoalSelector
          onChange={(goal) => {
            updateProfile({ goal: goal as GoalType });
          }}
          value={profile?.goal ?? 'maintain'}
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
          description="Schakel premiumfuncties in testmodus in."
          onSwitchChange={(value) => updateProfile({ is_premium: value })}
          switchValue={profile?.is_premium ?? false}
          title="Premium testschakelaar"
        />
        <SettingsRow rightText={profile?.email ?? 'Geen e-mail'} title="Account" />
      </Card>

      <PrimaryButton label="Uitloggen" onPress={() => signOut()} />
    </ScreenContainer>
  );
}
