import React from 'react';
import { Tabs } from 'expo-router';

import type { Role } from '@/session';
import { RoleGate } from '@/session';
import { text, useTheme } from '@/theme';
import { Icon, type IconName } from '@/ui';

export interface RoleTab {
  /** Route file name inside the group, without the extension. */
  name: string;
  title: string;
  icon: IconName;
}

/**
 * Every role gets the same tab chrome, so the four groups cannot drift apart.
 *
 * The gate lives here rather than in each layout: a customer who deep-links to
 * `/earnings` is sent to their own home instead of seeing a flash of the owner
 * dashboard. Tab order is the order of `screens`, which is also the priority
 * order in the PRD.
 *
 * Height is deliberately not set. React Navigation adds the bottom safe-area
 * inset itself; a hard-coded height clips the labels on a notched phone.
 */
export function RoleTabs({
  allow,
  screens,
}: {
  allow: readonly Role[];
  screens: readonly RoleTab[];
}) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <RoleGate allow={allow}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: {
            backgroundColor: c.surface,
            borderTopColor: c.border,
            borderTopWidth: theme.borderWidth.hairline,
          },
          tabBarLabelStyle: text.label,
        }}
      >
        {screens.map((screen) => (
          <Tabs.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.title,
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name={screen.icon}
                  size={size}
                  color={typeof color === 'string' ? color : c.textMuted}
                />
              ),
            }}
          />
        ))}
      </Tabs>
    </RoleGate>
  );
}
