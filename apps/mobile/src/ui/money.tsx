import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import type { Paise } from '@salon/shared';
import { formatPaise, formatPaiseCompact } from '@salon/shared';
import type { TextVariant, ThemeColors } from '@/theme';
import { Text } from './text';

export interface MoneyProps {
  paise: Paise;
  variant?: TextVariant;
  color?: keyof ThemeColors | (string & {});
  /** Dashboard tiles only. A receipt never abbreviates. */
  compact?: boolean;
  showPaise?: boolean;
  symbol?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * The only place paise becomes a string on a screen. Money is integer paise
 * everywhere else in the app; formatting is a display concern and lives here.
 */
export function Money({
  paise,
  variant = 'metric',
  color = 'textPrimary',
  compact = false,
  showPaise = true,
  symbol = true,
  style,
}: MoneyProps) {
  const label = compact
    ? formatPaiseCompact(paise)
    : formatPaise(paise, { symbol, paise: showPaise });

  return (
    <Text variant={variant} color={color} style={style} numberOfLines={1}>
      {label}
    </Text>
  );
}
