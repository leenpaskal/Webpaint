import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSize, palette, radii } from '@/lib/theme';

type Props = {
  label: string;
  value: number | string;
  caption?: string;
  href: Href;
  accent?: string;
};

export function SummaryCard({
  label,
  value,
  caption,
  href,
  accent = palette.primary,
}: Props) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    minHeight: 96,
  },
  cardPressed: {
    backgroundColor: palette.surfaceMuted,
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: palette.text,
  },
  caption: {
    fontSize: fontSize.sm,
    color: palette.textMuted,
  },
  chevron: {
    fontSize: 32,
    fontWeight: '300',
    paddingHorizontal: 16,
    color: palette.textMuted,
  },
});
