import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DangerOutlineButton, FormBanner } from '@/components/form';
import { ApiError } from '@/lib/api/client';
import { deleteClient } from '@/lib/api/clients';
import { useAuth } from '@/lib/auth/auth-context';
import { confirmDestructive } from '@/lib/confirm';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

type Props = {
  clientId: number;
  clientName: string;
  onDeleted: () => void;
};

export function DeleteClientButton({ clientId, clientName, onDeleted }: Props) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    if (!token || busy) return;
    const ok = await confirmDestructive({
      title: `Delete client "${clientName}"?`,
      message:
        'This also removes their websites, projects, tasks and notes. Cannot be undone.',
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      await deleteClient(token, clientId);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message);
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Failed to delete client.',
        );
      }
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Danger zone</Text>
      <Text style={styles.body}>
        Deleting this client also removes all their websites, projects, tasks
        and notes.
      </Text>
      {error ? <FormBanner tone="error">{error}</FormBanner> : null}
      <DangerOutlineButton
        label={busy ? 'Deleting...' : 'Delete client'}
        onPress={handle}
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
  heading: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.dangerOnBg,
  },
  body: {
    fontSize: fontSize.md,
    color: palette.dangerOnBg,
    opacity: 0.85,
  },
});
