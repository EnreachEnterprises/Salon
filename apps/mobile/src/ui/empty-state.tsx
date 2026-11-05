import React from 'react';
import { View } from 'react-native';

import { space } from '@/theme';
import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Every data screen needs an empty state that says what to do next, not just
 * that there is nothing here. One sentence, one action.
 */
export function EmptyState({ icon = 'sparkles-outline', title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.md,
        paddingVertical: space['4xl'],
        paddingHorizontal: space.lg,
      }}
    >
      <Icon name={icon} size={28} color="textMuted" />
      <Text variant="section" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="caption" color="textMuted" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="md" />
      ) : null}
    </View>
  );
}
