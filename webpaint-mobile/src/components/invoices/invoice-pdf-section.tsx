import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { DangerOutlineButton, FormBanner, PrimaryButton } from '@/components/form';
import { ApiError } from '@/lib/api/client';
import {
  buildInvoicePdfUrl,
  deleteInvoicePdf,
} from '@/lib/api/invoices';
import type { Invoice } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/auth-context';
import { confirmDestructive } from '@/lib/confirm';
import { fontSize, palette, radii, spacing } from '@/lib/theme';

type Props = {
  invoice: Invoice;
  canManage: boolean;
  onChanged: (invoice: Invoice) => void;
};

export function InvoicePdfSection({ invoice, canManage, onChanged }: Props) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPdf = Boolean(invoice.pdfPath);
  const fileName =
    invoice.pdfOriginalName ?? `${invoice.invoiceNumber}.pdf`;

  async function handleOpen() {
    if (!token) return;
    const url = buildInvoicePdfUrl(invoice.id, token);
    if (!url) {
      setError('PDF URL is not configured.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setError("Couldn't open the PDF.");
    }
  }

  async function handleRemove() {
    if (!token || busy) return;
    const ok = await confirmDestructive({
      title: `Remove "${fileName}"?`,
      message: 'The PDF will be detached from the invoice.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;

    setBusy(true);
    setError(null);
    try {
      const { invoice: next } = await deleteInvoicePdf(token, invoice.id);
      onChanged(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove PDF.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Invoice PDF</Text>

      {hasPdf ? (
        <View style={styles.fileBox}>
          <Text style={styles.fileName}>{fileName}</Text>
          <View style={styles.actions}>
            <PrimaryButton label="Open PDF" onPress={handleOpen} />
            {canManage ? (
              <DangerOutlineButton
                label={busy ? 'Removing...' : 'Remove PDF'}
                onPress={handleRemove}
                busy={busy}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <Text style={styles.empty}>
          {canManage
            ? 'No PDF attached yet. Upload from the web dashboard.'
            : "The PDF for this invoice hasn't been uploaded yet."}
        </Text>
      )}

      {error ? <FormBanner tone="error">{error}</FormBanner> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
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
  empty: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
  },
  fileBox: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  fileName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: palette.text,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
