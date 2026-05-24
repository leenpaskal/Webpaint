import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/components/screen-message';
import { getClient } from '@/lib/api/clients';
import { ApiError } from '@/lib/api/client';
import type { Client } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/format';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>{client.name}</Text>
          {client.companyName ? (
            <Text style={styles.company}>{client.companyName}</Text>
          ) : null}
        </View>

        <DetailRow label="Email" value={client.email} />
        <DetailRow label="Phone" value={client.phone} />
        <DetailRow label="VAT number" value={client.vatNumber} />
        <DetailRow label="Address" value={client.address} multiline />
        <DetailRow
          label="Client since"
          value={formatDate(client.createdAt) || null}
        />
      </ScrollView>
    </>
  );
}

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, multiline && styles.valueMultiline]}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  company: {
    fontSize: 16,
    color: '#6B7280',
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  valueMultiline: {
    lineHeight: 22,
  },
});
