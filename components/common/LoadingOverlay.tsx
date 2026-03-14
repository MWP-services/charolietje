import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type LoadingOverlayProps = {
  visible: boolean;
  label?: string;
};

export const LoadingOverlay = ({ visible, label = 'Loading...' }: LoadingOverlayProps) => {
  if (!visible) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 24,
          paddingHorizontal: 24,
          paddingVertical: 20,
          alignItems: 'center',
          gap: 12,
        }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{label}</Text>
      </View>
    </View>
  );
};
