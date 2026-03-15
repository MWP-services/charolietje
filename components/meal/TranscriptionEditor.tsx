import { Text, TextInput, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type TranscriptionEditorProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export const TranscriptionEditor = ({ value, onChangeText }: TranscriptionEditorProps) => (
  <Card style={{ gap: 12 }}>
    <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Controleer transcriptie</Text>
    <TextInput
      multiline
      onChangeText={onChangeText}
      placeholder="Beschrijf wat je hebt gegeten..."
      placeholderTextColor={colors.textMuted}
      style={{
        minHeight: 140,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: colors.text,
        fontSize: 15,
        lineHeight: 24,
        fontFamily: 'Manrope_500Medium',
        textAlignVertical: 'top',
      }}
      value={value}
    />
  </Card>
);
