import { spacing } from './spacing';

export const layout = {
  columns: 4,
  gutter: spacing.md,
  screenPadding: spacing.screenH,
  minTapTarget: 48,
  primaryTapTarget: 60,
  twoColumnBasis: '47.6%',
} as const;
