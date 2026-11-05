import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatClock } from '@salon/shared';

import { queuePositionFor, queueStats, serviceNames, staffName } from '@/mock';
import { useSessionUser } from '@/session';
import { space, useTheme } from '@/theme';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Screen,
  SectionHeader,
  StatTile,
  Text,
  Token,
} from '@/ui';

interface Step {
  label: string;
  meta?: string;
  done: boolean;
  current: boolean;
}

/**
 * Screen 2 — Live queue.
 *
 * The token is the screen. Everything else answers the two questions a waiting
 * customer actually has: how long, and is it nearly my turn. Polling replaces
 * the mock read at B1; nothing below assumes the data is live.
 */
export default function QueueScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const user = useSessionUser();

  const position = queuePositionFor(user?.customerId ?? '');
  const stats = queueStats();

  if (!position) {
    return (
      <Screen
        title="Live queue"
        subtitle="No token against your name right now."
        edges={{ bottom: false }}
      >
        <EmptyState
          icon="people-outline"
          title="You're not in the queue"
          body="Book a slot and reception will add you, or walk in and ask for a token at the desk."
          actionLabel="Book a slot"
          onAction={() => router.push('/book')}
        />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <StatTile label="Waiting now" value={String(stats.waiting)} hint="tokens" />
          <StatTile label="Average wait" value={`${stats.averageWaitMin} min`} hint="today" />
        </View>
      </Screen>
    );
  }

  const entry = position.entry;
  const steps: Step[] = [
    { label: 'Checked in', meta: formatClock(entry.joinedAtClock), done: true, current: false },
    {
      label: 'Waiting',
      meta: `${position.ahead} ahead of you`,
      done: entry.status !== 'waiting',
      current: entry.status === 'waiting',
    },
    {
      label: 'In the chair',
      meta: staffName(entry.staffId),
      done: entry.status === 'done',
      current: entry.status === 'in_service',
    },
    {
      label: 'Done',
      meta: 'Bill at the desk',
      done: entry.status === 'done',
      current: false,
    },
  ];

  return (
    <Screen
      eyebrow={`${serviceNames(entry.serviceIds)} · ${formatClock(entry.joinedAtClock)}`}
      title="You're in line"
      subtitle="This refreshes every few seconds once the queue API is live."
      edges={{ bottom: false }}
    >
      <Card tone="accent">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <Token value={entry.token} size="xl" tone="accent" />
          <View style={{ flex: 1, gap: space.xs }}>
            <Text variant="bodyStrong">{entry.name}</Text>
            <Text variant="caption" color="textSecondary">
              {serviceNames(entry.serviceIds)}
            </Text>
            <View style={{ flexDirection: 'row', gap: space.xs, alignItems: 'center' }}>
              <Badge
                label={entry.status === 'in_service' ? 'In chair' : `${position.ahead} ahead`}
                tone={entry.status === 'in_service' ? 'accent' : 'info'}
                dot
              />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs }}>
          <Text variant="metricLarge" color="accent">
            {position.estimatedWaitMin}
          </Text>
          <Text variant="body" color="textSecondary">
            minutes estimated
          </Text>
        </View>
      </Card>

      <View style={{ gap: space.sm }}>
        <SectionHeader title="Your visit" caption="The desk moves your token, not this screen." />
        <Card>
          {steps.map((step, index) => {
            const last = index === steps.length - 1;
            const dotColor = step.done || step.current ? c.accent : c.border;
            return (
              <View key={step.label} style={{ flexDirection: 'row', gap: space.md }}>
                <View style={{ alignItems: 'center', width: 16 }}>
                  <View
                    style={{
                      width: step.current ? 14 : 10,
                      height: step.current ? 14 : 10,
                      borderRadius: 999,
                      marginTop: 6,
                      backgroundColor: step.current ? c.accent : step.done ? c.accent : 'transparent',
                      borderWidth: step.done || step.current ? 0 : theme.borderWidth.thin,
                      borderColor: dotColor,
                    }}
                  />
                  {last ? null : (
                    <View
                      style={{
                        flex: 1,
                        width: theme.borderWidth.thin,
                        marginTop: space.xxs,
                        backgroundColor: c.border,
                      }}
                    />
                  )}
                </View>

                <View style={{ flex: 1, paddingBottom: last ? 0 : space.md, gap: space.xxs }}>
                  <Text
                    variant="bodyStrong"
                    color={step.done || step.current ? 'textPrimary' : 'textMuted'}
                  >
                    {step.label}
                  </Text>
                  {step.meta ? (
                    <Text variant="caption" color="textMuted">
                      {step.meta}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile label="Waiting" value={String(stats.waiting)} hint="in the room" />
        <StatTile label="In chair" value={String(stats.inService)} hint="being served" />
        <StatTile label="Average" value={`${stats.averageWaitMin}m`} hint="today's wait" />
      </View>

      <Card>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
          <Icon name="information-circle-outline" size={18} color="textMuted" />
          <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
            Longest wait in the room is {stats.longestWaitMin} minutes. If you need to step out,
            tell the desk and we hold your token for 10 minutes.
          </Text>
        </View>
      </Card>

      <Button
        label="View my reminders"
        variant="ghost"
        onPress={() => router.push('/reminders')}
      />
    </Screen>
  );
}
