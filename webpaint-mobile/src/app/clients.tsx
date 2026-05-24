import { Stack, useFocusEffect, useRouter } from 'expo-router';
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

import { ScreenMessage } from '@/components/screen-message';
import { listClients } from '@/lib/api/clients';
import { ApiError } from '@/lib/api/client';
import type { Client } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

export default function ClientsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the search term so we don't fire a request on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

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
      void load('initial', debouncedSearch);
    }, [load, debouncedSearch]),
  );

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  if (loading && clients.length === 0) {
    return <ScreenMessage loading message="Loading clients…" />;
  }

  if (error && clients.length === 0) {
    return <ScreenMessage title="Couldn't load clients" message={error} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Clients',
          headerRight: canManage
            ? () => (
                <Pressable
                  onPress={() => router.push('/clients/new')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="New client"
                >
                  <Text style={styles.headerButton}>+ New</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={styles.container}>
        <View style={styles.controls}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, company or email"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
            returnKeyType="search"
          />
          {debouncedSearch ? (
            <Text style={styles.resultCount}>
              {clients.length} result{clients.length === 1 ? '' : 's'} for &ldquo;
              {debouncedSearch}&rdquo;
            </Text>
          ) : null}
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
              onRefresh={() => load('refresh', debouncedSearch)}
              tintColor={palette.textMuted}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() =>
                router.push({
                  pathname: '/clients/[id]',
                  params: { id: item.id },
                })
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
              title={debouncedSearch ? 'No matches' : 'No clients yet'}
              message={
                debouncedSearch
                  ? 'Try a different search.'
                  : canManage
                    ? 'Tap "+ New" to add your first client.'
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
  rowBody: { flex: 1, gap: 2 },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: palette.text,
  },
  subline: {
    fontSize: fontSize.sm,
    color: palette.textSubtle,
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
