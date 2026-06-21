import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { colors, spacing } from '@/theme';
import { useGoals } from '@/store';
import type { GoalConnections } from '@/store/types';
import { GlassCard } from './GlassCard';
import { Txt } from './Txt';

interface ConnectDef {
  key: keyof GoalConnections;
  label: string;
  badge: React.ReactNode;
}

const CONNECTIONS: ConnectDef[] = [
  {
    key: 'notion',
    label: 'Notion',
    badge: <Txt style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: colors.white }}>N</Txt>,
  },
  { key: 'reminders', label: 'Reminders', badge: <Ionicons name="list" size={16} color={colors.white} /> },
  { key: 'notes', label: 'Notes', badge: <Feather name="file-text" size={15} color={colors.white} /> },
  {
    key: 'googleTasks',
    label: 'Google Tasks',
    badge: <FontAwesome6 name="google" iconStyle="brand" size={14} color={colors.white} />,
  },
];

const MOCK_TRANSCRIPTS = [
  'Read 10 pages',
  'Go to the gym',
  'Call my parents',
  'Sleep before midnight',
];

interface Props {
  minHeight?: number;
  placeholder?: string;
}

export function GoalsEditor({ minHeight = 160, placeholder }: Props) {
  const text = useGoals((s) => s.text);
  const setText = useGoals((s) => s.setText);
  const connections = useGoals((s) => s.connections);
  const toggleConnection = useGoals((s) => s.toggleConnection);
  const [recording, setRecording] = useState(false);

  const onMic = () => {
    if (recording) return;
    haptics.medium();
    setRecording(true);
    setTimeout(() => {
      const line = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
      const next = text.trim().length ? `${text.trim()}\n${line}` : line;
      setText(next);
      setRecording(false);
      haptics.success();
    }, 1500);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <GlassCard style={styles.editor}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder={placeholder ?? 'Write your goals, one per line…'}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, { minHeight }]}
          textAlignVertical="top"
        />
        <Pressable onPress={onMic} style={[styles.mic, recording && styles.micOn]} hitSlop={8}>
          <Feather name="mic" size={18} color={recording ? colors.bg : colors.text} />
        </Pressable>
      </GlassCard>

      <View style={{ gap: spacing.sm }}>
        <Txt variant="caption" color={colors.textMuted}>
          CONNECT
        </Txt>
        {CONNECTIONS.map((c) => {
          const connected = connections[c.key];
          return (
            <Pressable key={c.key} onPress={() => { haptics.selection(); toggleConnection(c.key); }}>
              <GlassCard active={connected} style={styles.connectRow}>
                <View style={styles.connectLeft}>
                  <View style={styles.badge}>{c.badge}</View>
                  <Txt variant="bodyStrong">{c.label}</Txt>
                </View>
                <Txt variant="body" color={connected ? colors.text : colors.textMuted}>
                  {connected ? 'Connected' : 'Connect'}
                </Txt>
              </GlassCard>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    padding: spacing.lg,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    paddingRight: 44,
  },
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
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  connectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.dark,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
