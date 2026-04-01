import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { colors } from '@/constants/colors';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  showBackButton?: boolean;
  backHref?: Href;
};

export const AppHeader = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  showBackButton = false,
  backHref = '/(tabs)',
}: AppHeaderProps) => {
  const router = useRouter();

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          {showBackButton ? (
            <Pressable
              accessibilityLabel="Ga terug"
              accessibilityRole="button"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                  return;
                }

                router.replace(backHref);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}>
              <Ionicons color={colors.text} name="chevron-back" size={20} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontFamily: 'Manrope_800ExtraBold' }}>{title}</Text>
            {subtitle ? (
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: 'Manrope_500Medium' }}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        {actionLabel && onActionPress ? (
          <Pressable accessibilityLabel={actionLabel} accessibilityRole="button" onPress={onActionPress}>
            <Text style={{ color: colors.secondary, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};
