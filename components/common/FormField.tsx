import { Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  multiline?: boolean;
};

export const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  error,
  multiline,
}: FormFieldProps) => (
  <View style={{ gap: 8 }}>
    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
    <TextInput
      keyboardType={keyboardType}
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      style={{
        minHeight: multiline ? 120 : 54,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: error ? colors.danger : colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingVertical: multiline ? 16 : 0,
        color: colors.text,
        fontSize: 15,
        fontFamily: 'Manrope_500Medium',
        textAlignVertical: multiline ? 'top' : 'center',
      }}
      value={value}
    />
    {error ? <Text style={{ color: colors.danger, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>{error}</Text> : null}
  </View>
);
