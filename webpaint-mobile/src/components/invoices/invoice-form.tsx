import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  FormBanner,
  PrimaryButton,
  SelectField,
  TextField,
} from '@/components/form';
import { ApiError } from '@/lib/api/client';
import type { InvoiceInput } from '@/lib/api/invoices';
import type {
  Client,
  Currency,
  InvoiceStatus,
} from '@/lib/api/types';
import { CURRENCY_LABELS, INVOICE_STATUS_LABELS } from '@/lib/labels';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;

type FieldErrors = Partial<Record<keyof InvoiceInput, string>>;

type Props = {
  clients: Client[];
  initial?: Partial<InvoiceInput>;
  submitLabel: string;
  pendingLabel: string;
  showSavedNotice?: boolean;
  onSubmit: (input: InvoiceInput) => Promise<void>;
};

const STATUS_OPTIONS: ReadonlyArray<{ value: InvoiceStatus; label: string }> = [
  { value: 'draft', label: INVOICE_STATUS_LABELS.draft },
  { value: 'sent', label: INVOICE_STATUS_LABELS.sent },
  { value: 'paid', label: INVOICE_STATUS_LABELS.paid },
  { value: 'overdue', label: INVOICE_STATUS_LABELS.overdue },
  { value: 'cancelled', label: INVOICE_STATUS_LABELS.cancelled },
];

const CURRENCY_OPTIONS: ReadonlyArray<{ value: Currency; label: string }> = [
  { value: 'BGN', label: CURRENCY_LABELS.BGN },
  { value: 'EUR', label: CURRENCY_LABELS.EUR },
  { value: 'USD', label: CURRENCY_LABELS.USD },
];

function clientOptionLabel(c: Client): string {
  if (c.companyName) return `${c.companyName} — ${c.name}`;
  return c.name;
}

export function InvoiceForm({
  clients,
  initial,
  submitLabel,
  pendingLabel,
  showSavedNotice,
  onSubmit,
}: Props) {
  const [clientId, setClientId] = useState<string>(
    initial?.clientId ? String(initial.clientId) : '',
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    initial?.invoiceNumber ?? '',
  );
  const [status, setStatus] = useState<InvoiceStatus>(initial?.status ?? 'draft');
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'EUR');
  const [total, setTotal] = useState(initial?.total ?? '');
  const [issuedAt, setIssuedAt] = useState(initial?.issuedAt ?? '');
  const [dueAt, setDueAt] = useState(initial?.dueAt ?? '');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function validateLocal(input: InvoiceInput): FieldErrors {
    const errs: FieldErrors = {};
    if (!Number.isInteger(input.clientId) || input.clientId <= 0) {
      errs.clientId = 'Pick a client.';
    }
    if (!input.invoiceNumber.trim()) {
      errs.invoiceNumber = 'Invoice number is required.';
    } else if (input.invoiceNumber.length > 50) {
      errs.invoiceNumber = 'Invoice number must be at most 50 characters.';
    }
    if (!input.total.trim()) {
      errs.total = 'Total is required.';
    } else if (!MONEY_REGEX.test(input.total.trim())) {
      errs.total = 'Enter a valid amount (e.g. 1200 or 1200.50).';
    }
    if (input.issuedAt && !DATE_REGEX.test(input.issuedAt)) {
      errs.issuedAt = 'Use the YYYY-MM-DD format.';
    }
    if (input.dueAt && !DATE_REGEX.test(input.dueAt)) {
      errs.dueAt = 'Use the YYYY-MM-DD format.';
    }
    return errs;
  }

  function blank(v: string): string | null {
    const t = v.trim();
    return t ? t : null;
  }

  async function handleSubmit() {
    const input: InvoiceInput = {
      clientId: Number(clientId),
      invoiceNumber: invoiceNumber.trim(),
      status,
      currency,
      total: total.trim(),
      issuedAt: blank(issuedAt),
      dueAt: blank(dueAt),
    };

    const local = validateLocal(input);
    setFieldErrors(local);
    setFormError(null);
    if (Object.keys(local).length > 0) return;

    setBusy(true);
    try {
      await onSubmit(input);
      setSavedAt(Date.now());
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors as FieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const clientOptions = [
    { value: '', label: '— Pick a client —' },
    ...clients.map((c) => ({
      value: String(c.id),
      label: clientOptionLabel(c),
    })),
  ];

  return (
    <View style={styles.container}>
      {showSavedNotice && savedAt ? (
        <FormBanner tone="success">Changes saved.</FormBanner>
      ) : null}
      {formError ? <FormBanner tone="error">{formError}</FormBanner> : null}

      <SelectField
        label="Client"
        required
        value={clientId}
        options={clientOptions}
        onChange={setClientId}
        placeholder="Pick a client"
        error={fieldErrors.clientId}
      />

      <TextField
        label="Invoice number"
        required
        value={invoiceNumber}
        onChangeText={setInvoiceNumber}
        placeholder="INV-2026-001"
        autoCapitalize="characters"
        error={fieldErrors.invoiceNumber}
        editable={!busy}
      />

      <TextField
        label="Total"
        required
        value={total}
        onChangeText={setTotal}
        placeholder="1200.00"
        keyboardType="decimal-pad"
        error={fieldErrors.total}
        editable={!busy}
      />

      <SelectField
        label="Status"
        value={status}
        options={STATUS_OPTIONS}
        onChange={(v) => setStatus(v as InvoiceStatus)}
        error={fieldErrors.status}
      />

      <SelectField
        label="Currency"
        value={currency}
        options={CURRENCY_OPTIONS}
        onChange={(v) => setCurrency(v as Currency)}
        error={fieldErrors.currency}
      />

      <TextField
        label="Issued on"
        value={issuedAt}
        onChangeText={setIssuedAt}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        error={fieldErrors.issuedAt}
        editable={!busy}
      />

      <TextField
        label="Due date"
        value={dueAt}
        onChangeText={setDueAt}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        error={fieldErrors.dueAt}
        editable={!busy}
      />

      <View style={styles.submitRow}>
        <PrimaryButton
          label={busy ? pendingLabel : submitLabel}
          onPress={handleSubmit}
          busy={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  submitRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
});
