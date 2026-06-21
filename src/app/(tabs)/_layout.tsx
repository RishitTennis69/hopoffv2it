import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { colors, fonts } from '@/theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ICONS: Record<string, FeatherName> = {
  progress: 'bar-chart-2',
  videos: 'film',
  goals: 'target',
  apps: 'grid',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ color }) => <Feather name={ICONS[route.name]} size={20} color={color} />,
      })}>
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="videos" options={{ title: 'Videos' }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
      <Tabs.Screen name="apps" options={{ title: 'Apps' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.dark,
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
