import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  FormBanner,
  PrimaryButton,
  TextField,
} from '@/components/form';
import { ApiError } from '@/lib/api/client';
import type { ClientInput } from '@/lib/api/clients';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<keyof ClientInput, string>>;

type Props = {
  initial?: Partial<ClientInput>;
  submitLabel: string;
  pendingLabel: string;
  showSavedNotice?: boolean;
  onSubmit: (input: ClientInput) => Promise<void>;
};

export function ClientForm({
  initial,
  submitLabel,
  pendingLabel,
  showSavedNotice,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [companyName, setCompanyName] = useState(initial?.companyName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [vatNumber, setVatNumber] = useState(initial?.vatNumber ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function validateLocal(input: ClientInput): FieldErrors {
    const errs: FieldErrors = {};
    if (!input.name.trim()) errs.name = 'Name is required.';
    else if (input.name.length > 255)
      errs.name = 'Name must be at most 255 characters.';
    if (input.email && !EMAIL_REGEX.test(input.email))
      errs.email = 'Enter a valid email address.';
    return errs;
  }

  function blank(v: string): string | null {
    const t = v.trim();
    return t ? t : null;
  }

  async function handleSubmit() {
    const input: ClientInput = {
      name: name.trim(),
      companyName: blank(companyName),
      email: blank(email),
      phone: blank(phone),
      address: blank(address),
      vatNumber: blank(vatNumber),
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

  return (
    <View style={styles.container}>
      {showSavedNotice && savedAt ? (
        <FormBanner tone="success">Changes saved.</FormBanner>
      ) : null}
      {formError ? <FormBanner tone="error">{formError}</FormBanner> : null}

      <TextField
        label="Contact name"
        required
        value={name}
        onChangeText={setName}
        placeholder="Jane Doe"
        error={fieldErrors.name}
        editable={!busy}
      />
      <TextField
        label="Company"
        value={companyName}
        onChangeText={setCompanyName}
        placeholder="Acme Ltd."
        error={fieldErrors.companyName}
        editable={!busy}
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="contact@acme.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={fieldErrors.email}
        editable={!busy}
      />
      <TextField
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+359 ..."
        keyboardType="phone-pad"
        autoComplete="tel"
        error={fieldErrors.phone}
        editable={!busy}
      />
      <TextField
        label="VAT number"
        value={vatNumber}
        onChangeText={setVatNumber}
        placeholder="BG123456789"
        autoCapitalize="characters"
        error={fieldErrors.vatNumber}
        editable={!busy}
      />
      <TextField
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="Street, city, country"
        multiline
        error={fieldErrors.address}
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
