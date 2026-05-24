import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormBanner, PrimaryButton } from '@/components/form';
import { OptionPicker } from '@/components/option-picker';
import { ApiError } from '@/lib/api/client';
import { updateTaskWorkflow } from '@/lib/api/tasks';
import type { Task, TaskPriority, TaskStatus } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '@/lib/labels';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

const STATUS_OPTIONS = (
  ['todo', 'in_progress', 'review', 'completed'] as const satisfies readonly TaskStatus[]
).map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }));

const PRIORITY_OPTIONS = (
  ['low', 'medium', 'high', 'urgent'] as const satisfies readonly TaskPriority[]
).map((p) => ({ value: p, label: TASK_PRIORITY_LABELS[p] }));

type Props = {
  task: Task;
  onSaved: (task: Task) => void;
};

export function TaskWorkflowForm({ task, onSaved }: Props) {
  const { token } = useAuth();
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = status !== task.status || priority !== task.priority;

  async function handleSave() {
    if (!token || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const { task: updated } = await updateTaskWorkflow(token, task.id, {
        status,
        priority,
      });
      onSaved(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Workflow</Text>
      <Text style={styles.subheading}>
        Update status and priority as the work moves forward.
      </Text>

      {savedAt && !dirty ? (
        <FormBanner tone="success">Changes saved.</FormBanner>
      ) : null}
      {error ? <FormBanner tone="error">{error}</FormBanner> : null}

      <View style={styles.field}>
        <Text style={styles.label}>Status</Text>
        <OptionPicker value={status} options={STATUS_OPTIONS} onChange={setStatus} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Priority</Text>
        <OptionPicker
          value={priority}
          options={PRIORITY_OPTIONS}
          onChange={setPriority}
        />
      </View>

      <View style={styles.submitRow}>
        <PrimaryButton
          label={saving ? 'Saving...' : 'Save changes'}
          onPress={handleSave}
          busy={saving}
          disabled={!dirty}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
  },
  subheading: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
    marginBottom: 4,
  },
  field: { gap: 8 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  submitRow: {
    flexDirection: 'row',
  },
});
