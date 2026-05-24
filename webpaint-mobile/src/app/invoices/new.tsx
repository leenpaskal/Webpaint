import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';

import { FormBanner } from '@/components/form';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { ScreenMessage } from '@/components/screen-message';
import { listClients } from '@/lib/api/clients';
import { createInvoice } from '@/lib/api/invoices';
import type { Client } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { ApiError } from '@/lib/api/client';
import { fontSize, palette, spacing } from '@/lib/theme';

export default function NewInvoiceScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!canManage || !token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { clients: list } = await listClients(token);
        if (!cancelled) setClients(list);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load clients.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, canManage]);

  if (!canManage) {
    return (
      <ScreenMessage
        title="Not available"
        message="Only admins and managers can create invoices."
      />
    );
  }

  if (loading) {
    return <ScreenMessage loading message="Loading clients…" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New invoice' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>New invoice</Text>
          <Text style={styles.subheading}>
            Record an invoice and upload the PDF later from the web dashboard.
          </Text>

          {error ? <FormBanner tone="error">{error}</FormBanner> : null}

          <InvoiceForm
            clients={clients}
            submitLabel="Create invoice"
            pendingLabel="Creating..."
            onSubmit={async (input) => {
              if (!token) return;
              const { invoice } = await createInvoice(token, input);
              router.replace({
                pathname: '/invoices/[id]',
                params: { id: invoice.id },
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
