import { Feather } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';

interface Props {
  text: string;
  setText: (value: string) => void;
  onVoiceComplete?: () => void;
  disabled?: boolean;
}

/** Mic control — only mount when isSpeechRecognitionAvailable() is true. */
export function GoalsVoiceMic({ text, setText, onVoiceComplete, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const pendingTranscript = useRef('');

  useSpeechRecognitionEvent('start', () => setRecording(true));
  useSpeechRecognitionEvent('end', () => {
    setRecording(false);
    const line = pendingTranscript.current.trim();
    pendingTranscript.current = '';
    if (!line) return;
    const next = text.trim().length ? `${text.trim()}\n${line}` : line;
    setText(next);
    haptics.success();
    onVoiceComplete?.();
  });
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) pendingTranscript.current = transcript;
  });
  useSpeechRecognitionEvent('error', () => {
    setRecording(false);
    pendingTranscript.current = '';
  });

  const onMic = async () => {
    if (disabled) return;
    if (recording) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    haptics.medium();
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) return;
    pendingTranscript.current = '';
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  return (
    <Pressable
      onPress={onMic}
      disabled={disabled}
      style={[styles.mic, recording && styles.micOn, disabled && styles.micDisabled]}
      hitSlop={8}>
      <Feather name="mic" size={18} color={recording ? colors.bg : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mic: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassFillActive,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micOn: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  micDisabled: {
    opacity: 0.45,
  },
});
