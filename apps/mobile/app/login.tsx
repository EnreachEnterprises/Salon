import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { mock } from '@/mock';
import {
  ROLE_BLURB,
  ROLE_HOME,
  ROLE_LABEL,
  ROLE_ORDER,
  demoUsers,
  useSession,
} from '@/session';
import { space, useTheme } from '@/theme';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Field,
  ListRow,
  Screen,
  SectionHeader,
  Text,
} from '@/ui';

/**
 * Screen 11 — Login.
 *
 * The real build sends an OTP to the phone number and reads the role from
 * `salon_members`. Until then the four rows below sign in as a demo person so
 * every screen can be walked end to end. They are labelled "Preview as" so no
 * one mistakes this for the shipping auth flow.
 */
export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { signInAs } = useSession();
  const [phone, setPhone] = useState('');
  const [otpHint, setOtpHint] = useState(false);

  function preview(role: (typeof ROLE_ORDER)[number]) {
    signInAs(role);
    router.replace(ROLE_HOME[role]);
  }

  return (
    <Screen scroll edges={{ top: true, bottom: true }}>
      <View style={{ gap: space.xs, paddingTop: space['3xl'] }}>
        <Text variant="label" color="accent">
          {mock.salon.name} · {mock.salon.branch}
        </Text>
        <Text variant="display">Salon</Text>
        <Text variant="body" color="textSecondary">
          Bookings, queue, billing and commission in one place.
        </Text>
      </View>

      <View style={{ gap: space.md }}>
        <Field
          label="Mobile number"
          placeholder="+91 98200 41120"
          keyboardType="phone-pad"
          autoComplete="tel"
          leftIcon="call-outline"
          value={phone}
          onChangeText={(next) => {
            setPhone(next);
            setOtpHint(false);
          }}
        />
        <Button
          label="Send OTP"
          variant="primary"
          fullWidth
          onPress={() => setOtpHint(true)}
        />
        {otpHint ? (
          <Text variant="caption" color="textMuted">
            Demo build — the OTP is wired with the backend. Use a preview row below.
          </Text>
        ) : null}
      </View>

      <Divider />

      <View style={{ gap: space.md }}>
        <SectionHeader
          title="Preview as"
          caption="Each role sees a different slice of the same day."
        />

        <Card padded={false}>
          <View style={{ paddingHorizontal: space.md }}>
            {ROLE_ORDER.map((role, index) => (
              <ListRow
                key={role}
                last={index === ROLE_ORDER.length - 1}
                title={ROLE_LABEL[role]}
                subtitle={ROLE_BLURB[role]}
                leading={
                  <Avatar
                    name={demoUsers[role].name}
                    tone={role === 'owner' ? 'accent' : 'neutral'}
                  />
                }
                onPress={() => preview(role)}
              />
            ))}
          </View>
        </Card>
      </View>

      <Text variant="caption" color="textMuted">
        Every reminder goes to email and WhatsApp — for customers and staff alike.
      </Text>

      <View
        style={{
          borderTopWidth: theme.borderWidth.hairline,
          borderTopColor: theme.colors.border,
          paddingTop: space.md,
        }}
      >
        <Text variant="caption" color="textMuted">
          {mock.salon.timezone} · open {mock.salon.openTime}–{mock.salon.closeTime}
        </Text>
      </View>
    </Screen>
  );
}
