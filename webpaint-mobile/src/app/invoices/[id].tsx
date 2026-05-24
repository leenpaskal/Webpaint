import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/components/screen-message';
import { StatusBadge } from '@/components/status-badge';
import { ApiError } from '@/lib/api/client';
import { getInvoice } from '@/lib/api/invoices';
import type { Invoice } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate, formatMoney } from '@/lib/format';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONE } from '@/lib/labels';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const { invoice: next } = await getInvoice(token, numericId);
      setInvoice(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load invoice.');
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
      <Stack.Screen options={{ title: `Invoice #${invoice.invoiceNumber}` }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.number}>#{invoice.invoiceNumber}</Text>
          <StatusBadge
            label={INVOICE_STATUS_LABELS[invoice.status]}
            tone={INVOICE_STATUS_TONE[invoice.status]}
          />
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatMoney(invoice.total, invoice.currency)}
          </Text>
        </View>

        <DetailRow label="Currency" value={invoice.currency} />
        <DetailRow label="Issued" value={formatDate(invoice.issuedAt) || null} />
        <DetailRow label="Due" value={formatDate(invoice.dueAt) || null} />
        <DetailRow
          label="PDF"
          value={invoice.pdfOriginalName ?? null}
        />
        <DetailRow
          label="Last updated"
          value={formatDate(invoice.updatedAt) || null}
        />
      </ScrollView>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 18,
    gap: 4,
  },
  totalLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  totalValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
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
});
