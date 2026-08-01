import { Platform } from 'react-native';

import type { PermissionId } from '@/store/types';

export const REQUIRED_PERMISSIONS: PermissionId[] =
  Platform.OS === 'ios' ? ['screenTime'] : ['usage'];

export const PERMISSION_META: Record<
  PermissionId,
  { title: string; path: string; skippable: boolean; openLabel: string; confirmLabel: string }
> = {
  usage: {
    title: 'Step 1: Usage access',
    path: 'Let HopOff detect when you hit your limit and track your usage.',
    skippable: false,
    openLabel: 'Open Usage Access',
    confirmLabel: 'Open Usage Access',
  },
  accessibility: {
    title: 'Step 2: Accessibility',
    path: 'Let HopOff block distracting apps when you try to open them.',
    skippable: false,
    openLabel: 'Open Accessibility Settings',
    confirmLabel: 'Open Accessibility Settings',
  },
  screenTime: {
    title: 'Screen Time',
    path: 'Screen Time -> HopOff -> Allow',
    skippable: false,
    openLabel: 'Open Screen Time',
    confirmLabel: 'I enabled Screen Time',
  },
  microphone: {
    title: 'Microphone',
    path: 'Already enabled for voice goals',
    skippable: false,
    openLabel: 'Open Microphone settings',
    confirmLabel: "I've enabled Microphone",
  },
};

export function permissionSteps(): PermissionId[] {
  return Platform.OS === 'ios' ? ['screenTime'] : ['usage', 'accessibility'];
}
