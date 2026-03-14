import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Card = ({ children, style }: CardProps) => (
  <View
    style={[
      {
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
        shadowColor: colors.shadow,
        shadowOpacity: 1,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 2,
      },
      style,
    ]}>
    {children}
  </View>
);
