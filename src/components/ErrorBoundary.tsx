import { Component, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Surfaces startup crashes instead of a silent black screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[HopOff] startup error', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>HopOff hit a startup error</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.message}>{this.state.error.message}</Text>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    maxHeight: '60%',
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
