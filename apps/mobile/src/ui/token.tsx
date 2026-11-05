import React from 'react';
import { View } from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Text } from './text';

export interface TokenProps {
  /** Queue token number. Read aloud, so it is always a real number. */
  value: number;
  label?: string;
  size?: 'md' | 'lg' | 'xl';
  tone?: 'accent' | 'neutral' | 'success';
}

/**
 * The queue token. A customer reads this number off a screen across a busy
 * room, so it is the largest thing on the queue screen and never shrinks below
 * the `subheading` step at 200% text size.
 */
export function Token({ value, label = 'Token', size = 'lg', tone = 'accent' }: TokenProps) {
  const theme = useTheme();
  const c = theme.colors;

  const tones = {
    accent: { border: c.accent, fg: c.accent, bg: c.accentSoft },
    neutral: { border: c.borderStrong, fg: c.textPrimary, bg: c.surfaceRaised },
    success: { border: c.success, fg: c.success, bg: c.successSoft },
  } as const;

  const sizes = {
    md: { box: 64, variant: 'subheading' as const },
    lg: { box: 92, variant: 'heading' as const },
    xl: { box: 116, variant: 'heading' as const },
  } as const;

  const t = tones[tone];
  const s = sizes[size];

  return (
    <View style={{ alignItems: 'center', gap: space.xs }}>
      <View
        accessibilityLabel={`${label} ${value}`}
        style={{
          width: s.box,
          height: s.box,
          borderRadius: radius.lg,
          borderWidth: theme.borderWidth.thick,
          borderColor: t.border,
          backgroundColor: t.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant={s.variant} color={t.fg} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text variant="label" color="textMuted">
        {label}
      </Text>
    </View>
  );
}
