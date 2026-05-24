import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth/auth-context';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

export default function HomeScreen() {
  const { status, user, logout } = useAuth();
  const isAuthed = status === 'authenticated';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Webpaint Portal</Text>
      <Text style={styles.subtitle}>
        Manage your clients, projects, tasks, and invoices in one place.
      </Text>

      {isAuthed && user ? (
        <View style={styles.authedBlock}>
          <Text style={styles.greeting}>Signed in as {user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Link href="/dashboard" style={styles.link}>
            Go to Dashboard
          </Link>
          <Pressable
            style={({ pressed }) => [
              styles.logout,
              pressed && styles.logoutPressed,
            ]}
            onPress={logout}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      ) : (
        <Link href="/login" style={styles.link}>
          Go to Login
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.lg,
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.lg,
    textAlign: 'center',
    color: palette.textSubtle,
  },
  link: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    color: palette.primary,
    fontWeight: '600',
  },
  authedBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: '500',
    color: palette.text,
  },
  email: {
    fontSize: fontSize.md,
    color: palette.textMuted,
  },
  logout: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: palette.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  logoutPressed: {
    backgroundColor: palette.dangerBg,
  },
  logoutText: {
    color: palette.danger,
    fontWeight: '600',
  },
});
