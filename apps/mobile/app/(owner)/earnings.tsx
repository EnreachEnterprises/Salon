import React, { useState } from 'react';
import { View } from 'react-native';
import { formatPaise, formatPaiseCompact, monthRange } from '@salon/shared';

import { BarChart } from '@/components/bar-chart';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  ListRow,
  Money,
  ProgressBar,
  Screen,
  SectionHeader,
  Segmented,
  StatTile,
  Text,
} from '@/ui';
import {
  mock,
  monthToDateTotals,
  revenueSeries,
  salonMonthlySeries,
  serviceMix,
  staffPerformance,
} from '@/mock';
import { space } from '@/theme';

type Range = '7' | '30' | '90';

const RANGE_DAYS: Record<Range, number> = { '7': 7, '30': 30, '90': 90 };

/** "3 Nov" — the axis label, not the row label. Rows use `formatDayLabel`. */
function shortDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Screen 9 — Daily earnings (owner).
 *
 * The owner's question is never "what happened today". It is "is this month
 * better than last month, and which of my chairs is carrying it". So the two
 * charts are per day and per person, and the month table is the part that gets
 * exported and mailed to them on the first.
 */
export default function OwnerEarningsScreen() {
  const [range, setRange] = useState<Range>('30');

  const days = revenueSeries(RANGE_DAYS[range]);
  const rangeRevenue = days.reduce((sum, day) => sum + day.revenuePaise, 0);
  const rangeServices = days.reduce((sum, day) => sum + day.services, 0);

  const month = monthRange(mock.today);
  const mtd = monthToDateTotals();
  const staffRows = staffPerformance(month.from, mock.today);
  const monthlySeries = salonMonthlySeries(6);
  const mix = serviceMix(month.from, mock.today).slice(0, 5);
  const busiestMix = Math.max(...mix.map((row) => row.count), 1);

  return (
    <Screen
      eyebrow={mock.salon.name}
      title="Roz ki kamai"
      subtitle="Revenue, services and the people who delivered them."
      headerRight={
        <Button
          label="Export"
          variant="ghost"
          icon="download-outline"
          onPress={() => undefined}
        />
      }
      gap={space.xl}
      edges={{ bottom: false }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <StatTile
          label={`Last ${RANGE_DAYS[range]} days`}
          value={formatPaise(rangeRevenue, { paise: false })}
          hint={`${rangeServices} services`}
          tone="accent"
        />
        <StatTile
          label="Month to date"
          value={formatPaise(mtd.revenuePaise, { paise: false })}
          hint={`${mtd.services} services · ${mtd.customers} bills`}
        />
        <StatTile
          label="Commission owed"
          value={formatPaise(mtd.commissionPaise, { paise: false })}
          hint="This month, before payouts"
        />
        <StatTile
          label="Average bill"
          value={formatPaise(
            mtd.customers > 0 ? Math.round(mtd.revenuePaise / mtd.customers) : 0,
            { paise: false },
          )}
          hint="Month to date"
        />
      </View>

      <View style={{ gap: space.md }}>
        <Segmented<Range>
          value={range}
          onChange={setRange}
          accessibilityLabel="Chart range"
          options={[
            { value: '7', label: '7 days' },
            { value: '30', label: '30 days' },
            { value: '90', label: '90 days' },
          ]}
        />

        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Revenue per day"
            caption="Settled bills only. A refund pulls the bar down on the day it was paid out."
          />
          <Card>
            <BarChart
              data={days.map((day) => ({
                key: day.dateISO,
                label: shortDay(day.dateISO),
                value: day.revenuePaise,
                accessibilityLabel: `${shortDay(day.dateISO)}: ${formatPaise(
                  day.revenuePaise,
                  { paise: false },
                )}`,
              }))}
              height={148}
              formatValue={(value) => formatPaiseCompact(value)}
            />
          </Card>
        </View>

        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Services per day"
            caption="One bill with three services counts three times. That is what the stylist is paid on."
          />
          <Card>
            <BarChart
              data={days.map((day) => ({
                key: day.dateISO,
                label: shortDay(day.dateISO),
                value: day.services,
                accessibilityLabel: `${shortDay(day.dateISO)}: ${day.services} services`,
              }))}
              height={112}
              tone="secondary"
              formatValue={(value) => `${value}`}
            />
          </Card>
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="This month, by stylist"
          caption="Services they delivered, and the money those services brought in."
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {staffRows.map((row, index) => (
              <ListRow
                key={row.staff.id}
                title={row.staff.name}
                subtitle={`${row.staff.title} · ${row.services} services · ${row.customers} customers`}
                leading={<Avatar name={row.staff.name} size={36} />}
                trailing={<Money paise={row.revenuePaise} variant="bodyStrong" />}
                meta={`${row.sharePct}%`}
                last={index === staffRows.length - 1}
              />
            ))}
          </View>
        </Card>
        <Text variant="caption" color="textMuted">
          Share is of this month's salon revenue, after discount allocation.
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Top services this month"
          caption="What people are actually paying for."
        />
        <Card>
          {mix.length === 0 ? (
            <Text variant="body" color="textMuted">
              Nothing billed yet this month.
            </Text>
          ) : (
            <View style={{ gap: space.md }}>
              {mix.map((row) => (
                <View key={row.serviceId} style={{ gap: space.xxs }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: space.sm,
                    }}
                  >
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text variant="caption" color="textSecondary">
                      {row.count}× · {formatPaise(row.revenuePaise, { paise: false })}
                    </Text>
                  </View>
                  <ProgressBar
                    value={row.count / busiestMix}
                    tone="neutral"
                    accessibilityLabel={`${row.name}: ${row.count} services`}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Six-month report"
          caption="The table the monthly PDF is built from."
          actionLabel="Email me"
          onAction={() => undefined}
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {monthlySeries.map((entry, index) => (
              <ListRow
                key={entry.monthKey}
                title={entry.label}
                subtitle={`${entry.services} services · ${entry.customers} customers`}
                trailing={<Money paise={entry.revenuePaise} variant="bodyStrong" />}
                meta={formatPaise(entry.commissionPaise, { paise: false })}
                last={index === monthlySeries.length - 1}
              />
            ))}
          </View>
        </Card>

        <Card tone="accent">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Badge label="Automated" tone="accent" dot />
            <Text variant="caption" color="textSecondary">
              On the 1st, at 09:00 IST
            </Text>
          </View>
          <Text variant="body">
            The monthly report and the commission sheet go out as a PDF, and a one-line
            summary arrives on WhatsApp.
          </Text>
          <Text variant="caption" color="textMuted">
            Export and email arrive with the backend — this button is the shape of it, not
            the function.
          </Text>
        </Card>
      </View>

      <View style={{ gap: space.xs }}>
        <Divider />
        <Text variant="caption" color="textMuted">
          Revenue is money captured, not money billed. Discounts are removed before anything
          is called revenue, which is why the totals here are lower than the bill list.
        </Text>
      </View>
    </Screen>
  );
}
