import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  tone?: 'primary' | 'danger';
};

export const PrimaryButton = ({ label, onPress, disabled, loading, icon, accessibilityLabel, tone = 'primary' }: PrimaryButtonProps) => (
  <Pressable
    accessibilityLabel={accessibilityLabel ?? label}
    accessibilityRole="button"
    accessibilityState={{ busy: Boolean(loading), disabled: Boolean(disabled || loading) }}
    disabled={disabled || loading}
    onPress={onPress}
    style={({ pressed }) => ({
      opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
      transform: [{ scale: pressed ? 0.985 : 1 }],
      minHeight: 54,
      borderRadius: radii.pill,
      backgroundColor: tone === 'danger' ? colors.danger : colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 22,
    })}>
    {loading ? (
      <ActivityIndicator color={colors.surface} />
    ) : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {icon}
        <Text style={{ color: colors.surface, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
      </View>
    )}
  </Pressable>
);
