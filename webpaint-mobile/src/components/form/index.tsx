import { ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { colors, fontSize, palette, radii } from '@/lib/theme';

/* -------------------------------------------------------------------------- */
/* Banner — info / error / success                                             */
/* -------------------------------------------------------------------------- */

export function FormBanner({
  tone,
  children,
}: {
  tone: 'error' | 'success';
  children: ReactNode;
}) {
  const bg = tone === 'error' ? palette.dangerBg : palette.successBg;
  const border = tone === 'error' ? palette.dangerBorder : palette.successBorder;
  const fg = tone === 'error' ? palette.dangerOnBg : palette.successOnBg;
  return (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.bannerText, { color: fg }]}>{children}</Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* FieldShell — label + content + error                                        */
/* -------------------------------------------------------------------------- */

function FieldShell({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* TextField                                                                   */
/* -------------------------------------------------------------------------- */

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  error?: string;
  multiline?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'multiline' | 'style'>;

export function TextField({
  label,
  value,
  onChangeText,
  required,
  error,
  multiline,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor={colors.zinc400}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
        ]}
        {...rest}
      />
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */
/* SelectField — opens a modal sheet                                           */
/* -------------------------------------------------------------------------- */

type Option = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  options: ReadonlyArray<Option>;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  required,
  error,
  disabled,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <FieldShell label={label} required={required} error={error}>
      <Pressable
        style={[
          styles.input,
          styles.selectButton,
          error && styles.inputError,
          disabled && styles.selectDisabled,
        ]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.selectText,
            !current && styles.selectPlaceholder,
          ]}
          numberOfLines={1}
        >
          {current?.label ?? placeholder}
        </Text>
        <Text style={styles.selectChevron}>▾</Text>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}>
                <Text style={styles.modalDone}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {options.map((opt) => {
                const active = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && styles.modalItemPressed,
                    ]}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        active && styles.modalItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {active ? <Text style={styles.modalCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </FieldShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

export function PrimaryButton({
  label,
  onPress,
  busy,
  disabled,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = busy || disabled;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primary,
        isDisabled && styles.primaryDisabled,
        pressed && !isDisabled && styles.primaryPressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
    >
      {busy ? (
        <ActivityIndicator color={palette.primaryOn} />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondary,
        pressed && !disabled && styles.secondaryPressed,
        disabled && styles.secondaryDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function DangerOutlineButton({
  label,
  onPress,
  busy,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.dangerOutline,
        pressed && !busy && styles.dangerOutlinePressed,
      ]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
    >
      {busy ? (
        <ActivityIndicator color={palette.danger} />
      ) : (
        <Text style={styles.dangerOutlineText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bannerText: {
    fontSize: fontSize.md,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: palette.text,
  },
  required: {
    color: palette.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.lg,
    backgroundColor: palette.surface,
    minHeight: 44,
    color: palette.text,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputError: {
    borderColor: palette.danger,
  },
  errorText: {
    color: palette.danger,
    fontSize: fontSize.sm,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectDisabled: {
    opacity: 0.5,
  },
  selectText: {
    fontSize: fontSize.lg,
    color: palette.text,
    flex: 1,
  },
  selectPlaceholder: {
    color: colors.zinc400,
  },
  selectChevron: {
    color: palette.textMuted,
    fontSize: 14,
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '70%',
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: palette.text,
  },
  modalDone: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: palette.primary,
  },
  modalList: {
    paddingHorizontal: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  modalItemPressed: {
    backgroundColor: palette.surfaceMuted,
  },
  modalItemText: {
    fontSize: fontSize.lg,
    color: palette.text,
    flex: 1,
  },
  modalItemTextActive: {
    fontWeight: '600',
  },
  modalCheck: {
    fontSize: fontSize.lg,
    color: palette.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  primary: {
    backgroundColor: palette.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryPressed: {
    backgroundColor: palette.primaryHover,
  },
  primaryDisabled: {
    opacity: 0.55,
  },
  primaryText: {
    color: palette.primaryOn,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  secondaryPressed: {
    backgroundColor: palette.surfaceMuted,
  },
  secondaryDisabled: {
    opacity: 0.5,
  },
  secondaryText: {
    color: palette.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  dangerOutline: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: palette.danger,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  dangerOutlinePressed: {
    backgroundColor: palette.dangerBg,
  },
  dangerOutlineText: {
    color: palette.danger,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
