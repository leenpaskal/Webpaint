import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fontSize, palette, spacing } from '@/lib/theme';

type Props = {
  title?: string;
  message?: string;
  loading?: boolean;
};

/**
 * Centered status block used by list/detail screens for loading, empty
 * and error states. Keeps each screen from re-rolling the same boilerplate.
 */
export function ScreenMessage({ title, message, loading }: Props) {
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.spinner} color={palette.textMuted} />
      ) : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: 8,
    backgroundColor: palette.background,
  },
  spinner: {
    marginBottom: 8,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
    textAlign: 'center',
  },
});
