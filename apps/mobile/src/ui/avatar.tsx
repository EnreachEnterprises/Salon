import React from 'react';
import { View } from 'react-native';

import { radius, useTheme } from '@/theme';
import { Text } from './text';

export type AvatarTone = 'neutral' | 'accent' | 'secondary' | 'success';

export interface AvatarProps {
  name: string;
  size?: number;
  tone?: AvatarTone;
}

/** First letters of the first two words. Names are the only identity here. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${second}`.toUpperCase();
}

export function Avatar({ name, size = 36, tone = 'neutral' }: AvatarProps) {
  const theme = useTheme();
  const c = theme.colors;

  const tones: Record<AvatarTone, { bg: string; fg: string }> = {
    neutral: { bg: c.surfaceRaised, fg: c.textSecondary },
    accent: { bg: c.accentSoft, fg: c.accent },
    secondary: { bg: c.secondarySoft, fg: c.secondary },
    success: { bg: c.successSoft, fg: c.success },
  };

  const t = tones[tone];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        backgroundColor: t.bg,
        borderWidth: theme.borderWidth.hairline,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="captionStrong" color={t.fg} style={{ fontSize: Math.max(10, Math.round(size * 0.36)) }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
