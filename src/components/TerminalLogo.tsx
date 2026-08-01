import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  center?: boolean;
}

export function TerminalLogo({ size = 'md', center = false }: Props) {
  const scale = size === 'lg' ? 1.36 : size === 'sm' ? 0.82 : 1;

  return (
    <View style={[styles.root, center && styles.center]}>
      <Text
        style={[
          styles.word,
          {
            fontSize: 40 * scale,
            lineHeight: 43 * scale,
            letterSpacing: 0,
          },
        ]}>
        hop
      </Text>
      <View
        style={[
          styles.dot,
          {
            width: 16 * scale,
            height: 16 * scale,
            borderRadius: 8 * scale,
            marginLeft: 5 * scale,
            marginBottom: 4 * scale,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  center: {
    alignSelf: 'center',
  },
  word: {
    color: colors.text,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
  },
  dot: {
    backgroundColor: colors.danger,
  },
});
