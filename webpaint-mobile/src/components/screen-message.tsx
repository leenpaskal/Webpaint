import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
      {loading ? <ActivityIndicator style={styles.spinner} /> : null}
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
    padding: 24,
    gap: 8,
  },
  spinner: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
