import React from 'react';

import { RoleTabs } from '@/navigation/role-tabs';

/**
 * Customer surface: screens 1, 2 and 3. Booking, the live queue and reminders
 * are the only things a customer ever needs, so they are the only tabs.
 */
export default function CustomerLayout() {
  return (
    <RoleTabs
      allow={['customer']}
      screens={[
        { name: 'book', title: 'Book', icon: 'calendar-outline' },
        { name: 'queue', title: 'Queue', icon: 'people-outline' },
        { name: 'reminders', title: 'Reminders', icon: 'notifications-outline' },
      ]}
    />
  );
}
