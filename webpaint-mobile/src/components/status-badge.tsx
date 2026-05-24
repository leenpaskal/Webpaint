import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/theme';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

type Props = {
  label: string;
  tone?: Tone;
  strike?: boolean;
};

// Matches the web's badges: bg-X-100 / text-X-800 stops at the lighter end
// of Tailwind, with subtle borders implied by the surface color.
const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.zinc100, fg: colors.zinc700 },
  info: { bg: colors.blue100, fg: colors.blue800 },
  success: { bg: colors.emerald100, fg: colors.emerald800 },
  warning: { bg: colors.amber100, fg: colors.amber800 },
  danger: { bg: colors.red100, fg: colors.red800 },
  muted: { bg: colors.zinc100, fg: colors.zinc500 },
};

export function StatusBadge({ label, tone = 'neutral', strike }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text
        style={[
          styles.text,
          { color: palette.fg },
          strike && styles.strike,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
});
