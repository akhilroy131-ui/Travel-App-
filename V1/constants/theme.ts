// Roam — Design Tokens
// Dark & playful aesthetic: deep backgrounds, vibrant accents, rounded UI

export const Colors = {
  // Backgrounds
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  surfaceBorder: '#2E2E2E',

  // Brand / Accent
  accent: '#FF6B35',       // vibrant coral-orange (primary CTA)
  accentLight: '#FF8C5A',
  accentDark: '#D9491A',

  // Secondary accent
  accentSecondary: '#6C63FF', // playful purple
  accentSecondaryLight: '#8F88FF',

  // Star rating
  star: '#FFD166',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#606060',
  textInverse: '#0D0D0D',
  textOnAccent: '#FFFFFF',

  // Semantic
  success: '#06D6A0',
  warning: '#FFD166',
  error: '#EF476F',
  info: '#118AB2',

  // Category tag colours
  categoryFoodDrink: '#FF6B35',
  categoryAdventure: '#06D6A0',
  categoryCulture: '#6C63FF',
  categoryWellness: '#FFD166',

  // Overlays
  overlay: 'rgba(0,0,0,0.55)',
  overlayLight: 'rgba(0,0,0,0.30)',
  overlayHeavy: 'rgba(0,0,0,0.80)',

  // Transparent
  transparent: 'transparent',
}

export const Typography = {
  // Font families — Expo uses system fonts by default; swap once custom fonts are loaded
  fontFamily: {
    regular: undefined,   // system default
    medium: undefined,
    semibold: undefined,
    bold: undefined,
  },

  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    display: 38,
  },

  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
}

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  giant: 64,
}

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
}

const theme = { Colors, Typography, Spacing, BorderRadius, Shadow }
export default theme
