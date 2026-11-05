import React from 'react';
import { Pressable, View } from 'react-native';

import { space } from '@/theme';
import { Text } from './text';

export interface SectionHeaderProps {
  title: string;
  /** Right-hand secondary action, rendered as plain text. */
  actionLabel?: string;
  onAction?: () => void;
  /** Short count or context line under the title. */
  caption?: string;
}

export function SectionHeader({ title, actionLabel, onAction, caption }: SectionHeaderProps) {
  return (
    <View style={{ gap: space.xxs }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md }}>
        <Text variant="section" style={{ flex: 1 }} numberOfLines={1}>
          {title}
        </Text>

        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text variant="captionStrong" color="accent">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {caption ? (
        <Text variant="caption" color="textMuted">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}
