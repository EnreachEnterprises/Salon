import React, { useState } from 'react';
import { View } from 'react-native';
import { formatPaise, monthRange } from '@salon/shared';

import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  ProgressBar,
  Screen,
  SectionHeader,
  StatTile,
  Text,
} from '@/ui';
import { mock, monthToDateTotals, staffPerformance } from '@/mock';
import { space } from '@/theme';

/** 800 bps reads as "8.0%", which is what the owner says out loud. */
function rateLabel(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

/**
 * Screen 10 — Staff commission (owner).
 *
 * The owner is not auditing the stylists here; they are preparing a payout.
 * So each person's card is a payable amount first and a percentage second,
 * and "Mark paid" is local until the API exists. Nothing on this screen is
 * editable except that toggle — a commission rate is a contract, not a field.
 */
export default function OwnerCommissionScreen() {
  const [paidIds, setPaidIds] = useState<readonly string[]>([]);

  const month = monthRange(mock.today);
  const rows = staffPerformance(month.from, mock.today);
  const mtd = monthToDateTotals();

  const totalCommission = rows.reduce((sum, row) => sum + row.commissionPaise, 0);
  const totalBase = rows.reduce((sum, row) => sum + row.revenuePaise, 0);
  const sharePct =
    mtd.revenuePaise > 0
      ? Math.round((mtd.commissionPaise / mtd.revenuePaise) * 1000) / 10
      : 0;
  const paidCount = rows.filter((row) => paidIds.includes(row.staff.id)).length;

  const togglePaid = (staffId: string): void => {
    setPaidIds((current) =>
      current.includes(staffId)
        ? current.filter((id) => id !== staffId)
        : [...current, staffId],
    );
  };

  return (
    <Screen
      eyebrow="Staff commission"
      title="Payouts"
      subtitle="What you owe each person this month, and what it is made of."
      gap={space.xl}
      edges={{ bottom: false }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <StatTile
          label="Commission owed"
          value={formatPaise(totalCommission, { paise: false })}
          hint="This month"
          tone="accent"
        />
        <StatTile
          label="Revenue base"
          value={formatPaise(totalBase, { paise: false })}
          hint="After discounts"
        />
        <StatTile
          label="Of salon revenue"
          value={`${sharePct}%`}
          hint={`${mtd.services} services`}
        />
        <StatTile
          label="Marked paid"
          value={`${paidCount} of ${rows.length}`}
          hint={paidCount === rows.length ? 'All settled' : 'Still to pay out'}
        />
      </View>

      <View style={{ gap: space.md }}>
        <SectionHeader
          title="Each person"
          caption="Rate is on the contract. The amount is on this month's bills."
        />

        {rows.map((row) => {
          const isPaid = paidIds.includes(row.staff.id);
          const share = totalCommission > 0 ? row.commissionPaise / totalCommission : 0;

          return (
            <Card key={row.staff.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Avatar name={row.staff.name} size={44} />
                <View style={{ flex: 1, gap: space.xxs }}>
                  <Text variant="bodyStrong">{row.staff.name}</Text>
                  <Text variant="caption" color="textSecondary">
                    {row.staff.title} · {row.services} services · {row.customers} customers
                  </Text>
                </View>
                <Badge label={`${rateLabel(row.staff.commissionBps)} rate`} tone="neutral" />
              </View>

              <Divider />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <View style={{ gap: space.xxs }}>
                  <Text variant="caption" color="textMuted">
                    To pay
                  </Text>
                  <Text variant="metric">{formatPaise(row.commissionPaise, { paise: false })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: space.xxs }}>
                  <Text variant="caption" color="textMuted">
                    On revenue of
                  </Text>
                  <Text variant="bodyStrong">
                    {formatPaise(row.revenuePaise, { paise: false })}
                  </Text>
                </View>
              </View>

              <View style={{ gap: space.xs }}>
                <ProgressBar
                  value={share}
                  tone={isPaid ? 'success' : 'accent'}
                  accessibilityLabel={`${row.staff.name}: ${Math.round(share * 100)}% of commission`}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="caption" color="textMuted">
                    {Math.round(share * 100)}% of the month's payouts
                  </Text>
                  <Badge
                    label={isPaid ? 'Paid' : 'Pending'}
                    tone={isPaid ? 'success' : 'warning'}
                    dot
                  />
                </View>
              </View>

              <Button
                label={isPaid ? 'Mark pending' : 'Mark paid'}
                variant={isPaid ? 'ghost' : 'outline'}
                onPress={() => togglePaid(row.staff.id)}
                accessibilityHint={`Toggles payout status for ${row.staff.name}`}
              />
            </Card>
          );
        })}
      </View>

      <Card tone="accent">
        <Text variant="captionStrong" color="textSecondary">
          How this number is built
        </Text>
        <Text variant="body">
          Commission is calculated per service line, after any discount is split across the
          lines pro rata. A stylist who worked a discounted bill earns on the discounted
          amount, and the same rows feed the stylist's own six-month screen.
        </Text>
        <Text variant="caption" color="textMuted">
          Marking paid is local for now. When the backend lands it writes a payout record and
          sends the person a WhatsApp message with the amount.
        </Text>
      </Card>

      <View style={{ gap: space.xs }}>
        <Divider />
        <Text variant="caption" color="textMuted">
          Rates are set on the contract, not here. If a rate is wrong, it is fixed in the
          staff record and the month is recalculated from the same bills.
        </Text>
      </View>
    </Screen>
  );
}
