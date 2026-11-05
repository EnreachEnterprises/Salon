import React from 'react';
import { Pressable, View } from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  icon?: IconName;
}

export function Chip({ label, selected = false, onPress, disabled = false, icon }: ChipProps) {
  const theme = useTheme();
  const c = theme.colors;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.xs,
        minHeight: theme.minTouchTarget,
        paddingHorizontal: space.md,
        borderRadius: radius.pill,
        borderWidth: theme.borderWidth.thin,
        borderColor: selected ? c.accent : c.border,
        backgroundColor: selected ? c.accentSoft : c.surface,
        justifyContent: 'center',
      }}
    >
      {icon ? <Icon name={icon} size={15} color={selected ? 'accent' : 'textMuted'} /> : null}
      <Text variant="captionStrong" color={selected ? 'accent' : disabled ? 'textMuted' : 'textSecondary'}>
        {label}
      </Text>
    </View>
  );

  if (!onPress) return <View style={{ opacity: disabled ? 0.45 : 1 }}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => ({ opacity: disabled ? 0.45 : pressed ? 0.75 : 1 })}
    >
      {body}
    </Pressable>
  );
}
