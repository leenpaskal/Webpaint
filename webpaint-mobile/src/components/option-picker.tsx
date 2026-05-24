import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { fontSize, palette, radii } from '@/lib/theme';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  options: ReadonlyArray<Option<T>>;
  onChange: (next: T) => void;
};

/**
 * Touch-friendly alternative to a <select> for short option lists. Renders
 * the options as a horizontal row of chips.
 */
export function OptionPicker<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.chip,
              active && styles.chipActive,
              pressed && !active && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  chipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  chipPressed: {
    backgroundColor: palette.surfaceMuted,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: palette.textSubtle,
  },
  labelActive: {
    color: palette.primaryOn,
    fontWeight: '600',
  },
});
