import { Platform } from 'react-native';

import type { PermissionId } from '@/store/types';

export const REQUIRED_PERMISSIONS: PermissionId[] =
  Platform.OS === 'ios' ? ['screenTime'] : ['usage'];

export const PERMISSION_META: Record<
  PermissionId,
  { title: string; path: string; skippable: boolean; openLabel: string; confirmLabel: string }
> = {
  usage: {
    title: 'Usage access',
    path: 'Usage access → HopOff → Allow',
    skippable: false,
    openLabel: 'Open Usage access',
    confirmLabel: 'I enabled Usage Access',
  },
  accessibility: {
    title: 'Accessibility',
    path: 'Accessibility → HopOff → Allow',
    skippable: true,
    openLabel: 'Open Accessibility',
    confirmLabel: 'I enabled Accessibility',
  },
  screenTime: {
    title: 'Screen Time',
    path: 'Screen Time → HopOff → Allow',
    skippable: false,
    openLabel: 'Open Screen Time',
    confirmLabel: 'I enabled Screen Time',
  },
};

export function permissionSteps(): PermissionId[] {
  return Platform.OS === 'ios' ? ['screenTime'] : ['usage', 'accessibility'];
}
