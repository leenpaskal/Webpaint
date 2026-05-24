import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenMessage } from '@/components/screen-message';
import { SummaryCard } from '@/components/summary-card';
import { ApiError } from '@/lib/api/client';
import { fetchDashboardSummary } from '@/lib/api/dashboard';
import type { DashboardSummary } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!token) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { summary: next } = await fetchDashboardSummary(token);
        setSummary(next);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  if (loading && !summary) {
    return <ScreenMessage loading message="Loading dashboard…" />;
  }

  if (error && !summary) {
    return <ScreenMessage title="Couldn't load dashboard" message={error} />;
  }

  const showClientsCard = user?.role === 'admin' || user?.role === 'manager';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load('refresh')} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {user ? `Hello, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </Text>
        <Text style={styles.subtitle}>
          Tap a card to drill into the full list.
        </Text>
      </View>

      <View style={styles.cards}>
        {showClientsCard ? (
          <SummaryCard
            label="Clients"
            value={summary?.clients ?? 0}
            caption="Total clients on file"
            href="/clients"
            accent="#208AEF"
          />
        ) : null}
        <SummaryCard
          label="Unpaid invoices"
          value={summary?.unpaidInvoices ?? 0}
          caption="Sent or overdue"
          href={{ pathname: '/invoices', params: { status: 'unpaid' } }}
          accent="#DC2626"
        />
        <SummaryCard
          label="Open tasks"
          value={summary?.openTasks ?? 0}
          caption="Not yet completed"
          href={{ pathname: '/tasks', params: { status: 'open' } }}
          accent="#F59E0B"
        />
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cards: {
    gap: 12,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 13,
  },
});
