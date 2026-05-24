import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
import { fontSize, palette, radii, spacing } from '@/lib/theme';

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
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<InvoiceStatusFilter>(
    parseStatusParam(params.status),
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const load = useCallback(
    async (
      mode: 'initial' | 'refresh',
      statusFilter: InvoiceStatusFilter,
      term: string,
    ) => {
      if (!token) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { invoices: next } = await listInvoices(token, {
          statusFilter,
          search: term || undefined,
        });
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
      void load('initial', filter, debouncedSearch);
    }, [load, filter, debouncedSearch]),
  );

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  if (loading && invoices.length === 0) {
    return <ScreenMessage loading message="Loading invoices…" />;
  }

  if (error && invoices.length === 0) {
    return <ScreenMessage title="Couldn't load invoices" message={error} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Invoices',
          headerRight: canManage
            ? () => (
                <Pressable
                  onPress={() => router.push('/invoices/new')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="New invoice"
                >
                  <Text style={styles.headerButton}>+ New</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={styles.container}>
        <View style={styles.controls}>
          <FilterTabs
            value={filter}
            options={FILTER_OPTIONS}
            onChange={setFilter}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={
              canManage
                ? 'Search by number, client, or company'
                : 'Search by number'
            }
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
            returnKeyType="search"
          />
          {debouncedSearch ? (
            <Text style={styles.resultCount}>
              {invoices.length} result{invoices.length === 1 ? '' : 's'} for
              &ldquo;{debouncedSearch}&rdquo;
            </Text>
          ) : null}
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
              onRefresh={() => load('refresh', filter, debouncedSearch)}
              tintColor={palette.textMuted}
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
                  <Text style={styles.number}>{item.invoiceNumber}</Text>
                  <StatusBadge
                    label={INVOICE_STATUS_LABELS[item.status]}
                    tone={INVOICE_STATUS_TONE[item.status]}
                    strike={item.status === 'cancelled'}
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
            <ScreenMessage
              title={debouncedSearch ? 'No matches' : 'No invoices'}
              message={
                debouncedSearch
                  ? 'Try a different search or filter.'
                  : canManage
                    ? 'Tap "+ New" to record your first invoice.'
                    : ' '
              }
            />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  controls: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 10,
  },
  search: {
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.lg,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
  },
  listContent: { paddingBottom: spacing.xxl },
  emptyContainer: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  rowPressed: { backgroundColor: palette.surfaceMuted },
  rowBody: { flex: 1, gap: 4 },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  number: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: palette.text,
  },
  clientName: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  total: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
  },
  due: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
  },
  chevron: {
    fontSize: fontSize.xxl,
    color: palette.textMuted,
    paddingLeft: 8,
  },
  headerButton: {
    fontSize: fontSize.md,
    color: palette.primary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
});
