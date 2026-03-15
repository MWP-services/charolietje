import { Text, TextInput, View, type KeyboardTypeOptions, type ReturnKeyTypeOptions, type TextInputProps } from 'react-native';

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
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: ReturnKeyTypeOptions;
  inputMode?: TextInputProps['inputMode'];
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
  autoCapitalize = 'sentences',
  autoCorrect = false,
  autoComplete,
  textContentType,
  returnKeyType,
  inputMode,
}: FormFieldProps) => (
  <View style={{ gap: 8 }}>
    <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
    <TextInput
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      autoCorrect={autoCorrect}
      inputMode={inputMode}
      keyboardType={keyboardType}
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      returnKeyType={returnKeyType}
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
      textContentType={textContentType}
      value={value}
    />
    {error ? <Text style={{ color: colors.danger, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>{error}</Text> : null}
  </View>
);
