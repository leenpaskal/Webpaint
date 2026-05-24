import { StyleSheet, Text, View } from 'react-native';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  tone?: Tone;
};

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#E5E7EB', fg: '#374151' },
  info: { bg: '#DBEAFE', fg: '#1E40AF' },
  success: { bg: '#D1FAE5', fg: '#065F46' },
  warning: { bg: '#FEF3C7', fg: '#92400E' },
  danger: { bg: '#FEE2E2', fg: '#991B1B' },
};

export function StatusBadge({ label, tone = 'neutral' }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
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
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
