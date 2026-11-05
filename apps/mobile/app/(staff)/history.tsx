import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { formatDayLabel, formatPaise } from '@salon/shared';

import { BarChart } from '@/components/bar-chart';
import { customerHistory, staffMonthlySeries, staffName } from '@/mock';
import { useSessionUser } from '@/session';
import { space } from '@/theme';
import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  ListRow,
  Money,
  ProgressBar,
  Screen,
  SectionHeader,
  StatTile,
  Text,
} from '@/ui';

/**
 * Screen 8 — Customer history (stylist).
 *
 * Two jobs, one screen. Arrived from a name on the list: that customer's whole
 * history with the salon, so the stylist knows what happened last time. Arrived
 * from the tab bar: the stylist's own six months, which is the number they are
 * paid on.
 *
 * The empties are different and both matter — a customer who has never visited
 * is not the same as a stylist who is new.
 */
export default function StaffHistoryScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const user = useSessionUser();
  const staffId = user.staffId ?? 'stf_imran';

  if (customerId) {
    const history = customerHistory(customerId);

    if (!history) {
      return (
        <Screen
          title="Customer not found"
          back
          edges={{ bottom: false }}
        >
          <EmptyState
            icon="person-outline"
            title="No such customer"
            body="They may have been removed, or the link is out of date."
            actionLabel="Back to today"
            onAction={() => router.replace('/customers')}
          />
        </Screen>
      );
    }

    const { customer, visits, byService } = history;
    const busiest = Math.max(...byService.map((row) => row.count), 1);

    return (
      <Screen
        eyebrow="Customer history"
        title={customer.name}
        subtitle={`${customer.phone} · ${history.totalVisits} visit${
          history.totalVisits === 1 ? '' : 's'
        }`}
        headerRight={
          <Button label="Mine" variant="ghost" onPress={() => router.replace('/history')} />
        }
        gap={space.xl}
        edges={{ bottom: false }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <StatTile label="Visits" value={`${history.totalVisits}`} />
          <StatTile
            label="Spent"
            value={formatPaise(history.totalSpentPaise, { paise: false })}
            tone="accent"
          />
          <StatTile
            label="Average bill"
            value={formatPaise(history.averageTicketPaise, { paise: false })}
          />
          <StatTile
            label="Last visit"
            value={history.lastVisitISO ? formatDayLabel(history.lastVisitISO) : '—'}
          />
        </View>

        {customer.notes ? (
          <Card tone="accent">
            <Text variant="captionStrong" color="textSecondary">
              Note
            </Text>
            <Text variant="body">{customer.notes}</Text>
          </Card>
        ) : null}

        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="What they usually get"
            caption="Every service this customer has ever paid for."
          />
          {byService.length === 0 ? (
            <EmptyState
              icon="sparkles-outline"
              title="No services yet"
              body="Their first visit has not been billed."
            />
          ) : (
            <Card>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <View style={{ flex: 1, gap: space.xxs }}>
                  <Text variant="caption" color="textMuted">
                    Favourite stylist
                  </Text>
                  <Text variant="bodyStrong">{history.favouriteStaff ?? '—'}</Text>
                </View>
                <View style={{ flex: 1, gap: space.xxs }}>
                  <Text variant="caption" color="textMuted">
                    Favourite service
                  </Text>
                  <Text variant="bodyStrong">{history.favouriteService ?? '—'}</Text>
                </View>
              </View>

              <Divider />

              <View style={{ gap: space.md }}>
                {byService.map((row) => (
                  <View key={row.name} style={{ gap: space.xxs }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <Text variant="body">{row.name}</Text>
                      <Text variant="caption" color="textSecondary">
                        {row.count}×
                      </Text>
                    </View>
                    <ProgressBar
                      value={row.count / busiest}
                      accessibilityLabel={`${row.name}: ${row.count} visits`}
                    />
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>

        <View style={{ gap: space.sm }}>
          <SectionHeader
            title="Every visit"
            caption="Newest first, with who did the work."
          />
          {visits.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No bills yet"
              body="Bills appear here the moment the desk takes payment."
            />
          ) : (
            <Card padded={false}>
              <View style={{ paddingHorizontal: space.md }}>
                {visits.map((visit, index) => (
                  <ListRow
                    key={visit.invoice.id}
                    title={visit.services}
                    subtitle={visit.staffName}
                    meta={formatDayLabel(visit.invoice.businessDate)}
                    leading={<Avatar name={customer.name} size={34} />}
                    trailing={<Money paise={visit.amountPaise} variant="bodyStrong" />}
                    last={index === visits.length - 1}
                  />
                ))}
              </View>
            </Card>
          )}
        </View>

        <Text variant="caption" color="textMuted">
          {history.totalVisits} visits across {byService.length} different service
          {byService.length === 1 ? '' : 's'}. Counted from their bills, not from notes.
        </Text>
      </Screen>
    );
  }

  const series = staffMonthlySeries(staffId, 6);
  const servicesTotal = series.reduce((sum, month) => sum + month.services, 0);
  const customersTotal = series.reduce((sum, month) => sum + month.customers, 0);
  const revenueTotal = series.reduce((sum, month) => sum + month.revenuePaise, 0);
  const commissionTotal = series.reduce((sum, month) => sum + month.commissionPaise, 0);

  return (
    <Screen
      eyebrow={staffName(staffId)}
      title="Your six months"
      subtitle="Services, revenue and commission, month by month."
      gap={space.xl}
      edges={{ bottom: false }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <StatTile label="Services" value={`${servicesTotal}`} hint="Last six months" />
        <StatTile label="Customers" value={`${customersTotal}`} />
        <StatTile
          label="Revenue"
          value={formatPaise(revenueTotal, { paise: false })}
          tone="accent"
          hint="Before commission"
        />
        <StatTile
          label="Commission"
          value={formatPaise(commissionTotal, { paise: false })}
          hint="Your share"
        />
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Services per month"
          caption="Taller bars are busier months, not better ones — prices differ."
        />
        <Card>
          <BarChart
            data={series.map((month) => ({
              key: month.monthKey,
              label: month.label,
              value: month.services,
              accessibilityLabel: `${month.label}: ${month.services} services, ${formatPaise(
                month.revenuePaise,
                { paise: false },
              )}`,
            }))}
            height={132}
            showEvery={1}
            formatValue={(value) => `${value} services`}
            emptyLabel="No services recorded yet"
          />
        </Card>
      </View>

      <View style={{ gap: space.sm }}>
        <SectionHeader
          title="Month by month"
          caption="The same six months, with the money in them."
        />
        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {series.map((month, index) => (
              <ListRow
                key={month.monthKey}
                title={month.label}
                subtitle={`${month.services} services · ${month.customers} customers`}
                trailing={<Money paise={month.revenuePaise} variant="bodyStrong" />}
                meta={formatPaise(month.commissionPaise, { paise: false })}
                last={index === series.length - 1}
              />
            ))}
          </View>
        </Card>
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
        <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
          Commission is calculated per service line after any discount, so a heavily
          discounted bill pays you less. The owner's report and this screen read the same
          rows.
        </Text>
      </View>

      <Text variant="caption" color="textMuted">
        Every row here comes from your own invoice lines, so this is the same number the
        owner sees on your commission.
      </Text>
    </Screen>
  );
}
