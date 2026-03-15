import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';
import { z } from 'zod';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { GoalSelector } from '@/components/settings/GoalSelector';
import { colors } from '@/constants/colors';
import { useProfileStore } from '@/store/profileStore';
import { goalsSchema } from '@/utils/validation';

type GoalsValues = z.input<typeof goalsSchema>;

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
      Alert.alert('Onboarding opslaan mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  });

  return (
    <ScreenContainer contentStyle={{ gap: 24 }}>
      <AppHeader subtitle="Laat NutriVoice weten wat voor jou succes betekent." title="Stel je doel in" />
      <View style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Hoofddoel</Text>
        <Controller
          control={control}
          name="goal"
          render={({ field: { onChange, value } }) => <GoalSelector onChange={onChange} value={value} />}
        />
      </View>

      <Card style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Optionele doelen</Text>
        <Controller
          control={control}
          name="calorieTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.calorieTarget?.message} inputMode="numeric" keyboardType="numeric" label="Caloriedoel" onChangeText={onChange} placeholder="2600" value={value ?? ''} />
          )}
        />
        <Controller
          control={control}
          name="proteinTarget"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.proteinTarget?.message} inputMode="numeric" keyboardType="numeric" label="Eiwitdoel" onChangeText={onChange} placeholder="180" value={value ?? ''} />
          )}
        />
      </Card>

      <Card style={{ gap: 16 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Profielgegevens</Text>
        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.age?.message} inputMode="numeric" keyboardType="numeric" label="Leeftijd" onChangeText={onChange} placeholder="31" value={value ?? ''} />
          )}
        />
        <Controller
          control={control}
          name="weight"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.weight?.message} inputMode="decimal" keyboardType="numeric" label="Gewicht (kg)" onChangeText={onChange} placeholder="78" value={value ?? ''} />
          )}
        />
        <Controller
          control={control}
          name="height"
          render={({ field: { onChange, value } }) => (
            <FormField error={errors.height?.message} inputMode="numeric" keyboardType="numeric" label="Lengte (cm)" onChangeText={onChange} placeholder="182" value={value ?? ''} />
          )}
        />
      </Card>

      <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
        Huidig doel:{' '}
        <Text style={{ color: colors.text, fontFamily: 'Manrope_700Bold' }}>
          {watch('goal') === 'lose_weight'
            ? 'afvallen'
            : watch('goal') === 'build_muscle'
              ? 'spieren opbouwen'
              : 'gewicht behouden'}
        </Text>
      </Text>

      <PrimaryButton label="Verder naar overzicht" loading={isSubmitting} onPress={onSubmit} />
    </ScreenContainer>
  );
}
