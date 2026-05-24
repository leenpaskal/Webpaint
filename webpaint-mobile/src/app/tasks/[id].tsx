import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/components/screen-message';
import { StatusBadge } from '@/components/status-badge';
import { ApiError } from '@/lib/api/client';
import { getTask } from '@/lib/api/tasks';
import type { Task } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/format';
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from '@/lib/labels';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError('Invalid task id.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { task: next } = await getTask(token, numericId);
      setTask(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load task.');
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
    return <ScreenMessage loading message="Loading task…" />;
  }
  if (error || !task) {
    return (
      <ScreenMessage
        title="Couldn't load task"
        message={error ?? 'Unknown error.'}
      />
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: task.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{task.title}</Text>

        <View style={styles.badges}>
          <StatusBadge
            label={TASK_STATUS_LABELS[task.status]}
            tone={TASK_STATUS_TONE[task.status]}
          />
          <StatusBadge
            label={TASK_PRIORITY_LABELS[task.priority]}
            tone={TASK_PRIORITY_TONE[task.priority]}
          />
        </View>

        {task.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </View>
        ) : null}

        <DetailRow label="Due date" value={formatDate(task.dueDate) || null} />
        <DetailRow label="Created" value={formatDate(task.createdAt) || null} />
        <DetailRow
          label="Last updated"
          value={formatDate(task.updatedAt) || null}
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
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  descriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 6,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  descriptionText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
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
