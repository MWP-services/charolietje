import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';
import { z } from 'zod';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { GoalSelector } from '@/components/settings/GoalSelector';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import type { GoalType } from '@/types/profile';
import { settingsSchema } from '@/utils/validation';

type SettingsValues = z.input<typeof settingsSchema>;

export default function ProfileSettingsScreen() {
  const { signOut } = useAuthStore();
  const { profile, updateProfile } = useProfileStore();
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
      Alert.alert('Saved', 'Your settings were updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Please try again.');
    }
  });

  return (
    <ScreenContainer>
      <AppHeader subtitle="Profile, targets, premium mode, and account actions." title="Settings" />
      <Card style={{ gap: 16 }}>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.fullName?.message} label="Name" onChangeText={onChange} value={value} />
          )}
        />
        <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14 }}>Goal</Text>
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
            <FormField error={errors.calorieTarget?.message} keyboardType="numeric" label="Calorie target" onChangeText={onChange} value={value ?? ''} />
          )}
        />
        <Controller
          control={control}
          name="proteinTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.proteinTarget?.message} keyboardType="numeric" label="Protein target" onChangeText={onChange} value={value ?? ''} />
          )}
        />
        <PrimaryButton label="Save settings" loading={isSubmitting} onPress={onSubmit} />
      </Card>

      <Card>
        <SettingsRow
          description="Enable premium features in mock mode for testing."
          onSwitchChange={(value) => updateProfile({ is_premium: value })}
          switchValue={profile?.is_premium ?? false}
          title="Premium mock toggle"
        />
        <SettingsRow rightText={profile?.email ?? 'No email'} title="Account" />
      </Card>

      <PrimaryButton label="Log out" onPress={() => signOut()} />
    </ScreenContainer>
  );
}
