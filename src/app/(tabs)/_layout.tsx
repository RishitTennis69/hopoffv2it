import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { colors, fonts } from '@/theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ICONS: Record<string, FeatherName> = {
  progress: 'bar-chart-2',
  'lock-in': 'clock',
  videos: 'film',
  goals: 'target',
  apps: 'grid',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'none',
        lazy: false,
        freezeOnBlur: false,
        detachInactiveScreens: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color }) => <Feather name={ICONS[route.name]} size={20} color={color} />,
        tabBarButton: (props) => (
          <Pressable
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            testID={props.testID}
            accessibilityRole={props.accessibilityRole}
            accessibilityState={props.accessibilityState}
            accessibilityLabel={props.accessibilityLabel}
            style={props.style}
            android_ripple={{ color: 'transparent' }}>
            {props.children}
          </Pressable>
        ),
      })}>
      <Tabs.Screen name="progress" options={{ title: 'Progress', animation: 'none' }} />
      <Tabs.Screen name="lock-in" options={{ title: 'Lock In', animation: 'none' }} />
      <Tabs.Screen name="videos" options={{ title: 'Videos', animation: 'none' }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps', animation: 'none' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.glassBorder,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    height: Platform.OS === 'ios' ? 84 : 72,
    paddingTop: 8,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
});
