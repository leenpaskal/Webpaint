import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FilterTabs } from '@/components/filter-tabs';
import { ScreenMessage } from '@/components/screen-message';
import { StatusBadge } from '@/components/status-badge';
import { ApiError } from '@/lib/api/client';
import { listInvoices } from '@/lib/api/invoices';
import type { InvoiceListItem, InvoiceStatusFilter } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate, formatMoney } from '@/lib/format';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_TONE } from '@/lib/labels';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
] as const satisfies ReadonlyArray<{ value: InvoiceStatusFilter; label: string }>;

function parseStatusParam(raw: unknown): InvoiceStatusFilter {
  if (raw === 'unpaid' || raw === 'paid' || raw === 'all') return raw;
  return 'all';
}

export default function InvoicesScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<InvoiceStatusFilter>(
    parseStatusParam(params.status),
  );
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh', statusFilter: InvoiceStatusFilter) => {
      if (!token) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { invoices: next } = await listInvoices(token, { statusFilter });
        setInvoices(next);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Failed to load invoices.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial', filter);
    }, [load, filter]),
  );

  if (loading && invoices.length === 0) {
    return <ScreenMessage loading message="Loading invoices…" />;
  }

  if (error && invoices.length === 0) {
    return <ScreenMessage title="Couldn't load invoices" message={error} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterWrap}>
        <FilterTabs
          value={filter}
          options={FILTER_OPTIONS}
          onChange={setFilter}
        />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(inv) => String(inv.id)}
        contentContainerStyle={
          invoices.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh', filter)}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              router.push({
                pathname: '/invoices/[id]',
                params: { id: item.id },
              })
            }
          >
            <View style={styles.rowBody}>
              <View style={styles.rowTopLine}>
                <Text style={styles.number}>#{item.invoiceNumber}</Text>
                <StatusBadge
                  label={INVOICE_STATUS_LABELS[item.status]}
                  tone={INVOICE_STATUS_TONE[item.status]}
                />
              </View>
              <Text style={styles.clientName}>
                {item.clientCompany || item.clientName || 'Unknown client'}
              </Text>
              <View style={styles.rowMeta}>
                <Text style={styles.total}>
                  {formatMoney(item.total, item.currency)}
                </Text>
                {item.dueAt ? (
                  <Text style={styles.due}>Due {formatDate(item.dueAt)}</Text>
                ) : null}
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <ScreenMessage title="No invoices" message=" " />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowPressed: {
    backgroundColor: '#F3F4F6',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  number: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  clientName: {
    fontSize: 14,
    color: '#374151',
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  total: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  due: {
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    paddingLeft: 8,
  },
});
