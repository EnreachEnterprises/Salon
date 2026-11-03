import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, text, space, radius } from '@/theme';
import { formatPaise, formatClock, formatDayLabel, todayISO } from '@salon/shared';

/**
 * P0 scaffold screen: a visual proof that the typeface, the 1.333 scale, the
 * dark palette and the shared money/date helpers all work on device.
 *
 * P1 replaces this file with the role gateway (owner / reception / staff).
 */
export default function ScaffoldScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + space['3xl'],
        paddingBottom: insets.bottom + space['5xl'],
        paddingHorizontal: space.xl,
        gap: space['3xl'],
      }}
    >
      <View style={{ gap: space.sm }}>
        <Text style={[text.label, { color: c.accent }]}>Salon</Text>
        <Text style={[text.display, { color: c.textPrimary }]}>Aaj ka din</Text>
        <Text style={[text.body, { color: c.textSecondary }]}>
          Scaffold runs. Typeface, scale and tokens are live.
        </Text>
      </View>

      <View style={{ gap: space.md }}>
        <Text style={[text.label, { color: c.textMuted }]}>Type scale 1.333</Text>
        {(
          [
            ['h1', text.heading],
            ['h2', text.subheading],
            ['h3', text.section],
            ['body', text.body],
            ['small', text.caption],
          ] as const
        ).map(([label, style]) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.md }}>
            <Text style={[text.caption, { color: c.textMuted, width: 44 }]}>{label}</Text>
            <Text style={[style, { color: c.textPrimary }]} numberOfLines={1}>
              ₹1,234
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: space.md }}>
        <Text style={[text.label, { color: c.textMuted }]}>Today</Text>
        <View
          style={{
            backgroundColor: c.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: c.border,
            padding: space.lg,
            gap: space.sm,
          }}
        >
          <Text style={[text.caption, { color: c.textMuted }]}>{formatDayLabel(todayISO())}</Text>
          <Row label="Sameer · Haircut + Beard" value={formatPaise(50000)} />
          <Row label="Slot 18:30" value={formatClock('18:30')} />
          <Row label="Commission" value={formatPaise(2500)} accent />
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <Text style={[text.label, { color: c.textMuted }]}>Palette</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {[
            ['bg', c.bg],
            ['surface', c.surface],
            ['raised', c.surfaceRaised],
            ['accent', c.accent],
            ['secondary', c.secondary],
            ['success', c.success],
            ['danger', c.danger],
            ['warning', c.warning],
          ].map(([name, color]) => (
            <View key={name} style={{ gap: space.xs, width: 72 }}>
              <View
                style={{
                  height: 44,
                  borderRadius: radius.sm,
                  backgroundColor: color,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              />
              <Text style={[text.caption, { color: c.textMuted }]}>{name}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[text.caption, { color: c.textMuted }]}>
        P0 · scaffold only. Role routing lands in P1.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[text.body, { color: theme.colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[text.metric, { color: accent ? theme.colors.accent : theme.colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
});
