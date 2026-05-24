/**
 * Mobile theme tokens that mirror the Next.js web app's Tailwind palette.
 *
 * The web uses zinc as the neutral, an almost-black (`zinc-900`) as the
 * primary action color, and Tailwind's red / emerald / amber / blue for
 * destructive / success / warning / info. Keep these values in sync with
 * `webpaint-web/src/components/**` so the two surfaces feel identical.
 */

export const colors = {
  // Zinc neutrals — picked from tailwindcss/colors zinc
  zinc50: '#FAFAFA',
  zinc100: '#F4F4F5',
  zinc200: '#E4E4E7',
  zinc300: '#D4D4D8',
  zinc400: '#A1A1AA',
  zinc500: '#71717A',
  zinc600: '#52525B',
  zinc700: '#3F3F46',
  zinc800: '#27272A',
  zinc900: '#18181B',
  zinc950: '#09090B',

  // Accents — match Tailwind 100/200/800 stops used in the web badges
  blue50: '#EFF6FF',
  blue100: '#DBEAFE',
  blue200: '#BFDBFE',
  blue700: '#1D4ED8',
  blue800: '#1E40AF',

  emerald50: '#ECFDF5',
  emerald100: '#D1FAE5',
  emerald200: '#A7F3D0',
  emerald700: '#047857',
  emerald800: '#065F46',

  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber200: '#FDE68A',
  amber700: '#B45309',
  amber800: '#92400E',

  orange100: '#FFEDD5',
  orange800: '#9A3412',

  red50: '#FEF2F2',
  red100: '#FEE2E2',
  red200: '#FECACA',
  red300: '#FCA5A5',
  red400: '#F87171',
  red600: '#DC2626',
  red700: '#B91C1C',
  red800: '#991B1B',

  slate100: '#F1F5F9',
  slate700: '#334155',

  white: '#FFFFFF',
  black: '#000000',
};

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  xxl: 22,
  display: 28,
};

/** Convenience semantic aliases used across screens. */
export const palette = {
  background: colors.zinc50,
  surface: colors.white,
  surfaceMuted: colors.zinc100,
  border: colors.zinc200,
  borderStrong: colors.zinc300,
  text: colors.zinc900,
  textMuted: colors.zinc500,
  textSubtle: colors.zinc600,
  primary: colors.zinc900,
  primaryOn: colors.white,
  primaryHover: colors.zinc800,
  link: colors.zinc700,
  danger: colors.red600,
  dangerBg: colors.red50,
  dangerBorder: colors.red200,
  dangerOnBg: colors.red800,
  success: colors.emerald700,
  successBg: colors.emerald50,
  successBorder: colors.emerald200,
  successOnBg: colors.emerald800,
};
