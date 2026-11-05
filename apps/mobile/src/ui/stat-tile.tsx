import React from 'react';
import { View } from 'react-native';

import type { ThemeColors } from '@/theme';
import { radius, space, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface StatTileProps {
  label: string;
  /** Pre-formatted. Pass <Money /> in if the value is money. */
  value: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'success' | 'danger';
  icon?: IconName;
}

/**
 * One number with its name. The owner dashboard is a grid of these, and every
 * tile answers exactly one question — no tile carries two figures.
 */
export function StatTile({ label, value, hint, tone = 'default', icon }: StatTileProps) {
  const theme = useTheme();
  const c = theme.colors;

  const tones: Record<NonNullable<StatTileProps['tone']>, { value: keyof ThemeColors; border: string }> = {
    default: { value: 'textPrimary', border: c.border },
    accent: { value: 'accent', border: c.accent },
    success: { value: 'success', border: c.success },
    danger: { value: 'danger', border: c.danger },
  };

  const t = tones[tone];

  return (
    <View
      style={{
        flex: 1,
        minWidth: 140,
        gap: space.xs,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: theme.borderWidth.hairline,
        borderColor: t.border,
        backgroundColor: c.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
        {icon ? <Icon name={icon} size={13} color="textMuted" /> : null}
        <Text variant="label" color="textMuted" numberOfLines={1}>
          {label}
        </Text>
      </View>

      <Text variant="subheading" color={t.value} numberOfLines={1}>
        {value}
      </Text>

      {hint ? (
        <Text variant="caption" color="textMuted" numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
