import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { colors } from '@/constants/colors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

type ScreenContainerProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  loadingLabel?: string;
};

export const ScreenContainer = ({
  children,
  scroll = true,
  contentStyle,
  refreshing = false,
  onRefresh,
  loading = false,
  loadingLabel,
}: ScreenContainerProps) => {
  const { isConnected, isChecking } = useNetworkStatus();

  if (scroll) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              {
                flexGrow: 1,
                paddingHorizontal: 20,
                paddingBottom: 32,
                paddingTop: 12,
                gap: 18,
              },
              contentStyle,
            ]}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? <RefreshControl colors={[colors.primary]} onRefresh={onRefresh} refreshing={refreshing} tintColor={colors.primary} /> : undefined
            }
            showsVerticalScrollIndicator={false}>
            {!isChecking && !isConnected ? <OfflineBanner /> : null}
            {children}
          </ScrollView>
          <LoadingOverlay label={loadingLabel} visible={loading} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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
        <LoadingOverlay label={loadingLabel} visible={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
