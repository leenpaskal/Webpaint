import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  FormBanner,
  PrimaryButton,
  TextField,
} from '@/components/form';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/auth-context';
import { palette, spacing } from '@/lib/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    const trimmed = email.trim();
    if (!trimmed) errs.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(trimmed))
      errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    return errs;
  }

  async function handleSubmit() {
    setFormError(null);
    const localErrs = validate();
    setFieldErrors(localErrs);
    if (Object.keys(localErrs).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors as FieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>

        {formError ? <FormBanner tone="error">{formError}</FormBanner> : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
          error={fieldErrors.email}
          editable={!submitting}
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          placeholder="••••••••"
          error={fieldErrors.password}
          editable={!submitting}
          onSubmitEditing={handleSubmit}
        />

        <PrimaryButton
          label="Sign in"
          onPress={handleSubmit}
          busy={submitting}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: palette.background,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: palette.text,
  },
});
