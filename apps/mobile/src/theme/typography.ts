import type { TextStyle } from 'react-native';

/**
 * Azeret Mono, two weights only: 400 for everything read, 700 for headings and
 * numbers that must be scanned. The monospace grid is the identity of the app —
 * it makes prices, times and counts line up in columns without extra work.
 *
 * Scale is exactly 1.333 (a perfect fourth):
 *   h1 4.210rem  67px
 *   h2 3.157rem  51px
 *   h3 2.369rem  38px
 *   h4 1.777rem  28px
 *   h5 1.333rem  21px
 *   body 1.000rem 16px
 *   small 0.750rem 12px
 *
 * Base is 16px. Do not add off-scale sizes; if something needs to be smaller
 * than `small`, the layout is wrong.
 */

export const fontFamily = {
  regular: 'AzeretMono_400Regular',
  bold: 'AzeretMono_700Bold',
} as const;

export const typeScale = {
  h1: { fontSize: 67, lineHeight: 71, letterSpacing: -1.2 },
  h2: { fontSize: 51, lineHeight: 56, letterSpacing: -0.9 },
  h3: { fontSize: 38, lineHeight: 44, letterSpacing: -0.6 },
  h4: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
  h5: { fontSize: 21, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
  small: { fontSize: 12, lineHeight: 17, letterSpacing: 0.2 },
} as const;

export type TypeToken = keyof typeof typeScale;

function style(token: TypeToken, weight: 'regular' | 'bold'): TextStyle {
  return {
    ...typeScale[token],
    fontFamily: weight === 'bold' ? fontFamily.bold : fontFamily.regular,
    fontWeight: weight === 'bold' ? '700' : '400',
  };
}

/**
 * Named text styles. Screens use these, never raw fontSize.
 */
export const text = {
  /** Screen-defining statement. One per screen, at most. */
  display: style('h1', 'bold'),
  /** Page title inside a stack header. */
  title: style('h2', 'bold'),
  /** Section header, big. */
  heading: style('h3', 'bold'),
  /** Card title, panel header. */
  subheading: style('h4', 'bold'),
  /** List group header. */
  section: style('h5', 'bold'),

  body: style('body', 'regular'),
  bodyStrong: style('body', 'bold'),
  bodyLarge: { ...style('body', 'regular'), fontSize: 18, lineHeight: 28 },

  caption: style('small', 'regular'),
  captionStrong: style('small', 'bold'),

  /** Prices, counts, timers — same grid as body, always bold. */
  metric: style('body', 'bold'),
  metricLarge: style('h5', 'bold'),
  metricXLarge: style('h4', 'bold'),

  /** Buttons and inputs. */
  button: { ...style('body', 'bold'), letterSpacing: 0.3 },
  label: { ...style('small', 'bold'), letterSpacing: 1.2, textTransform: 'uppercase' as const },
} as const;

export type TextVariant = keyof typeof text;
