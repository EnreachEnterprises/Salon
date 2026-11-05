import React from 'react';

import { RoleTabs } from '@/navigation/role-tabs';

/**
 * Reception surface: screens 4, 5 and 6. The desk lives on the day's bookings,
 * adds walk-ins, and takes payment — all within one tap or two of each other.
 */
export default function ReceptionLayout() {
  return (
    <RoleTabs
      allow={['reception']}
      screens={[
        { name: 'bookings', title: 'Bookings', icon: 'list-outline' },
        { name: 'walk-in', title: 'Walk-in', icon: 'add-circle-outline' },
        { name: 'billing', title: 'Billing', icon: 'receipt-outline' },
      ]}
    />
  );
}
