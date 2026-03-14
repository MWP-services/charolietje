import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type InlineMessageProps = {
  tone?: 'error' | 'info' | 'success';
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const InlineMessage = ({
  tone = 'info',
  title,
  description,
  actionLabel,
  onActionPress,
}: InlineMessageProps) => {
  const palette =
    tone === 'error'
      ? { background: '#FFF1F3', border: '#FFD4DB', title: colors.danger }
      : tone === 'success'
        ? { background: '#ECFDF3', border: '#C9F1D8', title: colors.success }
        : { background: '#EEF7FF', border: '#CFE7FA', title: colors.secondary };

  return (
    <View
      style={{
        backgroundColor: palette.background,
        borderWidth: 1,
        borderColor: palette.border,
        borderRadius: radii.lg,
        padding: 14,
        gap: 6,
      }}>
      <Text style={{ color: palette.title, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{title}</Text>
      {description ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_500Medium' }}>{description}</Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} style={{ marginTop: 2 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};
