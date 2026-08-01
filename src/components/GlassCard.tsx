import { type ViewProps, View, StyleSheet } from 'react-native';

import { colors, radius, shadow } from '@/theme';

interface Props extends ViewProps {
  active?: boolean;
  /** Adds the subtle top highlight line used on selected rows. */
  highlight?: boolean;
  rounded?: number;
}

// Light gray card surface with a hairline border that brightens when active.
export function GlassCard({
  active,
  highlight,
  rounded = radius.card,
  style,
  children,
  ...rest
}: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.base,
        {
          borderRadius: rounded,
          backgroundColor: active ? colors.glassFillActive : colors.glassFill,
          borderColor: active ? colors.glassBorderActive : colors.glassBorder,
        },
        style,
      ]}>
      {highlight && active && <View style={[styles.highlight, { borderTopLeftRadius: rounded, borderTopRightRadius: rounded }]} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
    ...shadow,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
});
