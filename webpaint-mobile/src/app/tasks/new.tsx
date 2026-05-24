import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  FormBanner,
  PrimaryButton,
  TextField,
} from '@/components/form';
import { ScreenMessage } from '@/components/screen-message';
import { ApiError } from '@/lib/api/client';
import { createTask } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth/auth-context';
import { fontSize, palette, spacing } from '@/lib/theme';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type FieldErrors = { title?: string; description?: string; dueDate?: string };

export default function NewTaskScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user && user.role !== 'client') {
    return (
      <ScreenMessage
        title="Not available"
        message="Only client accounts can submit new tasks."
      />
    );
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!title.trim()) errs.title = 'Title is required.';
    else if (title.length > 255)
      errs.title = 'Title must be at most 255 characters.';
    if (dueDate && !DATE_REGEX.test(dueDate.trim())) {
      errs.dueDate = 'Use the YYYY-MM-DD format.';
    }
    return errs;
  }

  async function handleSubmit() {
    if (!token) return;
    setFormError(null);
    const localErrs = validate();
    setFieldErrors(localErrs);
    if (Object.keys(localErrs).length > 0) return;

    setSubmitting(true);
    try {
      await createTask(token, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        dueDate: dueDate.trim() ? dueDate.trim() : null,
      });
      router.replace('/tasks');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors as FieldErrors);
        setFormError(err.message);
      } else {
        setFormError('Failed to submit task.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New task' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Submit a new task</Text>
          <Text style={styles.subheading}>
            Describe what you need and when. The Webpaint team picks it up and
            updates you as it progresses.
          </Text>

          {formError ? <FormBanner tone="error">{formError}</FormBanner> : null}

          <TextField
            label="Title"
            required
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need done?"
            error={fieldErrors.title}
            editable={!submitting}
          />

          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Add context, links, screenshots or anything that helps…"
            error={fieldErrors.description}
            editable={!submitting}
            multiline
          />

          <TextField
            label="Due date"
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            error={fieldErrors.dueDate}
            editable={!submitting}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.hint}>
            Status and priority will be set by the Webpaint team once they pick
            up the task.
          </Text>

          <View style={styles.submitRow}>
            <PrimaryButton
              label={submitting ? 'Submitting...' : 'Submit task'}
              onPress={handleSubmit}
              busy={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: 40 },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: palette.text,
  },
  subheading: {
    fontSize: fontSize.md,
    color: palette.textSubtle,
    marginBottom: 4,
  },
  hint: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
  },
  submitRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
  },
});
