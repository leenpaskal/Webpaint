import { Stack } from 'expo-router';

import { AuthProvider } from '@/lib/auth/auth-context';
import { AuthGate } from '@/lib/auth/auth-gate';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="login" options={{ title: 'Login' }} />
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Stack.Screen name="clients" options={{ title: 'Clients' }} />
          <Stack.Screen name="projects" options={{ title: 'Projects' }} />
          <Stack.Screen name="tasks" options={{ title: 'Tasks' }} />
          <Stack.Screen name="invoices" options={{ title: 'Invoices' }} />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}
