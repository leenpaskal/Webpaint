import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ClientForm } from '@/components/clients/client-form';
import { DeleteClientButton } from '@/components/clients/delete-client-button';
import { ScreenMessage } from '@/components/screen-message';
import { ApiError } from '@/lib/api/client';
import { getClient, updateClient } from '@/lib/api/clients';
import type { Client } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/format';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError('Invalid client id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { client: next } = await getClient(token, numericId);
      setClient(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load client.');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return <ScreenMessage loading message="Loading client…" />;
  }
  if (error || !client) {
    return (
      <ScreenMessage
        title="Couldn't load client"
        message={error ?? 'Unknown error.'}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: client.name }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.name}>{client.name}</Text>
            {client.companyName ? (
              <Text style={styles.company}>{client.companyName}</Text>
            ) : null}
            <Text style={styles.added}>
              Added {formatDate(client.createdAt)}
            </Text>
          </View>

          <View style={styles.card}>
            <ClientForm
              key={String(client.id)}
              initial={{
                name: client.name,
                companyName: client.companyName,
                email: client.email,
                phone: client.phone,
                address: client.address,
                vatNumber: client.vatNumber,
              }}
              submitLabel="Save changes"
              pendingLabel="Saving..."
              showSavedNotice
              onSubmit={async (input) => {
                if (!token) return;
                const { client: next } = await updateClient(
                  token,
                  client.id,
                  input,
                );
                setClient(next);
              }}
            />
          </View>

          <DeleteClientButton
            clientId={client.id}
            clientName={client.name}
            onDeleted={() => router.replace('/clients')}
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
    gap: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    gap: 4,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  company: {
    fontSize: fontSize.lg,
    color: palette.textSubtle,
  },
  added: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
  },
});
