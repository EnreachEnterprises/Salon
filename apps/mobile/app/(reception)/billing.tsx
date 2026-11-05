import React, { useState } from 'react';
import { View } from 'react-native';
import { formatClock, formatDayLabel } from '@salon/shared';

import {
  customerName,
  mock,
  PAYMENT_LABEL,
  serviceNames,
  staffName,
  STATUS_LABEL,
  statusTone,
  todayBookings,
  todaysInvoiceFor,
  type Booking,
  type PaymentMethod,
} from '@/mock';
import { space, useTheme } from '@/theme';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  ListRow,
  Money,
  Screen,
  SectionHeader,
  Segmented,
  Text,
} from '@/ui';

type Filter = 'to_bill' | 'paid';

interface Line {
  key: string;
  serviceName: string;
  staffId: string;
  amountPaise: number;
}

const TO_BILL: readonly Booking['status'][] = ['checked_in', 'in_service'];

function linesFor(booking: Booking): Line[] {
  return booking.services.map((line, index) => ({
    key: `${booking.id}_${line.serviceId}_${index}`,
    serviceName: serviceNames([line.serviceId]),
    staffId: booking.staffId,
    amountPaise: line.pricePaise,
  }));
}

/**
 * Screen 6 — Billing.
 *
 * Two lists: work that is done but unpaid, and bills already settled. Tapping a
 * row opens the composer in place — one screen, no navigation stack, because the
 * desk is doing this with a customer standing in front of it.
 *
 * GST is off by default. The GSTIN lives here because a salon that is registered
 * needs it on the bill, and a salon that is not should never see a tax line.
 */
export default function BillingScreen() {
  const theme = useTheme();
  const c = theme.colors;

  const [filter, setFilter] = useState<Filter>('to_bill');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [discountText, setDiscountText] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paidNow, setPaidNow] = useState<Set<string>>(new Set());
  const [receipt, setReceipt] = useState(false);

  const bookings = todayBookings();
  const toBill = bookings.filter((booking) => TO_BILL.includes(booking.status));
  const paid = bookings.filter((booking) => booking.status === 'completed');

  const selected = bookings.find((booking) => booking.id === selectedId);

  /* ---------------------------------------------------------------- *
   * Composer
   * ---------------------------------------------------------------- */

  if (selected) {
    const invoice = todaysInvoiceFor(selected);
    const settled = paidNow.has(selected.id) || !!invoice;

    const lines: Line[] = invoice
      ? invoice.items.map((item) => ({
          key: item.id,
          serviceName: item.serviceName,
          staffId: item.staffId,
          amountPaise: item.amountPaise,
        }))
      : linesFor(selected);

    const grossPaise = lines.reduce((sum, line) => sum + line.amountPaise, 0);
    const parsed = Number(discountText.replace(/[^0-9.]/g, ''));
    const discountPaise =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(grossPaise, Math.round(parsed * 100))
        : (invoice?.discountPaise ?? 0);
    const totalPaise = Math.max(0, grossPaise - discountPaise);
    const shownMethod = invoice?.method ?? method;

    if (receipt) {
      return (
        <Screen
          title="Payment taken"
          subtitle={`${customerName(selected.customerId)} is settled.`}
          edges={{ bottom: false }}
        >
          <Card tone="success">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Icon name="checkmark-circle" size={24} color="success" />
              <Text variant="bodyStrong">
                {PAYMENT_LABEL[shownMethod]} · {formatClock(selected.startTime)}
              </Text>
            </View>
            <Money paise={totalPaise} variant="title" />
            <Text variant="caption" color="textSecondary">
              The receipt goes to the customer on email and WhatsApp. The stylist&apos;s commission
              is already counted from this bill.
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button
              label="Next customer"
              variant="outline"
              onPress={() => {
                setReceipt(false);
                setSelectedId(null);
                setDiscountText('');
              }}
            />
            <Button
              label="See paid bills"
              variant="ghost"
              onPress={() => {
                setReceipt(false);
                setSelectedId(null);
                setDiscountText('');
                setFilter('paid');
              }}
            />
          </View>
        </Screen>
      );
    }

    return (
      <Screen
        back
        eyebrow={formatClock(selected.startTime)}
        title={customerName(selected.customerId)}
        subtitle={`${serviceNames(selected.services.map((line) => line.serviceId))} · ${staffName(
          selected.staffId,
        )}`}
        gap={space.lg}
        edges={{ bottom: false }}
        footer={
          settled ? (
            <Button
              label="Paid"
              variant="success"
              size="lg"
              fullWidth
              disabled
              icon="checkmark"
              onPress={() => {}}
            />
          ) : (
            <Button
              label={`Take payment · ₹${(totalPaise / 100).toFixed(0)}`}
              size="lg"
              fullWidth
              onPress={() => {
                setPaidNow((previous) => new Set(previous).add(selected.id));
                setReceipt(true);
              }}
            />
          )
        }
      >
        <View style={{ gap: space.sm }}>
          <SectionHeader title="On the bill" caption="Attribution stays on the line, not the bill." />
          <Card padded={false}>
            <View style={{ paddingHorizontal: space.md }}>
              {lines.map((line, index) => (
                <ListRow
                  key={line.key}
                  title={line.serviceName}
                  subtitle={staffName(line.staffId)}
                  trailing={<Money paise={line.amountPaise} variant="body" showPaise={false} />}
                  last={index === lines.length - 1}
                />
              ))}
            </View>
          </Card>
        </View>

        <Field
          label="Discount"
          placeholder="0"
          prefix="₹"
          value={settled ? String((invoice?.discountPaise ?? 0) / 100) : discountText}
          onChangeText={setDiscountText}
          editable={!settled}
          keyboardType="numeric"
          hint="Spread across the lines in proportion, so commission stays fair."
        />

        <Card>
          <View style={{ gap: space.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" color="textSecondary">
                Services
              </Text>
              <Text variant="body">{grossPaise === 0 ? '₹0' : `₹${(grossPaise / 100).toFixed(0)}`}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" color="textSecondary">
                Discount
              </Text>
              <Text variant="body">−₹{(discountPaise / 100).toFixed(0)}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: space.sm,
                borderTopWidth: theme.borderWidth.hairline,
                borderTopColor: c.border,
              }}
            >
              <Text variant="bodyStrong">Total</Text>
              <Money paise={totalPaise} variant="section" showPaise={false} />
            </View>
          </View>

          <View style={{ gap: space.xs }}>
            <Text variant="caption" color="textMuted">
              GST is off. Turn it on per salon in settings when the GSTIN is registered.
            </Text>
            <Text variant="caption" color="textMuted">
              GSTIN {mock.salon.gstin}
            </Text>
          </View>
        </Card>

        <View style={{ gap: space.sm }}>
          <SectionHeader title="How they paid" caption="Cash, UPI or card. One tap." />
          <Segmented<PaymentMethod>
            accessibilityLabel="Payment method"
            value={shownMethod}
            onChange={setMethod}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'upi', label: 'UPI' },
              { value: 'card', label: 'Card' },
            ]}
          />
          {settled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <Badge label="Settled" tone="success" dot />
              <Text variant="caption" color="textMuted">
                Bill {invoice?.id ?? 'recorded'}
              </Text>
            </View>
          ) : null}
        </View>
      </Screen>
    );
  }

  /* ---------------------------------------------------------------- *
   * List
   * ---------------------------------------------------------------- */

  const visible = filter === 'to_bill' ? toBill : paid;

  return (
    <Screen
      eyebrow={formatDayLabel(mock.today)}
      title="Billing"
      subtitle={`${toBill.length} waiting to be billed · ${paid.length} settled`}
      gap={space.lg}
      edges={{ bottom: false }}
    >
      <Segmented<Filter>
        accessibilityLabel="Which bills"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'to_bill', label: 'To bill' },
          { value: 'paid', label: 'Paid' },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={filter === 'to_bill' ? 'Nothing to bill' : 'No bills yet today'}
          body={
            filter === 'to_bill'
              ? 'Every finished service has been paid for. New ones appear here as the desk checks people in.'
              : 'Settled bills will be listed here with how the customer paid.'
          }
        />
      ) : (
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {visible.map((booking, index) => {
              const invoice = todaysInvoiceFor(booking);
              const amount = invoice?.paidPaise ?? booking.services.reduce((sum, line) => sum + line.pricePaise, 0);

              return (
                <ListRow
                  key={booking.id}
                  title={customerName(booking.customerId)}
                  subtitle={serviceNames(booking.services.map((line) => line.serviceId))}
                  meta={formatClock(booking.startTime)}
                  leading={<Avatar name={customerName(booking.customerId)} size={34} />}
                  trailing={
                    <View style={{ alignItems: 'flex-end', gap: space.xxs }}>
                      <Text variant="bodyStrong">₹{(amount / 100).toFixed(0)}</Text>
                      {invoice ? (
                        <Badge label={PAYMENT_LABEL[invoice.method]} tone="success" />
                      ) : (
                        <Badge label={STATUS_LABEL[booking.status]} tone={statusTone(booking.status)} />
                      )}
                    </View>
                  }
                  onPress={() => {
                    setSelectedId(booking.id);
                    setDiscountText('');
                    setReceipt(false);
                  }}
                  last={index === visible.length - 1}
                />
              );
            })}
          </View>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <Icon name="information-circle-outline" size={18} color="textMuted" />
        <Text variant="caption" color="textSecondary" style={{ flex: 1 }}>
          A bill is only counted as revenue when payment is captured. Until then it sits in To bill
          and never inflates the owner&apos;s numbers.
        </Text>
      </View>
    </Screen>
  );
}
