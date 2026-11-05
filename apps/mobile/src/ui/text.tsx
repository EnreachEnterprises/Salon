import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import type { TextVariant, ThemeColors } from '@/theme';
import { text as textStyles, useTheme } from '@/theme';

export interface TextProps extends RNTextProps {
  /** Named style from the 1.333 scale. Never pass a raw fontSize. */
  variant?: TextVariant;
  /** Theme colour token, or a raw colour string for the rare gradient edge. */
  color?: keyof ThemeColors | (string & {});
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const resolved = (theme.colors as unknown as Record<string, string>)[color] ?? color;

  return (
    <RNText
      {...rest}
      style={[
        textStyles[variant],
        { color: resolved },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
