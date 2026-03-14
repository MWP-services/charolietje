import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

export const OfflineBanner = () => (
  <View
    style={{
      backgroundColor: '#FFF3D6',
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: '#F6DCA5',
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    }}>
    <Ionicons color={colors.warning} name="cloud-offline-outline" size={18} style={{ marginTop: 1 }} />
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>You’re offline</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Manrope_500Medium' }}>
        Local screens still work, but synced saves and future cloud AI features may be limited until you reconnect.
      </Text>
    </View>
  </View>
);
