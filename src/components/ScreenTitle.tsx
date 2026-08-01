import { View } from 'react-native';

import { colors, spacing } from '@/theme';
import { Txt } from './Txt';

interface Props {
  title: string;
  subtitle?: string;
  center?: boolean;
}

export function ScreenTitle({ title, subtitle, center }: Props) {
  return (
    <View style={{ gap: spacing.md, alignItems: center ? 'center' : 'flex-start' }}>
      <Txt variant="title" center={center} adjustsFontSizeToFit minimumFontScale={0.82}>
        {title}
      </Txt>
      {subtitle ? (
        <Txt variant="body" color={colors.textMuted} center={center}>
          {subtitle}
        </Txt>
      ) : null}
    </View>
  );
}
