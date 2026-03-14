import { Pressable, Text, View } from 'react-native';

import { goalOptions } from '@/constants/goals';
import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';
import type { GoalType } from '@/types/profile';

type GoalSelectorProps = {
  value: GoalType;
  onChange: (goal: GoalType) => void;
};

export const GoalSelector = ({ value, onChange }: GoalSelectorProps) => (
  <View style={{ gap: 10 }}>
    {goalOptions.map((goal) => {
      const selected = goal.value === value;
      return (
        <Pressable
          key={goal.value}
          accessibilityRole="button"
          onPress={() => onChange(goal.value)}
          style={{
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            padding: 16,
            gap: 4,
          }}>
          <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>{goal.label}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_500Medium' }}>
            {goal.description}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
