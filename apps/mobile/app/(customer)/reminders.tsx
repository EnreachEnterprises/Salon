import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { formatClock, formatDayLabel } from '@salon/shared';

import { deliveryLabel, mock, REMINDER_KIND_LABEL, REMINDER_CHANNEL_LABEL } from '@/mock';
import { space, useTheme } from '@/theme';
import { Badge, Card, ListRow, Screen, SectionHeader, Text } from '@/ui';

function PrefRow({
  label,
  description,
  value,
  onChange,
  last,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <ListRow
      title={label}
      subtitle={description}
      last={last}
      trailing={
        <Switch
          value={value}
          onValueChange={onChange}
          accessibilityLabel={label}
          trackColor={{ false: c.borderStrong, true: c.accent }}
          thumbColor={c.surface}
          ios_backgroundColor={c.borderStrong}
        />
      }
    />
  );
}

/**
 * Screen 3 — Reminders.
 *
 * The blueprint's promise is that every role hears about a booking on both
 * channels. This screen is where a customer sees the same promise and can
 * change it, so a "we sent it" claim is always checkable.
 */
export default function RemindersScreen() {
  const prefs = mock.notificationPrefs;
  const [email, setEmail] = useState(prefs.email);
  const [whatsapp, setWhatsapp] = useState(prefs.whatsapp);
  const [marketing, setMarketing] = useState(prefs.marketingOptIn);

  return (
    <Screen
      title="Reminders"
      subtitle={`Currently sending to ${deliveryLabel(email, whatsapp).toLowerCase()}.`}
      edges={{ bottom: false }}
    >
      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Coming up"
          caption="Booking reminders are transactional. They are not marketing."
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {mock.reminders.map((reminder, index) => {
              const when =
                reminder.dueISO === mock.today
                  ? 'Today'
                  : formatDayLabel(reminder.dueISO);

              return (
                <ListRow
                  key={reminder.id}
                  title={`${REMINDER_KIND_LABEL[reminder.kind]} · ${when}${
                    reminder.dueClock ? `, ${formatClock(reminder.dueClock)}` : ''
                  }`}
                  subtitle={reminder.message}
                  meta={REMINDER_CHANNEL_LABEL[reminder.channel]}
                  trailing={
                    <Badge
                      label={reminder.status === 'sent' ? 'Sent' : 'Scheduled'}
                      tone={reminder.status === 'sent' ? 'success' : 'info'}
                      dot
                    />
                  }
                  last={index === mock.reminders.length - 1}
                />
              );
            })}
          </View>
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Where to send"
          caption="Both channels by default — one of them always reaches the customer."
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            <PrefRow
              label="Email"
              description={prefs.emailAddress}
              value={email}
              onChange={setEmail}
            />
            <PrefRow
              label="WhatsApp"
              description={prefs.whatsappNumber}
              value={whatsapp}
              onChange={setWhatsapp}
            />
            <PrefRow
              label="Offers and nudges"
              description="Revisit reminders and the weekly summary"
              value={marketing}
              onChange={setMarketing}
              last
            />
          </View>
        </Card>
      </View>

      {!email && !whatsapp ? (
        <Card tone="danger">
          <Text variant="bodyStrong">Both channels are off</Text>
          <Text variant="caption" color="textSecondary">
            You will not hear from us about a booking. The salon can still call you, but nothing
            arrives on its own.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text variant="caption" color="textSecondary">
            Booking, queue and receipt messages go to email and WhatsApp. Offers respect the
            opt-in above and are capped at one a week per customer.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
