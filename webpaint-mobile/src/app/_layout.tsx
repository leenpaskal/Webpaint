import { Stack } from 'expo-router';

import { AuthProvider } from '@/lib/auth/auth-context';
import { AuthGate } from '@/lib/auth/auth-gate';
import { palette } from '@/lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.text,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: palette.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="login" options={{ title: 'Login' }} />
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />

          <Stack.Screen name="clients" options={{ title: 'Clients' }} />
          <Stack.Screen name="clients/new" options={{ title: 'New client' }} />
          <Stack.Screen name="clients/[id]" options={{ title: 'Client' }} />

          <Stack.Screen name="invoices" options={{ title: 'Invoices' }} />
          <Stack.Screen name="invoices/new" options={{ title: 'New invoice' }} />
          <Stack.Screen name="invoices/[id]" options={{ title: 'Invoice' }} />

          <Stack.Screen name="tasks" options={{ title: 'Tasks' }} />
          <Stack.Screen name="tasks/new" options={{ title: 'New task' }} />
          <Stack.Screen name="tasks/[id]" options={{ title: 'Task' }} />

          <Stack.Screen name="projects" options={{ title: 'Projects' }} />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}
