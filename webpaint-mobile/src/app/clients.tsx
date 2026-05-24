import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenMessage } from '@/components/screen-message';
import { listClients } from '@/lib/api/clients';
import { ApiError } from '@/lib/api/client';
import type { Client } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';

export default function ClientsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh', term: string) => {
      if (!token) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { clients: next } = await listClients(token, term || undefined);
        setClients(next);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setError("You don't have access to the client list.");
        } else {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load clients.',
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial', search);
      // We intentionally don't re-run on `search` change here — the search
      // box has its own debounced effect below. This focus effect only
      // runs when navigating back to the screen.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]),
  );

  // Debounced search: 300ms after the user stops typing.
  useFocusEffect(
    useCallback(() => {
      const handle = setTimeout(() => void load('initial', search), 300);
      return () => clearTimeout(handle);
    }, [search, load]),
  );

  if (loading && clients.length === 0) {
    return <ScreenMessage loading message="Loading clients…" />;
  }

  if (error && clients.length === 0) {
    return <ScreenMessage title="Couldn't load clients" message={error} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, company or email"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.search}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={clients}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={
          clients.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh', search)}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() =>
              router.push({ pathname: '/clients/[id]', params: { id: item.id } })
            }
          >
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.name}</Text>
              {item.companyName ? (
                <Text style={styles.subline}>{item.companyName}</Text>
              ) : null}
              {item.email ? (
                <Text style={styles.subline}>{item.email}</Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <ScreenMessage
            title={search ? 'No matches' : 'No clients yet'}
            message={search ? 'Try a different search.' : ' '}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchWrap: {
    padding: 16,
    paddingBottom: 8,
  },
  search: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
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
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subline: {
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    paddingLeft: 8,
  },
});
