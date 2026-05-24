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

import { ScreenMessage } from '@/components/screen-message';
import { StatusBadge } from '@/components/status-badge';
import { DeleteInvoiceButton } from '@/components/invoices/delete-invoice-button';
import { InvoiceForm } from '@/components/invoices/invoice-form';
import { InvoicePdfSection } from '@/components/invoices/invoice-pdf-section';
import { ApiError } from '@/lib/api/client';
import { listClients } from '@/lib/api/clients';
import { getInvoice, updateInvoice } from '@/lib/api/invoices';
import type { Client, Invoice } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate, formatMoney } from '@/lib/format';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONE } from '@/lib/labels';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

function clientLabel(client: Client | undefined): string {
  if (!client) return '—';
  if (client.companyName) return `${client.companyName} — ${client.name}`;
  return client.name;
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [matchedClient, setMatchedClient] = useState<Client | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const load = useCallback(async () => {
    if (!token) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError('Invalid invoice id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { invoice: inv } = await getInvoice(token, numericId);
      setInvoice(inv);

      if (canManage) {
        const { clients: list } = await listClients(token);
        setClients(list);
        setMatchedClient(list.find((c) => c.id === inv.clientId));
      } else {
        setMatchedClient(undefined);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  }, [token, id, canManage]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return <ScreenMessage loading message="Loading invoice…" />;
  }
  if (error || !invoice) {
    return (
      <ScreenMessage
        title="Couldn't load invoice"
        message={error ?? 'Unknown error.'}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: invoice.invoiceNumber }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.headerMain}>
              <Text style={styles.number}>{invoice.invoiceNumber}</Text>
              <Text style={styles.client}>{clientLabel(matchedClient)}</Text>
            </View>
            <View style={styles.headerRight}>
              <StatusBadge
                label={INVOICE_STATUS_LABELS[invoice.status]}
                tone={INVOICE_STATUS_TONE[invoice.status]}
                strike={invoice.status === 'cancelled'}
              />
              <Text style={styles.total}>
                {formatMoney(invoice.total, invoice.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.summary}>
            <SummaryRow label="Issued on" value={formatDate(invoice.issuedAt) || '—'} />
            <SummaryRow label="Due" value={formatDate(invoice.dueAt) || '—'} />
            <SummaryRow label="Currency" value={invoice.currency} />
          </View>

          <InvoicePdfSection
            invoice={invoice}
            canManage={canManage}
            onChanged={setInvoice}
          />

          {canManage ? (
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Invoice details</Text>
              <Text style={styles.cardSubheading}>
                Update metadata. The PDF itself is managed in the section above.
              </Text>
              <InvoiceForm
                key={`${invoice.id}-${invoice.updatedAt}`}
                clients={clients}
                initial={{
                  clientId: invoice.clientId,
                  invoiceNumber: invoice.invoiceNumber,
                  status: invoice.status,
                  currency: invoice.currency,
                  total: invoice.total,
                  issuedAt: invoice.issuedAt,
                  dueAt: invoice.dueAt,
                }}
                submitLabel="Save changes"
                pendingLabel="Saving..."
                showSavedNotice
                onSubmit={async (input) => {
                  if (!token) return;
                  const { invoice: next } = await updateInvoice(
                    token,
                    invoice.id,
                    input,
                  );
                  setInvoice(next);
                  setMatchedClient(clients.find((c) => c.id === next.clientId));
                }}
              />
            </View>
          ) : null}

          {canManage ? (
            <DeleteInvoiceButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              onDeleted={() => router.replace('/invoices')}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  headerMain: {
    flex: 1,
    gap: 4,
  },
  number: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  client: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  total: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  summary: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: palette.text,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeading: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
  },
  cardSubheading: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
    marginBottom: spacing.sm,
  },
});
