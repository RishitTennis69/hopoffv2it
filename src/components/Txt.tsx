import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type } from '@/theme';

type Variant = keyof typeof type;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

// Inter text with a typography variant + sensible default color.
export function Txt({ variant = 'body', color, center, style, ...rest }: Props) {
  const base = type[variant] as TextStyle;
  return (
    <Text
      {...rest}
      style={[
        base,
        { color: color ?? colors.text },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}
