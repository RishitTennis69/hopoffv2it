import { Feather, Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';

// Semantic line-icon names mapped to a concrete glyph + family.
const MAP = {
  // onboarding triggers
  sunrise: { family: 'feather', name: 'sunrise' },
  briefcase: { family: 'feather', name: 'briefcase' },
  moon: { family: 'feather', name: 'moon' },
  spark: { family: 'feather', name: 'zap' },
  // priorities
  present: { family: 'feather', name: 'map-pin' },
  habits: { family: 'ion', name: 'bulb-outline' },
  sleep: { family: 'feather', name: 'activity' },
  goals: { family: 'feather', name: 'target' },
  // controls / chrome
  back: { family: 'feather', name: 'chevron-left' },
  close: { family: 'feather', name: 'x' },
  check: { family: 'feather', name: 'check' },
  plus: { family: 'feather', name: 'plus' },
  trash: { family: 'feather', name: 'trash-2' },
  search: { family: 'feather', name: 'search' },
  arrowRight: { family: 'feather', name: 'arrow-right' },
  reorder: { family: 'feather', name: 'menu' },
  mic: { family: 'feather', name: 'mic' },
  settings: { family: 'feather', name: 'settings' },
  shield: { family: 'feather', name: 'shield' },
  play: { family: 'ion', name: 'play' },
  refresh: { family: 'feather', name: 'refresh-cw' },
  // paywall feature rows
  block: { family: 'feather', name: 'slash' },
  library: { family: 'feather', name: 'film' },
  insight: { family: 'feather', name: 'bar-chart-2' },
  coach: { family: 'feather', name: 'compass' },
  share: { family: 'feather', name: 'share-2' },
  lock: { family: 'feather', name: 'lock' },
  bell: { family: 'feather', name: 'bell' },
  logout: { family: 'feather', name: 'log-out' },
  chevronRight: { family: 'feather', name: 'chevron-right' },
} as const;

export type IconName = keyof typeof MAP;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = colors.text }: Props) {
  const entry = MAP[name];
  if (entry.family === 'ion') {
    return <Ionicons name={entry.name as never} size={size} color={color} />;
  }
  return <Feather name={entry.name as never} size={size} color={color} />;
}
