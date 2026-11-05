import React from 'react';
import { Pressable, View } from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Text } from './text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/**
 * Two to four mutually exclusive choices with no other affordance — payment
 * method, report granularity. Anything longer is a list, not a segment.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={{
        flexDirection: 'row',
        gap: space.xs,
        padding: space.xs,
        borderRadius: radius.md,
        backgroundColor: c.surfaceRaised,
        borderWidth: theme.borderWidth.hairline,
        borderColor: c.border,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.sm,
              backgroundColor: selected ? c.surface : 'transparent',
              borderWidth: theme.borderWidth.hairline,
              borderColor: selected ? c.borderStrong : 'transparent',
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Text variant="captionStrong" color={selected ? 'textPrimary' : 'textMuted'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
