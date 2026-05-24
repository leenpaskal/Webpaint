import { useRouter, useSegments } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/lib/auth/auth-context';

const PUBLIC_ROUTES = new Set<string>(['index', 'login']);

/**
 * Redirects:
 *   - unauthenticated users on a protected route → /login
 *   - authenticated users on /login → /dashboard
 * Public routes (home + login) are always reachable.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] ?? 'index';

  useEffect(() => {
    if (status === 'loading') return;
    const isPublic = PUBLIC_ROUTES.has(currentRoute);

    if (status === 'unauthenticated' && !isPublic) {
      router.replace('/login');
    } else if (status === 'authenticated' && currentRoute === 'login') {
      router.replace('/dashboard');
    }
  }, [status, currentRoute, router]);

  if (status === 'loading') {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
