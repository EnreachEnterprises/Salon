import React from 'react';
import { View } from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Text } from './text';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Leading dot. Status is never colour alone, so a dot plus a word. */
  dot?: boolean;
}

export function Badge({ label, tone = 'neutral', dot = false }: BadgeProps) {
  const theme = useTheme();
  const c = theme.colors;

  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: c.surfaceRaised, fg: c.textSecondary },
    accent: { bg: c.accentSoft, fg: c.accent },
    success: { bg: c.successSoft, fg: c.success },
    warning: { bg: c.warningSoft, fg: c.warning },
    danger: { bg: c.dangerSoft, fg: c.danger },
    info: { bg: c.infoSoft, fg: c.info },
  };

  const t = tones[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        alignSelf: 'flex-start',
        paddingHorizontal: space.sm,
        paddingVertical: 3,
        borderRadius: radius.pill,
        backgroundColor: t.bg,
      }}
    >
      {dot ? (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.fg }} />
      ) : null}
      <Text variant="captionStrong" color={t.fg}>
        {label}
      </Text>
    </View>
  );
}
