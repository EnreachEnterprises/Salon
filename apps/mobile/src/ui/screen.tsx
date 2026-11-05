import React from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { radius, space, useTheme } from '@/theme';
import { Icon } from './icon';
import { Text } from './text';

export interface ScreenProps {
  children: React.ReactNode;
  /** Small uppercase line above the title, e.g. the salon name or the date. */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  /** Show a back chevron. Use on drilled-in screens only. */
  back?: boolean;
  /** Default true. Set false for screens that own their scrolling (lists). */
  scroll?: boolean;
  padded?: boolean;
  /** Pinned action area, above the home indicator. */
  footer?: React.ReactNode;
  gap?: number;
  edges?: { top?: boolean; bottom?: boolean };
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  eyebrow,
  title,
  subtitle,
  headerRight,
  back = false,
  scroll = true,
  padded = true,
  footer,
  gap = space.lg,
  edges,
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const showTop = edges?.top ?? true;
  const showBottom = edges?.bottom ?? true;
  const hasHeader = Boolean(eyebrow || title || subtitle || headerRight || back);

  const horizontal = padded ? { paddingHorizontal: space.lg } : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: showTop ? insets.top : 0 }}>
      {hasHeader ? (
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.lg,
            paddingBottom: space.md,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: space.md,
          }}
        >
          {back ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={({ pressed }) => ({
                width: theme.minTouchTarget,
                height: theme.minTouchTarget,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: -space.sm,
                backgroundColor: pressed ? c.surfaceRaised : 'transparent',
              })}
            >
              <Icon name="chevron-back" size={24} color="textPrimary" />
            </Pressable>
          ) : null}

          <View style={{ flex: 1, gap: space.xxs }}>
            {eyebrow ? (
              <Text variant="label" color="accent">
                {eyebrow}
              </Text>
            ) : null}
            {title ? (
              <Text variant="subheading" numberOfLines={2}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text variant="caption" color="textMuted">
                {subtitle}
              </Text>
            ) : null}
          </View>

          {headerRight ? <View style={{ paddingTop: space.xs }}>{headerRight}</View> : null}
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[horizontal, { gap, paddingBottom: space['4xl'] }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, gap }, horizontal, contentStyle]}>{children}</View>
      )}

      {footer ? (
        <View
          style={{
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: (showBottom ? insets.bottom : 0) + space.md,
            borderTopWidth: theme.borderWidth.hairline,
            borderTopColor: c.border,
            backgroundColor: c.bg,
            gap: space.sm,
          }}
        >
          {footer}
        </View>
      ) : showBottom ? (
        <View style={{ height: insets.bottom }} />
      ) : null}
    </View>
  );
}
