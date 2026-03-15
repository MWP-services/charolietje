import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64 + Math.max(insets.bottom, 14),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 14),
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope_700Bold',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overzicht',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historie',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="calendar-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="premium"
        options={{
          title: 'Premium',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="sparkles-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Instellingen',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="settings-outline" size={size} />,
        }}
      />
    </Tabs>
  );
}
