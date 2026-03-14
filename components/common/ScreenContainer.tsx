import { ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/common/OfflineBanner';
import { colors } from '@/constants/colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export const ScreenContainer = ({ children, scroll = true, contentStyle }: ScreenContainerProps) => {
  const { isConnected, isChecking } = useNetworkStatus();

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={[
            {
              paddingHorizontal: 20,
              paddingBottom: 32,
              paddingTop: 12,
              gap: 18,
            },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {!isChecking && !isConnected ? <OfflineBanner /> : null}
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          {
            flex: 1,
            paddingHorizontal: 20,
            paddingBottom: 32,
            paddingTop: 12,
          },
          contentStyle,
        ]}>
        {!isChecking && !isConnected ? <OfflineBanner /> : null}
        {children}
      </View>
    </SafeAreaView>
  );
};
