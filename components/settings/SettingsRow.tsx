import { Switch, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type SettingsRowProps = {
  title: string;
  description?: string;
  rightText?: string;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
};

export const SettingsRow = ({
  title,
  description,
  rightText,
  switchValue,
  onSwitchChange,
}: SettingsRowProps) => (
  <View
    style={{
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 14,
      alignItems: 'center',
    }}>
    <View style={{ flex: 1, gap: 3 }}>
      <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold' }}>{title}</Text>
      {description ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_500Medium' }}>
          {description}
        </Text>
      ) : null}
    </View>
    {typeof switchValue === 'boolean' && onSwitchChange ? (
      <Switch onValueChange={onSwitchChange} thumbColor={colors.surface} trackColor={{ false: '#D4E5DE', true: colors.primary }} value={switchValue} />
    ) : (
      <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{rightText}</Text>
    )}
  </View>
);
