import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DangerOutlineButton, FormBanner } from '@/components/form';
import { ApiError } from '@/lib/api/client';
import { deleteTask } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';
import { confirmDestructive } from '@/lib/confirm';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

type Props = {
  taskId: number;
  taskTitle: string;
  onDeleted: () => void;
};

export function DeleteTaskButton({ taskId, taskTitle, onDeleted }: Props) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!token || busy) return;
    const ok = await confirmDestructive({
      title: `Delete task "${taskTitle}"?`,
      message: 'This cannot be undone.',
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await deleteTask(token, taskId);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete task.');
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Danger zone</Text>
      <Text style={styles.body}>
        Deleting this task is permanent and removes any notes attached to it.
      </Text>
      {error ? <FormBanner tone="error">{error}</FormBanner> : null}
      <DangerOutlineButton
        label={busy ? 'Deleting...' : 'Delete task'}
        onPress={handleDelete}
        busy={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.dangerBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.dangerBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heading: { fontSize: fontSize.md, fontWeight: '600', color: palette.dangerOnBg },
  body: { fontSize: fontSize.md, color: palette.dangerOnBg, opacity: 0.85 },
});
