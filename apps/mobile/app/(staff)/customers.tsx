import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatClock, formatDayLabel, formatPaise } from '@salon/shared';

import {
  availableSlots,
  bookingsForStaff,
  customerName,
  getCustomer,
  mock,
  recentCustomers,
  serviceNames,
  staffName,
  staffTodaySummary,
  STATUS_LABEL,
  statusTone,
} from '@/mock';
import { useSessionUser } from '@/session';
import { space } from '@/theme';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Icon,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
  Text,
} from '@/ui';

/**
 * Screen 7 — Today's customers (stylist).
 *
 * The stylist's own chair, nothing else. The phone rings, someone walks in, and
 * this is where that booking gets written down without leaving the screen — the
 * same `bookings` row the reception list reads, with `source: 'staff'`.
 */
export default function StaffCustomersScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const staffId = user.staffId ?? 'stf_imran';

  const summary = staffTodaySummary(staffId);
  const bookings = bookingsForStaff(staffId);
  const slots = availableSlots(staffId);
  const openSlots = slots.filter((slot) => slot.available).slice(0, 8);
  const regulars = recentCustomers(6);

  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [clock, setClock] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const canAdd = name.trim().length > 0 && !!serviceId && !!clock;

  function reset() {
    setName('');
    setServiceId(null);
    setClock(null);
    setAdded(false);
  }

  function openHistory(customerId: string) {
    router.push({ pathname: '/history', params: { customerId } });
  }

  return (
    <Screen
      eyebrow={formatDayLabel(mock.today)}
      title="Your customers"
      subtitle={`${staffName(staffId)} · ${summary.scheduled} in your book today`}
      gap={space.xl}
      edges={{ bottom: false }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <StatTile
          label="Done"
          value={`${summary.completed}`}
          hint={`${summary.servicesDone} services`}
          tone="success"
        />
        <StatTile label="Still to come" value={`${summary.scheduled - summary.completed}`} />
        <StatTile
          label="Your revenue"
          value={formatPaise(summary.revenuePaise, { paise: false })}
          hint="From settled bills only"
        />
        <StatTile
          label="Your commission"
          value={formatPaise(summary.commissionPaise, { paise: false })}
          tone="accent"
          hint="Today, so far"
        />
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Today in your chair"
          caption="Tap a name for everything they have ever had done."
        />
        {bookings.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nothing booked yet"
            body="When the desk books someone with you, or you add a walk-in below, it shows up here."
          />
        ) : (
          <Card padded={false}>
            <View style={{ paddingHorizontal: space.md }}>
              {bookings.map((booking, index) => (
                <ListRow
                  key={booking.id}
                  title={customerName(booking.customerId)}
                  subtitle={serviceNames(booking.services.map((line) => line.serviceId))}
                  meta={formatClock(booking.startTime)}
                  leading={<Avatar name={customerName(booking.customerId)} size={34} />}
                  trailing={
                    <Badge label={STATUS_LABEL[booking.status]} tone={statusTone(booking.status)} />
                  }
                  onPress={() => openHistory(booking.customerId)}
                  last={index === bookings.length - 1}
                />
              ))}
            </View>
          </Card>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Add a walk-in"
          caption="A call or someone at the door. It lands in the same book as everything else."
        />

        {added ? (
          <Card tone="success">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name="checkmark-circle" size={22} color="success" />
              <Text variant="bodyStrong">Added to your book</Text>
            </View>
            <Text variant="body" color="textSecondary">
              {name.trim()} · {serviceId ? serviceNames([serviceId]) : ''} ·{' '}
              {clock ? formatClock(clock) : ''}
            </Text>
            <Text variant="caption" color="textMuted">
              The desk sees it immediately for billing. The customer did not have to install
              anything.
            </Text>
            <Button label="Add another" variant="outline" onPress={reset} />
          </Card>
        ) : (
          <Card>
            <Field
              label="Name"
              placeholder="Who is it?"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
              autoCapitalize="words"
            />

            <View style={{ gap: space.xs }}>
              <Text variant="captionStrong" color="textSecondary">
                Service
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {mock.services.map((service) => (
                  <Chip
                    key={service.id}
                    label={service.name}
                    selected={serviceId === service.id}
                    onPress={() => setServiceId(service.id)}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: space.xs }}>
              <Text variant="captionStrong" color="textSecondary">
                Start time
              </Text>
              {openSlots.length === 0 ? (
                <Text variant="caption" color="textMuted">
                  Your day is full. The desk can still add someone to the queue.
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {openSlots.map((slot) => (
                    <Chip
                      key={slot.clock}
                      label={formatClock(slot.clock)}
                      selected={clock === slot.clock}
                      onPress={() => setClock(slot.clock)}
                    />
                  ))}
                </View>
              )}
            </View>

            <Button
              label={canAdd ? 'Add to my book' : 'Name, service and time first'}
              variant="primary"
              fullWidth
              disabled={!canAdd}
              onPress={() => setAdded(true)}
            />
          </Card>
        )}

        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
          <Icon name="information-circle-outline" size={18} color="textMuted" />
          <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
            You can only write rows against yourself. Your commission is calculated from the
            services on the bill, so it counts the moment the desk takes payment.
          </Text>
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Recent customers"
          caption="Last six people through the door, whoever served them."
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {regulars.map((row, index) => {
              const customer = getCustomer(row.customer.id);
              return (
                <ListRow
                  key={row.customer.id}
                  title={row.customer.name}
                  subtitle={`${row.visits} visit${row.visits === 1 ? '' : 's'}`}
                  meta={formatDayLabel(row.lastVisitISO)}
                  leading={<Avatar name={row.customer.name} size={34} />}
                  onPress={() => openHistory(row.customer.id)}
                  last={index === regulars.length - 1}
                />
              );
            })}
          </View>
        </Card>
        <Text variant="caption" color="textMuted">
          Your six-month history lives in the History tab.
        </Text>
      </View>
    </Screen>
  );
}
