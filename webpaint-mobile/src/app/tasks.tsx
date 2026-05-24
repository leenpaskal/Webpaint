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

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
] as const satisfies ReadonlyArray<{ value: TaskStatusFilter; label: string }>;

function parseStatusParam(raw: unknown): TaskStatusFilter {
  if (raw === 'open' || raw === 'completed' || raw === 'all') return raw;
  return 'all';
}

export default function TasksScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<TaskStatusFilter>(
    parseStatusParam(params.status),
  );
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh', statusFilter: TaskStatusFilter) => {
      if (!token) return;
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { tasks: next } = await listTasks(token, { statusFilter });
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
      void load('initial', filter);
    }, [load, filter]),
  );

  if (loading && tasks.length === 0) {
    return <ScreenMessage loading message="Loading tasks…" />;
  }

  if (error && tasks.length === 0) {
    return <ScreenMessage title="Couldn't load tasks" message={error} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterWrap}>
        <FilterTabs value={filter} options={FILTER_OPTIONS} onChange={setFilter} />
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
            onRefresh={() => load('refresh', filter)}
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
        ListEmptyComponent={<ScreenMessage title="No tasks" message=" " />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterWrap: { padding: 16, paddingBottom: 8 },
  listContent: { paddingBottom: 24 },
  emptyContainer: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  rowPressed: { backgroundColor: '#F3F4F6' },
  rowBody: { flex: 1, gap: 6 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
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
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    fontSize: 24,
    color: '#9CA3AF',
    paddingLeft: 8,
  },
});
