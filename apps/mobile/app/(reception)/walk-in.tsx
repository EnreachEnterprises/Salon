import React, { useState } from 'react';
import { View } from 'react-native';
import { formatClock, formatDayLabel, formatPaise } from '@salon/shared';

import { getService, mock, queueStats, staffName } from '@/mock';
import { space, useTheme } from '@/theme';
import {
  Badge,
  Button,
  Card,
  Chip,
  Field,
  Icon,
  Screen,
  SectionHeader,
  Text,
  Token,
} from '@/ui';

/**
 * Screen 5 — Walk-in entry.
 *
 * The three seconds between "do you have a slot?" and a token in the customer's
 * hand. Name and phone are the only typed fields; everything else is a tap. The
 * token preview comes from the same queue the customer screen reads, so the
 * number quoted at the desk is the number they see on their phone.
 */
export default function WalkInScreen() {
  const theme = useTheme();
  const c = theme.colors;

  const stats = queueStats();
  const token = stats.nextToken;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selected = serviceIds
    .map((id) => getService(id))
    .filter((service): service is NonNullable<typeof service> => !!service);

  const durationMin = selected.reduce((sum, service) => sum + service.durationMin, 0);
  const totalPaise = selected.reduce((sum, service) => sum + service.pricePaise, 0);

  const canAdd = name.trim().length > 0 && serviceIds.length > 0;

  function toggleService(id: string) {
    setServiceIds((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }

  function reset() {
    setName('');
    setPhone('');
    setServiceIds([]);
    setStaffId(null);
    setAdded(false);
  }

  if (added) {
    return (
      <Screen
        eyebrow={formatDayLabel(mock.today)}
        title="Added to the queue"
        subtitle="The customer can watch their position from their own screen."
        edges={{ bottom: false }}
      >
        <Card tone="success">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <Token value={token} size="lg" tone="success" />
            <View style={{ flex: 1, gap: space.xxs }}>
              <Text variant="bodyStrong">{name.trim()}</Text>
              <Text variant="caption" color="textSecondary">
                {selected.map((service) => service.name).join(' + ')}
              </Text>
              <Text variant="caption" color="textMuted">
                {staffId ? staffName(staffId) : 'Anyone available'} ·{' '}
                {formatPaise(totalPaise)}
              </Text>
            </View>
          </View>
          <Text variant="caption" color="textSecondary">
            About {stats.averageWaitMin} minutes of waiting in the room right now. The desk calls
            the token; the customer does not need to keep this screen open.
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Add another walk-in" variant="outline" onPress={reset} />
          <Button label="Done" variant="ghost" onPress={reset} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow={formatDayLabel(mock.today)}
      title="Walk-in entry"
      subtitle="Name, phone, what they want. That is the whole form."
      gap={space.xl}
      edges={{ bottom: false }}
      footer={
        <Button
          label={canAdd ? `Add as token ${token}` : 'Name and service first'}
          size="lg"
          fullWidth
          disabled={!canAdd}
          onPress={() => setAdded(true)}
        />
      }
    >
      <View style={{ gap: space.md }}>
        <Field
          label="Name"
          placeholder="Customer name"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
          autoCapitalize="words"
          returnKeyType="next"
        />
        <Field
          label="Phone"
          placeholder="+91"
          value={phone}
          onChangeText={setPhone}
          leftIcon="call-outline"
          keyboardType="phone-pad"
          hint="Optional, but it is what makes the next visit a returning customer."
        />
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Services"
          caption={serviceIds.length ? `${serviceIds.length} selected` : 'Tap everything they asked for.'}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {mock.services.map((service) => (
            <Chip
              key={service.id}
              label={service.name}
              selected={serviceIds.includes(service.id)}
              onPress={() => toggleService(service.id)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader title="Stylist" caption="Leave it open if the floor decides." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <Chip label="Anyone" selected={staffId === null} onPress={() => setStaffId(null)} />
          {mock.staff.map((member) => (
            <Chip
              key={member.id}
              label={member.name}
              selected={staffId === member.id}
              onPress={() => setStaffId(member.id)}
            />
          ))}
        </View>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <Token value={token} size="md" tone="neutral" />
          <View style={{ flex: 1, gap: space.xxs }}>
            <Text variant="bodyStrong">Token {token}</Text>
            <Text variant="caption" color="textMuted">
              {selected.length === 0
                ? 'Pick a service to see the estimated chair time.'
                : `${durationMin} min in the chair · ${selected.length} service${
                    selected.length === 1 ? '' : 's'
                  }`}
            </Text>
          </View>
          <Text variant="section">{formatPaise(totalPaise)}</Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            paddingTop: space.md,
            borderTopWidth: theme.borderWidth.hairline,
            borderTopColor: c.border,
          }}
        >
          <Badge label={`${stats.waiting} waiting`} tone="info" dot />
          <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
            Waiting about {stats.averageWaitMin} min on average today.
          </Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <Icon name="information-circle-outline" size={18} color="textMuted" />
        <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
          A walk-in gets a token now and is billed later from the Billing tab. Nothing here takes
          money.
        </Text>
      </View>
    </Screen>
  );
}
