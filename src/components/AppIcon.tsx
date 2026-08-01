import { FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { BrandKey } from '@/store/types';

interface BrandStyle {
  glyph: React.ComponentProps<typeof FontAwesome6>['name'];
  fg: string;
  bg?: string;
  gradient?: [string, string, ...string[]];
}

const BRANDS: Record<BrandKey, BrandStyle> = {
  tiktok: { glyph: 'tiktok', fg: '#FFFFFF', bg: '#010101' },
  instagram: {
    glyph: 'instagram',
    fg: '#FFFFFF',
    gradient: ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'],
  },
  youtube: { glyph: 'youtube', fg: '#FFFFFF', bg: '#FF0000' },
  snapchat: { glyph: 'snapchat', fg: '#000000', bg: '#FFFC00' },
  reddit: { glyph: 'reddit-alien', fg: '#FFFFFF', bg: '#FF4500' },
  facebook: { glyph: 'facebook-f', fg: '#FFFFFF', bg: '#1877F2' },
  x: { glyph: 'x-twitter', fg: '#FFFFFF', bg: '#000000' },
  generic: { glyph: 'mobile-screen-button', fg: '#FFFFFF', bg: '#2A2A2A' },
};

interface Props {
  brand: BrandKey;
  size?: number;
}

// Round brand icon in authentic colors.
export function AppIcon({ brand, size = 40 }: Props) {
  const radius = size / 2;
  const glyphSize = size * 0.5;
  const b = BRANDS[brand];

  const content = <FontAwesome6 name={b.glyph} iconStyle="brand" size={glyphSize} color={b.fg} />;

  if (b.gradient) {
    return (
      <LinearGradient
        colors={b.gradient}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[styles.circle, { width: size, height: size, borderRadius: radius }]}>
        {content}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: radius, backgroundColor: b.bg },
      ]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
