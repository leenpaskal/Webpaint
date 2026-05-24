import { Stack, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { ClientForm } from '@/components/clients/client-form';
import { ScreenMessage } from '@/components/screen-message';
import { createClient } from '@/lib/api/clients';
import { useAuth } from '@/lib/auth/auth-context';
import { fontSize, palette, spacing } from '@/lib/theme';

export default function NewClientScreen() {
  const { token, user } = useAuth();
  const router = useRouter();

  const canManage = user?.role === 'admin' || user?.role === 'manager';
  if (!canManage) {
    return (
      <ScreenMessage
        title="Not available"
        message="Only admins and managers can create clients."
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New client' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>New client</Text>
          <Text style={styles.subheading}>
            Fill in the contact details. You can edit them later.
          </Text>

          <ClientForm
            submitLabel="Create client"
            pendingLabel="Creating..."
            onSubmit={async (input) => {
              if (!token) return;
              const { client } = await createClient(token, input);
              router.replace({
                pathname: '/clients/[id]',
                params: { id: client.id },
              });
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
    paddingBottom: 40,
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  subheading: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
    marginBottom: spacing.sm,
  },
});
