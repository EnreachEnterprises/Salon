import React from 'react';

import { RoleTabs } from '@/navigation/role-tabs';

/**
 * Staff surface: screens 7 and 8. A stylist sees today's own customers and
 * their history — the same `history` route serves both, with an optional
 * `customerId` parameter.
 */
export default function StaffLayout() {
  return (
    <RoleTabs
      allow={['staff']}
      screens={[
        { name: 'customers', title: 'Customers', icon: 'person-circle-outline' },
        { name: 'history', title: 'History', icon: 'time-outline' },
      ]}
    />
  );
}
