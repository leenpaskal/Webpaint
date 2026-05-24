import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenMessage } from '@/components/screen-message';
import { StatusBadge } from '@/components/status-badge';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';
import { TaskWorkflowForm } from '@/components/tasks/task-workflow-form';
import { ApiError } from '@/lib/api/client';
import { getTask, type TaskClientLabel } from '@/lib/api/tasks';
import type { Task } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/format';
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from '@/lib/labels';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [taskClient, setTaskClient] = useState<TaskClientLabel | null>(null);
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
      const { task: next, client } = await getTask(token, numericId);
      setTask(next);
      setTaskClient(client);
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

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <>
      <Stack.Screen options={{ title: task.title }} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <View>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.submitted}>
            Submitted {formatDate(task.createdAt)}
          </Text>
        </View>

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

        <View style={styles.detailsCard}>
          <Text style={styles.sectionHeading}>Details</Text>
          <DetailRow label="Due date" value={formatDate(task.dueDate) || null} />
          {canManage ? (
            <DetailRow label="Submitted by" value={formatClient(taskClient)} />
          ) : null}
          <DetailRow
            label="Last updated"
            value={formatDate(task.updatedAt) || null}
          />
          <View style={styles.description}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>
              {task.description?.trim() || 'No description provided.'}
            </Text>
          </View>
        </View>

        {canManage ? (
          <TaskWorkflowForm task={task} onSaved={setTask} />
        ) : (
          <View style={styles.clientNote}>
            <Text style={styles.clientNoteText}>
              The Webpaint team manages status and priority. You&apos;ll see
              updates here as they progress.
            </Text>
          </View>
        )}

        {canManage ? (
          <DeleteTaskButton
            taskId={task.id}
            taskTitle={task.title}
            onDeleted={() => router.replace('/tasks')}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

function formatClient(client: TaskClientLabel | null): string | null {
  if (!client) return null;
  if (client.companyName && client.name)
    return `${client.companyName} — ${client.name}`;
  return client.companyName ?? client.name ?? null;
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: spacing.xl,
    gap: 14,
    paddingBottom: 40,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  submitted: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  detailsCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeading: { fontSize: fontSize.md, fontWeight: '600', color: palette.text },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: fontSize.md,
    color: palette.text,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
  },
  description: {
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    paddingTop: spacing.md,
  },
  descriptionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  descriptionText: {
    fontSize: fontSize.base,
    color: palette.text,
    lineHeight: 22,
  },
  clientNote: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  clientNoteText: {
    fontSize: fontSize.sm,
    color: palette.textSubtle,
  },
});
