import React, { useState } from 'react';
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: IconName;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  /** Fixed prefix inside the box, e.g. "₹" for a discount amount. */
  prefix?: string;
}

export function Field({
  label,
  hint,
  error,
  leftIcon,
  right,
  prefix,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);

  const borderColor = error ? c.danger : focused ? c.accent : c.border;

  return (
    <View style={[{ gap: space.xs }, containerStyle]}>
      {label ? (
        <Text variant="captionStrong" color={error ? 'danger' : 'textSecondary'}>
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          minHeight: 48,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: focused || error ? theme.borderWidth.thin * 1.5 : theme.borderWidth.thin,
          borderColor,
          backgroundColor: c.surfaceRaised,
        }}
      >
        {leftIcon ? <Icon name={leftIcon} size={18} color={focused ? 'accent' : 'textMuted'} /> : null}

        {prefix ? (
          <Text variant="body" color="textSecondary">
            {prefix}
          </Text>
        ) : null}

        <TextInput
          {...inputProps}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={c.textMuted}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          style={{
            flex: 1,
            minHeight: 46,
            paddingVertical: space.md,
            color: c.textPrimary,
            fontSize: 16,
            fontFamily: 'AzeretMono_400Regular',
          }}
        />

        {right}
      </View>

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
