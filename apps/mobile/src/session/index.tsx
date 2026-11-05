import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Redirect, type Href } from 'expo-router';

/**
 * Roles are the four people who touch the app. The role decides which tab group
 * a user lands in and which of the eleven screens they can reach — nothing else.
 *
 * This is deliberately an in-memory mock for the UI block. At B1 Clerk issues the
 * session and the API returns the authoritative role from `salon_members`; the
 * provider below keeps the same shape so screens do not change.
 */
export type Role = 'customer' | 'reception' | 'staff' | 'owner';

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  phone: string;
  email: string;
  /** Staff rows only: which `staff` record this person is. Own-rows scoping key. */
  staffId?: string;
  /** Customer rows only: which `customers` record this person is. */
  customerId?: string;
}

export const ROLE_HOME: Record<Role, Href> = {
  customer: '/book',
  reception: '/bookings',
  staff: '/customers',
  owner: '/earnings',
};

export const ROLE_LABEL: Record<Role, string> = {
  customer: 'Customer',
  reception: 'Reception',
  staff: 'Stylist',
  owner: 'Owner',
};

export const ROLE_BLURB: Record<Role, string> = {
  customer: 'Book a slot, watch the queue, get reminders.',
  reception: 'Today’s bookings, walk-ins and billing.',
  staff: 'Your customers, your history, your numbers.',
  owner: 'Revenue, services and commission.',
};

export const demoUsers: Record<Role, SessionUser> = {
  customer: {
    id: 'usr_ananya',
    name: 'Ananya Sharma',
    role: 'customer',
    phone: '+91 98200 41120',
    email: 'ananya.s@example.com',
    customerId: 'cus_ananya',
  },
  reception: {
    id: 'usr_neha',
    name: 'Neha Kulkarni',
    role: 'reception',
    phone: '+91 98200 41121',
    email: 'neha@salon.example',
  },
  staff: {
    id: 'usr_imran',
    name: 'Imran Sheikh',
    role: 'staff',
    phone: '+91 98200 41122',
    email: 'imran@salon.example',
    staffId: 'stf_imran',
  },
  owner: {
    id: 'usr_rohit',
    name: 'Rohit Mehra',
    role: 'owner',
    phone: '+91 98200 41123',
    email: 'rohit@salon.example',
  },
};

export const ROLE_ORDER: readonly Role[] = ['customer', 'reception', 'staff', 'owner'];

interface SessionContextValue {
  user: SessionUser | null;
  signInAs: (role: Role) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const signInAs = useCallback((role: Role) => setUser(demoUsers[role]), []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({ user, signInAs, signOut }),
    [user, signInAs, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside <SessionProvider>');
  return context;
}

/** The signed-in user, for screens that only render once a role is known. */
export function useSessionUser(): SessionUser {
  const { user } = useSession();
  if (!user) throw new Error('useSessionUser used outside a <RoleGate>');
  return user;
}

/**
 * Guards a route group. No session goes to login; the wrong role goes to its own
 * home rather than seeing a flash of a screen it cannot use.
 */
export function RoleGate({
  allow,
  children,
}: {
  allow: readonly Role[];
  children: React.ReactNode;
}) {
  const { user } = useSession();

  if (!user) return <Redirect href="/login" />;
  if (!allow.includes(user.role)) return <Redirect href={ROLE_HOME[user.role]} />;

  return <>{children}</>;
}
