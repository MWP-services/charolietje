import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { GoalSelector } from '@/components/settings/GoalSelector';
import { colors } from '@/constants/colors';
import { useProfileStore } from '@/store/profileStore';
import type { GoalType } from '@/types/profile';
import { goalsSchema } from '@/utils/validation';

type GoalsValues = {
  goal: GoalType;
  calorieTarget: string;
  proteinTarget: string;
  age: string;
  weight: string;
  height: string;
};

export default function OnboardingGoalsScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GoalsValues>({
    resolver: zodResolver(goalsSchema),
    defaultValues: {
      goal: profile?.goal ?? 'build_muscle',
      calorieTarget: profile?.calorie_target ? String(profile.calorie_target) : '',
      proteinTarget: profile?.protein_target ? String(profile.protein_target) : '',
      age: profile?.age ? String(profile.age) : '',
      weight: profile?.weight_kg ? String(profile.weight_kg) : '',
      height: profile?.height_cm ? String(profile.height_cm) : '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile({
        goal: values.goal,
        calorie_target: values.calorieTarget ? Number(values.calorieTarget) : null,
        protein_target: values.proteinTarget ? Number(values.proteinTarget) : null,
        age: values.age ? Number(values.age) : null,
        weight_kg: values.weight ? Number(values.weight) : null,
        height_cm: values.height ? Number(values.height) : null,
        has_completed_onboarding: true,
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not save onboarding', error instanceof Error ? error.message : 'Please try again.');
    }
  });

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader subtitle="Tell NutriVoice what success looks like for you." title="Set your goal" />
      <View style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Primary goal</Text>
        <Controller
          control={control}
          name="goal"
          render={({ field: { onChange, value } }) => <GoalSelector onChange={onChange} value={value} />}
        />
      </View>

      <Card style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Optional targets</Text>
        <Controller
          control={control}
          name="calorieTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.calorieTarget?.message} keyboardType="numeric" label="Calorie target" onChangeText={onChange} placeholder="2600" value={value} />
          )}
        />
        <Controller
          control={control}
          name="proteinTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.proteinTarget?.message} keyboardType="numeric" label="Protein target" onChangeText={onChange} placeholder="180" value={value} />
          )}
        />
      </Card>

      <Card style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Profile basics</Text>
        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.age?.message} keyboardType="numeric" label="Age" onChangeText={onChange} placeholder="31" value={value} />
          )}
        />
        <Controller
          control={control}
          name="weight"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.weight?.message} keyboardType="numeric" label="Weight (kg)" onChangeText={onChange} placeholder="78" value={value} />
          )}
        />
        <Controller
          control={control}
          name="height"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.height?.message} keyboardType="numeric" label="Height (cm)" onChangeText={onChange} placeholder="182" value={value} />
          )}
        />
      </Card>

      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
        Current goal: <Text style={{ color: colors.text, fontFamily: 'Manrope_700Bold' }}>{watch('goal').replace('_', ' ')}</Text>
      </Text>

      <PrimaryButton label="Continue to dashboard" loading={isSubmitting} onPress={onSubmit} />
    </ScreenContainer>
  );
}
