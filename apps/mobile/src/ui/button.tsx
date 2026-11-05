import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'leading' | 'trailing';
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'leading',
  fullWidth = false,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const c = theme.colors;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.accent, fg: c.onAccent, border: 'transparent' },
    secondary: { bg: c.surfaceRaised, fg: c.textPrimary, border: c.border },
    outline: { bg: 'transparent', fg: c.textPrimary, border: c.borderStrong },
    ghost: { bg: 'transparent', fg: c.textSecondary, border: 'transparent' },
    danger: { bg: c.dangerSoft, fg: c.danger, border: 'transparent' },
    success: { bg: c.successSoft, fg: c.success, border: 'transparent' },
  };

  const tone = palette[variant];
  const inactive = disabled || loading;
  const height = size === 'lg' ? 56 : 48;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      {loading ? (
        <ActivityIndicator size="small" color={tone.fg} />
      ) : icon && iconPosition === 'leading' ? (
        <Icon name={icon} size={18} color={tone.fg} />
      ) : null}

      <Text variant="button" color={tone.fg} numberOfLines={1}>
        {label}
      </Text>

      {!loading && icon && iconPosition === 'trailing' ? (
        <Icon name={icon} size={18} color={tone.fg} />
      ) : null}
    </View>
  );

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        {
          minHeight: height,
          paddingHorizontal: space.xl,
          borderRadius: radius.md,
          borderWidth: variant === 'ghost' ? 0 : theme.borderWidth.thin,
          borderColor: tone.border,
          backgroundColor: tone.bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.45 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}
