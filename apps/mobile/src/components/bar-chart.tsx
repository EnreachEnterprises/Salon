import React from 'react';
import { View } from 'react-native';

import { radius, space, useTheme } from '@/theme';
import { Text } from '@/ui';

export interface BarChartDatum {
  /** Stable React key — not shown. */
  key: string;
  /** Axis label. Kept short by the caller: "3 Nov", "Mon". */
  label: string;
  /** Any non-negative number. Scale is relative to the tallest column. */
  value: number;
  /** Read by a screen reader instead of "label value" when set. */
  accessibilityLabel?: string;
}

export interface BarChartProps {
  data: readonly BarChartDatum[];
  /** Pixel height of the tallest column, labels excluded. */
  height?: number;
  /** Show every Nth axis label. Defaults to about seven labels. */
  showEvery?: number;
  tone?: 'accent' | 'secondary' | 'success';
  formatValue?: (value: number) => string;
  /** Shown instead of the plot when there is nothing to draw. */
  emptyLabel?: string;
}

/**
 * A column chart small enough to stay honest: one series, one scale, no legend,
 * no tooltip and no library. Two screens ask "how did the last N days go", and
 * the answer is the shape, not the exact pixel.
 *
 * The tallest column defines the scale. A day with zero revenue still gets a
 * two-pixel stub so "closed" and "missing" never look the same.
 */
export function BarChart({
  data,
  height = 120,
  showEvery,
  tone = 'accent',
  formatValue,
  emptyLabel = 'Nothing to chart yet',
}: BarChartProps) {
  const theme = useTheme();
  const c = theme.colors;

  const colours = {
    accent: c.accent,
    secondary: c.secondary,
    success: c.success,
  } as const;

  if (data.length === 0) {
    return (
      <View style={{ minHeight: height, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" color="textMuted">
          {emptyLabel}
        </Text>
      </View>
    );
  }

  const max = Math.max(...data.map((datum) => datum.value), 1);
  const gap = data.length > 40 ? 1 : data.length > 14 ? 2 : space.xs;
  const labelStep = showEvery ?? Math.max(1, Math.ceil(data.length / 7));

  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap }}>
        {data.map((datum) => {
          const ratio = Math.max(0, Math.min(1, datum.value / max));
          const barHeight = datum.value > 0 ? Math.max(3, Math.round(ratio * height)) : 2;
          const readOut =
            datum.accessibilityLabel ??
            `${datum.label}: ${(formatValue ?? String)(datum.value)}`;

          return (
            <View
              key={datum.key}
              accessible
              accessibilityRole="image"
              accessibilityLabel={readOut}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  height: barHeight,
                  borderRadius: radius.sm / 4,
                  backgroundColor: datum.value > 0 ? colours[tone] : c.border,
                }}
              />
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap }}>
        {data.map((datum, index) => (
          <View key={datum.key} style={{ flex: 1 }}>
            {index % labelStep === 0 || index === data.length - 1 ? (
              <Text variant="caption" color="textMuted" numberOfLines={1} style={{ textAlign: 'center' }}>
                {datum.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}
