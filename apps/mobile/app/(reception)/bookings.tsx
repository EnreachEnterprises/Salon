import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { formatClock, formatDayLabel } from '@salon/shared';

import {
  CHANNEL_LABEL,
  customerName,
  mock,
  serviceNames,
  SOURCE_LABEL,
  sourceTone,
  STATUS_LABEL,
  statusTone,
  staffName,
  todayBookings,
  type Booking,
} from '@/mock';
import { space } from '@/theme';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  ListRow,
  Screen,
  SectionHeader,
  Segmented,
  Text,
} from '@/ui';

type Filter = 'all' | 'waiting' | 'done' | 'requests';

const WAITING: readonly Booking['status'][] = ['confirmed', 'checked_in', 'in_service'];

/**
 * Screen 4 — Aaj ki bookings.
 *
 * The desk's whole day on one list, plus the two WhatsApp/call requests that
 * still need a human. Confirming a request is deliberately one tap and local
 * until the API exists — a request never silently becomes a booking.
 */
export default function BookingsScreen() {
  const router = useRouter();

  const bookings = todayBookings();
  const requests = mock.bookingRequests;

  const [filter, setFilter] = useState<Filter>('all');
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const visible =
    filter === 'waiting'
      ? bookings.filter((booking) => WAITING.includes(booking.status))
      : filter === 'done'
        ? bookings.filter((booking) => booking.status === 'completed')
        : bookings;

  const waitingCount = bookings.filter((booking) => WAITING.includes(booking.status)).length;

  function confirm(id: string) {
    setConfirmed((previous) => new Set(previous).add(id));
  }

  return (
    <Screen
      eyebrow={formatDayLabel(mock.today)}
      title="Aaj ki bookings"
      subtitle={`${bookings.length} today · ${waitingCount} still to serve · ${requests.length} requests`}
      gap={space.lg}
      edges={{ bottom: false }}
      footer={
        <Button
          label="Add a walk-in"
          variant="outline"
          icon="add"
          fullWidth
          onPress={() => router.push('/walk-in')}
        />
      }
    >
      <Segmented<Filter>
        accessibilityLabel="Filter today's bookings"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'waiting', label: 'Waiting' },
          { value: 'done', label: 'Done' },
          { value: 'requests', label: 'Requests' },
        ]}
      />

      {filter === 'requests' ? (
        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Waiting on a human"
            caption="WhatsApp and call requests. Confirming one puts it in today's book."
          />
          {requests.length === 0 ? (
            <EmptyState
              icon="checkmark-done-outline"
              title="No open requests"
              body="Every WhatsApp and phone request has been answered."
            />
          ) : (
            requests.map((request) => {
              const isConfirmed = confirmed.has(request.id);
              return (
                <Card key={request.id} tone={isConfirmed ? 'success' : 'default'}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
                    <Avatar name={request.customerName} />
                    <View style={{ flex: 1, gap: space.xxs }}>
                      <Text variant="bodyStrong">{request.customerName}</Text>
                      <Text variant="caption" color="textMuted">
                        {serviceNames(request.serviceIds)} · wants {formatClock(request.preferredClock)}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {request.phone} · asked {formatClock(request.requestedAtClock)}
                      </Text>
                    </View>
                    <Badge
                      label={CHANNEL_LABEL[request.channel]}
                      tone={request.channel === 'whatsapp' ? 'success' : 'warning'}
                      dot
                    />
                  </View>

                  {request.note ? (
                    <Text variant="caption" color="textSecondary">
                      “{request.note}”
                    </Text>
                  ) : null}

                  {isConfirmed ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                      <Icon name="checkmark-circle" size={18} color="success" />
                      <Text variant="caption" color="success">
                        Confirmed — added to {formatClock(request.preferredClock)}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', gap: space.sm }}>
                      <Button label="Confirm" icon="checkmark" onPress={() => confirm(request.id)} />
                      <Button label="Call back" variant="ghost" icon="call-outline" onPress={() => {}} />
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </View>
      ) : (
        <View style={{ gap: space.sm }}>
          <SectionHeader
            title={filter === 'done' ? 'Served today' : filter === 'waiting' ? 'Still to serve' : "Today's book"}
            caption="Sorted by start time. Tap the desk to move a status."
          />
          {visible.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nothing here yet"
              body="Bookings appear the moment reception confirms a request or a customer checks in."
            />
          ) : (
            <Card padded={false}>
              <View style={{ paddingHorizontal: space.md }}>
                {visible.map((booking, index) => (
                  <ListRow
                    key={booking.id}
                    title={customerName(booking.customerId)}
                    subtitle={`${serviceNames(booking.services.map((line) => line.serviceId))} · ${staffName(
                      booking.staffId,
                    )}`}
                    meta={formatClock(booking.startTime)}
                    leading={<Avatar name={customerName(booking.customerId)} size={34} />}
                    trailing={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                        <Badge
                          label={STATUS_LABEL[booking.status]}
                          tone={statusTone(booking.status)}
                          dot
                        />
                        <Badge label={SOURCE_LABEL[booking.source]} tone={sourceTone(booking.source)} />
                      </View>
                    }
                    last={index === visible.length - 1}
                  />
                ))}
              </View>
            </Card>
          )}
        </View>
      )}

      <Card>
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
          <Icon name="information-circle-outline" size={18} color="textMuted" />
          <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
            WhatsApp requests arrive pre-filled from the booking flow. Someone always has to tap
            Confirm — the bot never books a chair on its own.
          </Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Chip label={`${waitingCount} waiting`} icon="time-outline" />
        <View style={{ flex: 1 }} />
        <Chip
          label="Open billing"
          icon="receipt-outline"
          onPress={() => router.push('/billing')}
        />
      </View>
    </Screen>
  );
}
