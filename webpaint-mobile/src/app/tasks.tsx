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
import { listTasks } from '@/lib/api/tasks';
import type { TaskListItem, TaskStatusFilter } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/format';
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from '@/lib/labels';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
] as const satisfies ReadonlyArray<{ value: TaskStatusFilter; label: string }>;

function parseStatusParam(raw: unknown): TaskStatusFilter {
  if (raw === 'all' || raw === 'completed' || raw === 'open') return raw;
  return 'open';
}

export default function TasksScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<TaskStatusFilter>(
    parseStatusParam(params.status),
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
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
      statusFilter: TaskStatusFilter,
      term: string,
    ) => {
      if (!token) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { tasks: next } = await listTasks(token, {
          statusFilter,
          search: term || undefined,
        });
        setTasks(next);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Failed to load tasks.',
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

  const canCreate = user?.role === 'client';

  if (loading && tasks.length === 0) {
    return <ScreenMessage loading message="Loading tasks…" />;
  }

  if (error && tasks.length === 0) {
    return <ScreenMessage title="Couldn't load tasks" message={error} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tasks',
          headerRight: canCreate
            ? () => (
                <Pressable
                  onPress={() => router.push('/tasks/new')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="New task"
                >
                  <Text style={styles.headerButton}>+ New</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={styles.container}>
        <View style={styles.controls}>
          <FilterTabs value={filter} options={FILTER_OPTIONS} onChange={setFilter} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by title"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
            returnKeyType="search"
          />
          {debouncedSearch ? (
            <Text style={styles.resultCount}>
              {tasks.length} result{tasks.length === 1 ? '' : 's'} for &ldquo;
              {debouncedSearch}&rdquo;
            </Text>
          ) : null}
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={
            tasks.length === 0 ? styles.emptyContainer : styles.listContent
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
                router.push({ pathname: '/tasks/[id]', params: { id: item.id } })
              }
            >
              <View style={styles.rowBody}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.badges}>
                  <StatusBadge
                    label={TASK_STATUS_LABELS[item.status]}
                    tone={TASK_STATUS_TONE[item.status]}
                  />
                  <StatusBadge
                    label={TASK_PRIORITY_LABELS[item.priority]}
                    tone={TASK_PRIORITY_TONE[item.priority]}
                  />
                </View>
                <View style={styles.metaRow}>
                  {item.clientCompany || item.clientName ? (
                    <Text style={styles.meta}>
                      {item.clientCompany || item.clientName}
                    </Text>
                  ) : null}
                  {item.dueDate ? (
                    <Text style={styles.meta}>Due {formatDate(item.dueDate)}</Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <ScreenMessage
              title={debouncedSearch ? 'No matches' : 'No tasks'}
              message={
                debouncedSearch
                  ? 'Try a different search or filter.'
                  : canCreate
                    ? 'Tap "+ New" to submit your first task.'
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
  rowBody: { flex: 1, gap: 6 },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: palette.text,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  meta: {
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
