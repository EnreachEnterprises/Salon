import React from 'react';
import { Pressable, View } from 'react-native';

import { space, useTheme } from '@/theme';
import { Icon } from './icon';
import { Text } from './text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Right-aligned small text, e.g. a time or a count. */
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Suppress the bottom divider on the last row of a group. */
  last?: boolean;
  disabled?: boolean;
}

export function ListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  last = false,
  disabled = false,
}: ListRowProps) {
  const theme = useTheme();
  const c = theme.colors;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: 56,
        paddingVertical: space.md,
      }}
    >
      {leading}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {meta ? (
        <Text variant="captionStrong" color="textSecondary">
          {meta}
        </Text>
      ) : null}

      {trailing}

      {onPress ? <Icon name="chevron-forward" size={16} color="textMuted" /> : null}
    </View>
  );

  return (
    <View
      style={{
        borderBottomWidth: last ? 0 : theme.borderWidth.hairline,
        borderBottomColor: c.border,
      }}
    >
      {onPress ? (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : disabled ? 0.5 : 1 })}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </View>
  );
}
