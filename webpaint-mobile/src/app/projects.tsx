import { StyleSheet, Text, View } from 'react-native';

import { fontSize, palette, spacing } from '@/lib/theme';

export default function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projects</Text>
      <Text style={styles.subtitle}>
        Project management is coming to mobile soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: palette.background,
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
    textAlign: 'center',
  },
});
