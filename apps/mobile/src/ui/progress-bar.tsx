import React from 'react';
import { View } from 'react-native';

import { radius, useTheme } from '@/theme';

export interface ProgressBarProps {
  /** 0 to 1. Values outside the range are clamped, not thrown. */
  value: number;
  tone?: 'accent' | 'success' | 'danger' | 'neutral';
  height?: number;
  accessibilityLabel?: string;
}

export function ProgressBar({
  value,
  tone = 'accent',
  height = 6,
  accessibilityLabel,
}: ProgressBarProps) {
  const theme = useTheme();
  const c = theme.colors;

  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percent = `${Math.round(clamped * 100)}%` as const;

  const tones = {
    accent: c.accent,
    success: c.success,
    danger: c.danger,
    neutral: c.textMuted,
  } as const;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor: c.surfaceRaised,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: percent,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: tones[tone],
        }}
      />
    </View>
  );
}
