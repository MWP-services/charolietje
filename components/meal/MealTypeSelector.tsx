import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { mealTypeOptions } from '@/constants/goals';
import { radii } from '@/constants/radii';
import type { MealType } from '@/types/meal';

type MealTypeSelectorProps = {
  value: MealType;
  onChange: (value: MealType) => void;
};

export const MealTypeSelector = ({ value, onChange }: MealTypeSelectorProps) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
    {mealTypeOptions.map((option) => {
      const active = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: active ? colors.primarySoft : colors.surface,
            borderWidth: 1,
            borderColor: active ? colors.primary : colors.border,
          }}>
          <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);
