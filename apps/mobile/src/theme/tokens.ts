import { Platform } from 'react-native';

/**
 * Single source of truth for colour, space, radius and elevation.
 * Every screen reads from here. If a value is not in this file, it does not
 * exist yet — add it here first, then use it. See docs/DESIGN_SYSTEM.md.
 */

export const palette = {
  ink: '#0E0E10',
  paper: '#FAF9F6',

  brass: '#C9A227',
  brassDark: '#8F7011',
  brassLight: '#E8CE72',

  terracotta: '#C8553D',
  terracottaDark: '#9B3F2C',
  terracottaLight: '#E5806C',

  success: '#1F7A4C',
  successLight: '#3DA971',
  danger: '#B3261E',
  dangerLight: '#E05A4E',
  warning: '#B26B00',
  warningLight: '#E0A23A',
  info: '#2F6FB3',
  infoLight: '#5B9BD9',

  neutral50: '#F7F7F8',
  neutral100: '#EDEDEF',
  neutral200: '#D9D9DE',
  neutral300: '#B9B9C0',
  neutral400: '#8E8E97',
  neutral500: '#6B6B74',
  neutral600: '#4E4E56',
  neutral700: '#35353B',
  neutral800: '#212126',
  neutral900: '#141417',
} as const;

export type ColorScheme = 'dark' | 'light';

export interface ThemeColors {
  /** App background, the furthest-back surface. */
  bg: string;
  /** Cards, sheets, list rows. */
  surface: string;
  /** Nested surface: inputs, pressed rows, chips. */
  surfaceRaised: string;
  /** Highest surface: modals, popovers. */
  surfaceOverlay: string;

  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;

  secondary: string;
  secondarySoft: string;
  onSecondary: string;

  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;

  /** Source chips for booking origin. */
  sourceApp: string;
  sourceWhatsapp: string;
  sourceCall: string;
  sourceWalkin: string;
  sourceStaff: string;
}

export const darkColors: ThemeColors = {
  bg: palette.ink,
  surface: '#16161A',
  surfaceRaised: '#1E1E23',
  surfaceOverlay: '#26262C',

  border: '#2A2A31',
  borderStrong: '#3A3A43',

  textPrimary: palette.paper,
  textSecondary: palette.neutral300,
  textMuted: palette.neutral400,
  textInverse: palette.ink,

  accent: palette.brass,
  accentPressed: '#B08F1F',
  accentSoft: 'rgba(201, 162, 39, 0.16)',
  onAccent: palette.ink,

  secondary: palette.terracotta,
  secondarySoft: 'rgba(200, 85, 61, 0.16)',
  onSecondary: '#FFFFFF',

  success: palette.successLight,
  successSoft: 'rgba(31, 122, 76, 0.22)',
  danger: palette.dangerLight,
  dangerSoft: 'rgba(179, 38, 30, 0.22)',
  warning: palette.warningLight,
  warningSoft: 'rgba(178, 107, 0, 0.22)',
  info: palette.infoLight,
  infoSoft: 'rgba(47, 111, 179, 0.22)',

  sourceApp: '#7C9CF5',
  sourceWhatsapp: '#4FBF8B',
  sourceCall: '#E0A23A',
  sourceWalkin: '#B79CF0',
  sourceStaff: '#E5806C',
};

export const lightColors: ThemeColors = {
  bg: palette.paper,
  surface: '#FFFFFF',
  surfaceRaised: '#F1F0EB',
  surfaceOverlay: '#FFFFFF',

  border: '#E2E0D9',
  borderStrong: '#C9C6BC',

  textPrimary: palette.neutral900,
  textSecondary: palette.neutral600,
  textMuted: palette.neutral500,
  textInverse: palette.paper,

  accent: palette.brassDark,
  accentPressed: '#6E560D',
  accentSoft: 'rgba(201, 162, 39, 0.18)',
  onAccent: '#FFFFFF',

  secondary: palette.terracottaDark,
  secondarySoft: 'rgba(200, 85, 61, 0.14)',
  onSecondary: '#FFFFFF',

  success: palette.success,
  successSoft: 'rgba(31, 122, 76, 0.14)',
  danger: palette.danger,
  dangerSoft: 'rgba(179, 38, 30, 0.12)',
  warning: palette.warning,
  warningSoft: 'rgba(178, 107, 0, 0.14)',
  info: palette.info,
  infoSoft: 'rgba(47, 111, 179, 0.12)',

  sourceApp: '#3F63C7',
  sourceWhatsapp: '#1F7A4C',
  sourceCall: '#9A5C00',
  sourceWalkin: '#6B4BB0',
  sourceStaff: '#9B3F2C',
};

/** 4px base rhythm. Nothing off-scale. */
export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const borderWidth = {
  hairline: StyleSheetHairline(),
  thin: 1,
  thick: 2,
} as const;

function StyleSheetHairline(): number {
  return Platform.OS === 'android' ? 1 : 0.5;
}

/** Minimum touch target — WCAG 2.2 and both platform HIGs. */
export const minTouchTarget = 44;

export const duration = {
  instant: 80,
  fast: 140,
  normal: 220,
  slow: 320,
} as const;

export interface Theme {
  scheme: ColorScheme;
  colors: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  borderWidth: typeof borderWidth;
  duration: typeof duration;
  minTouchTarget: number;
}

export function createTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    space,
    radius,
    borderWidth,
    duration,
    minTouchTarget,
  };
}

export const themes = {
  dark: createTheme('dark'),
  light: createTheme('light'),
} as const;
