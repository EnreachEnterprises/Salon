import React from 'react';
import { View, type DimensionValue } from 'react-native';

import { radius, useTheme } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

/**
 * Loading placeholder. Deliberately still: a pulsing block in a queue screen
 * reads as "the app is busy", which is exactly the anxiety we are removing.
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm }: SkeletonProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: theme.colors.surfaceRaised,
      }}
    />
  );
}
