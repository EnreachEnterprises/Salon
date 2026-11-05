import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatClock, formatDayLabel } from '@salon/shared';

import { availableSlots, getService, mock, nextOpenSlots } from '@/mock';
import { radius, space, useTheme } from '@/theme';
import {
  Badge,
  Button,
  Card,
  Chip,
  Icon,
  ListRow,
  Money,
  Screen,
  SectionHeader,
  Text,
} from '@/ui';

/**
 * Screen 1 — Slot booking.
 *
 * Three decisions, in the order a customer makes them: what, who, when. Picking
 * a service narrows the stylist list, picking a stylist narrows the slots. The
 * result is a *request*: reception confirms it in one tap, because a customer
 * tapping a button must never silently move the day's book.
 */
export default function BookScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const firstServiceId = mock.services[0]?.id ?? '';
  const [serviceId, setServiceId] = useState(firstServiceId);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const service = getService(serviceId);
  const stylists = mock.staff.filter((member) =>
    service ? service.kinds.includes(member.kind) : false,
  );

  const slots = staffId
    ? availableSlots(staffId)
        .filter((option) => option.available)
        .slice(0, 6)
    : nextOpenSlots(serviceId, 6);

  function chooseService(id: string) {
    setServiceId(id);
    setStaffId(null);
    setSlot(null);
  }

  if (sent) {
    return (
      <Screen
        eyebrow={mock.salon.name}
        title="Request sent"
        subtitle="Reception confirms every request, so the day's book never moves without a human."
        edges={{ bottom: false }}
      >
        <Card tone="success">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Icon name="checkmark-circle-outline" size={24} color="success" />
            <Text variant="bodyStrong">
              {service?.name ?? 'Service'}
              {slot ? ` · ${formatClock(slot)}` : ''}
            </Text>
          </View>
          <Text variant="body" color="textSecondary">
            You&apos;ll get an email and a WhatsApp message the moment it is confirmed. If the
            slot goes, we&apos;ll offer you the next one.
          </Text>
        </Card>

        <SectionHeader title="What happens next" />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            <ListRow
              title="Reception confirms"
              subtitle="Usually within a few minutes during salon hours"
              leading={<Icon name="person-outline" size={18} color="textMuted" />}
            />
            <ListRow
              title="You get a reminder"
              subtitle="Both email and WhatsApp, before you leave home"
              leading={<Icon name="notifications-outline" size={18} color="textMuted" />}
            />
            <ListRow
              title="Walk in and take a token"
              subtitle="We hold the chair for 10 minutes past the slot"
              leading={<Icon name="time-outline" size={18} color="textMuted" />}
              last
            />
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button
            label="See the queue"
            variant="outline"
            onPress={() => router.push('/queue')}
          />
          <Button label="Book another" variant="ghost" onPress={() => setSent(false)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow={`${mock.salon.name} · ${formatDayLabel(mock.today)}`}
      title="Book a slot"
      subtitle="Pick a service, then a stylist and a time."
      gap={space.xl}
      edges={{ bottom: false }}
      footer={
        <Button
          label={slot ? `Request ${formatClock(slot)}` : 'Choose a time'}
          size="lg"
          fullWidth
          disabled={!slot}
          onPress={() => setSent(true)}
        />
      }
    >
      <View style={{ gap: space.sm }}>
        <SectionHeader title="Service" caption="Prices include everything except GST." />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {mock.services.map((option) => (
            <Chip
              key={option.id}
              label={option.name}
              selected={option.id === serviceId}
              onPress={() => chooseService(option.id)}
            />
          ))}
        </View>
      </View>

      {service ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
            <View style={{ flex: 1, gap: space.xxs }}>
              <Text variant="bodyStrong">{service.name}</Text>
              <Text variant="caption" color="textMuted">
                {service.durationMin} min · {service.category}
              </Text>
            </View>
            <Money paise={service.pricePaise} variant="section" showPaise={false} />
          </View>
        </Card>
      ) : null}

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Stylist"
          caption={
            staffId
              ? 'Times below are this stylist’s own open slots.'
              : 'Leave it to anyone and we show the earliest times across the floor.'
          }
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            <ListRow
              title="Anyone available"
              subtitle="Earliest slot across all stylists"
              leading={<Icon name="people-outline" size={18} color="textMuted" />}
              trailing={
                staffId === null ? (
                  <Icon name="checkmark-circle" size={20} color="accent" />
                ) : undefined
              }
              onPress={() => {
                setStaffId(null);
                setSlot(null);
              }}
            />
            {stylists.map((member, index) => (
              <ListRow
                key={member.id}
                title={member.name}
                subtitle={`${member.title} · ${formatClock(member.shift.start)}–${formatClock(
                  member.shift.end,
                )}`}
                trailing={
                  staffId === member.id ? (
                    <Icon name="checkmark-circle" size={20} color="accent" />
                  ) : undefined
                }
                onPress={() => {
                  setStaffId(member.id);
                  setSlot(null);
                }}
                last={index === stylists.length - 1}
              />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader title="Time" caption="Half-hour starts. Today only in this preview." />
        {slots.length === 0 ? (
          <Card>
            <Text variant="body" color="textSecondary">
              No open slots left today with this choice. Try another stylist, or ask reception for
              a walk-in token.
            </Text>
          </Card>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {slots.map((option) => (
              <Chip
                key={option.clock}
                label={formatClock(option.clock)}
                selected={slot === option.clock}
                onPress={() => setSlot(option.clock)}
              />
            ))}
          </View>
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          padding: space.md,
          borderRadius: radius.md,
          backgroundColor: c.surfaceRaised,
        }}
      >
        <Badge label="Request" tone="info" dot />
        <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
          A request is not a booking yet. Reception confirms it, then it appears in the queue.
        </Text>
      </View>
    </Screen>
  );
}
