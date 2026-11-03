import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

import { useTheme, text, space, radius } from '@/theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.xl,
        gap: space.lg,
      }}
    >
      <Text style={[text.label, { color: c.textMuted }]}>404</Text>
      <Text style={[text.subheading, { color: c.textPrimary, textAlign: 'center' }]}>
        Yeh screen nahi mili
      </Text>
      <Link href="/" asChild>
        <Pressable
          style={{
            backgroundColor: c.accent,
            paddingHorizontal: space.xl,
            paddingVertical: space.md,
            borderRadius: radius.md,
            minHeight: theme.minTouchTarget,
            justifyContent: 'center',
          }}
        >
          <Text style={[text.button, { color: c.onAccent }]}>Ghar chalo</Text>
        </Pressable>
      </Link>
    </View>
  );
}
