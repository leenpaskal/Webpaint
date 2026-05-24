import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth/auth-context';

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
            style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
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
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  link: {
    marginTop: 16,
    fontSize: 16,
    color: '#208AEF',
    fontWeight: '500',
  },
  authedBlock: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '500',
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
  },
  logout: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutPressed: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
  },
});
