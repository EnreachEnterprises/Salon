import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useTheme } from '@/theme';

export type CardTone = 'default' | 'raised' | 'accent' | 'danger' | 'success';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: CardTone;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  tone = 'default',
  padded = true,
  style,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();
  const c = theme.colors;

  const tones: Record<CardTone, { bg: string; border: string }> = {
    default: { bg: c.surface, border: c.border },
    raised: { bg: c.surfaceRaised, border: c.border },
    accent: { bg: c.accentSoft, border: c.accent },
    danger: { bg: c.dangerSoft, border: c.danger },
    success: { bg: c.successSoft, border: c.success },
  };

  const visual: StyleProp<ViewStyle> = [
    {
      backgroundColor: tones[tone].bg,
      borderColor: tones[tone].border,
      borderWidth: theme.borderWidth.hairline,
      borderRadius: radius.lg,
      padding: padded ? space.lg : 0,
      gap: space.md,
    },
    style,
  ];

  if (!onPress) return <View style={visual}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [visual, { opacity: pressed ? 0.85 : 1 }]}
    >
      {children}
    </Pressable>
  );
}
