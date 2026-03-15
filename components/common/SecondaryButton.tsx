import { Pressable, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type SecondaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export const SecondaryButton = ({ label, onPress, disabled, accessibilityLabel }: SecondaryButtonProps) => (
  <Pressable
    accessibilityLabel={accessibilityLabel ?? label}
    accessibilityRole="button"
    accessibilityState={{ disabled: Boolean(disabled) }}
    disabled={disabled}
    onPress={onPress}
    style={({ pressed }) => ({
      opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
      minHeight: 52,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 22,
    })}>
    <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
  </Pressable>
);
