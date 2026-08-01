import { useEffect, useRef, useState } from 'react';
import { type TextStyle } from 'react-native';

import { colors, type } from '@/theme';
import { Txt } from './Txt';

const SYMBOLS = '!<>-_\\/[]{}=+*^?#%@&$';

interface Props {
  text: string;
  /** ms before this line begins resolving. */
  delay?: number;
  /** total ms to fully resolve the line. */
  duration?: number;
  style?: TextStyle;
  color?: string;
  center?: boolean;
  onDone?: () => void;
}

function randSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

// Random symbols scramble, then resolve left-to-right into the real text.
export function EncryptedText({ text, delay = 0, duration = 500, style, color, center, onDone }: Props) {
  const [display, setDisplay] = useState('');
  const frame = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let revealed = 0;
    const len = text.length;
    const tick = 28;
    const steps = Math.max(1, Math.round(duration / tick));
    const perStep = len / steps;
    let count = 0;

    const start = setTimeout(() => {
      frame.current = setInterval(() => {
        count += 1;
        revealed = Math.min(len, Math.floor(count * perStep));
        let out = text.slice(0, revealed);
        for (let i = revealed; i < len; i++) {
          out += text[i] === ' ' ? ' ' : randSymbol();
        }
        setDisplay(out);
        if (revealed >= len) {
          if (frame.current) clearInterval(frame.current);
          setDisplay(text);
          onDone?.();
        }
      }, tick);
    }, delay);

    return () => {
      clearTimeout(start);
      if (frame.current) clearInterval(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay, duration]);

  return (
    <Txt center={center} style={[type.title, { color: color ?? colors.text }, style]}>
      {display || ''}
    </Txt>
  );
}
