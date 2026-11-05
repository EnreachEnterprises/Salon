import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { ThemeColors } from '@/theme';
import { useTheme } from '@/theme';

/**
 * One icon set, one wrapper. Screens never import Ionicons directly: the name
 * is type-checked here and the colour resolves against the theme, so a
 * hard-coded hex cannot sneak into a component.
 */
export type IconName = keyof typeof Ionicons.glyphMap;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: keyof ThemeColors | string;
}

export function Icon({ name, size = 20, color = 'textSecondary' }: IconProps) {
  const theme = useTheme();
  const resolved = (theme.colors as unknown as Record<string, string>)[color] ?? color;

  return <Ionicons name={name} size={size} color={resolved} />;
}
