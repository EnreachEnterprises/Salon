import React from 'react';
import { Redirect } from 'expo-router';

import { ROLE_HOME, useSession } from '@/session';

/**
 * The gateway. There is one entry route and the session decides where it lands:
 * login when nobody is signed in, otherwise that role's home tab. Screens never
 * link to `/` as a destination — they go to the role home they want.
 */
export default function RoleGateway() {
  const { user } = useSession();

  if (!user) return <Redirect href="/login" />;
  return <Redirect href={ROLE_HOME[user.role]} />;
}
