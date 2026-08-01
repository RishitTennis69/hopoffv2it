import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Visual =
  | { kind: 'brand'; name: React.ComponentProps<typeof FontAwesome6>['name']; bg: string; fg: string }
  | { kind: 'material'; name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; bg: string; fg: string };

const VISUALS: Record<string, Visual> = {
  strava: { kind: 'brand', name: 'strava', bg: '#FC4C02', fg: '#FFFFFF' },
  'nike-run-club': { kind: 'material', name: 'run-fast', bg: '#111111', fg: '#FFFFFF' },
  fitbit: { kind: 'material', name: 'watch-variant', bg: '#00B0B9', fg: '#FFFFFF' },
  'google-fit': { kind: 'material', name: 'heart-pulse', bg: '#34A853', fg: '#FFFFFF' },
  myfitnesspal: { kind: 'material', name: 'food-apple', bg: '#0057FF', fg: '#FFFFFF' },
  duolingo: { kind: 'material', name: 'translate', bg: '#58CC02', fg: '#FFFFFF' },
  kindle: { kind: 'material', name: 'book-open-page-variant', bg: '#2B4B7C', fg: '#FFFFFF' },
  audible: { kind: 'brand', name: 'audible', bg: '#F8991C', fg: '#FFFFFF' },
  libby: { kind: 'material', name: 'library', bg: '#7A3E9D', fg: '#FFFFFF' },
  notion: { kind: 'material', name: 'note-text-outline', bg: '#111111', fg: '#FFFFFF' },
  'google-docs': { kind: 'brand', name: 'google-drive', bg: '#4285F4', fg: '#FFFFFF' },
  'google-calendar': { kind: 'brand', name: 'google', bg: '#4285F4', fg: '#FFFFFF' },
  'google-tasks': { kind: 'brand', name: 'google', bg: '#4285F4', fg: '#FFFFFF' },
  todoist: { kind: 'brand', name: 'todoist', bg: '#E44332', fg: '#FFFFFF' },
  forest: { kind: 'material', name: 'pine-tree', bg: '#4CAF50', fg: '#FFFFFF' },
  calm: { kind: 'material', name: 'meditation', bg: '#2E7D7A', fg: '#FFFFFF' },
  spotify: { kind: 'brand', name: 'spotify', bg: '#1DB954', fg: '#FFFFFF' },
  chatgpt: { kind: 'material', name: 'creation', bg: '#111111', fg: '#FFFFFF' },
  claude: { kind: 'material', name: 'creation-outline', bg: '#8A5A44', fg: '#FFFFFF' },
  slack: { kind: 'brand', name: 'slack', bg: '#4A154B', fg: '#FFFFFF' },
  teams: { kind: 'brand', name: 'microsoft', bg: '#6264A7', fg: '#FFFFFF' },
  gmail: { kind: 'brand', name: 'google', bg: '#EA4335', fg: '#FFFFFF' },
  keep: { kind: 'material', name: 'note-outline', bg: '#F4B400', fg: '#111111' },
};

export function ProductiveAppIcon({ id, size = 34 }: { id: string; size?: number }) {
  const visual = VISUALS[id] ?? { kind: 'material' as const, name: 'apps', bg: '#2A2A2A', fg: '#FFFFFF' };
  const iconSize = size * 0.48;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: visual.bg }]}>
      {visual.kind === 'brand' ? (
        <FontAwesome6 name={visual.name} iconStyle="brand" size={iconSize} color={visual.fg} />
      ) : (
        <MaterialCommunityIcons name={visual.name} size={iconSize} color={visual.fg} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
