import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

export interface DividerProps {
  /** Inset from the left, matching where text starts inside a row. */
  inset?: number;
  vertical?: boolean;
  spacing?: number;
}

export function Divider({ inset = 0, vertical = false, spacing = 0 }: DividerProps) {
  const theme = useTheme();
  const c = theme.colors;

  if (vertical) {
    return (
      <View
        style={{
          width: theme.borderWidth.hairline,
          alignSelf: 'stretch',
          backgroundColor: c.border,
          marginVertical: spacing,
        }}
      />
    );
  }

  return (
    <View
      style={{
        height: theme.borderWidth.hairline,
        backgroundColor: c.border,
        marginLeft: inset,
        marginVertical: spacing,
      }}
    />
  );
}
