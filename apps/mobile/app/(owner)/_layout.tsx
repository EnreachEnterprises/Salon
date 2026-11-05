import React from 'react';

import { RoleTabs } from '@/navigation/role-tabs';

/**
 * Owner surface: screens 9 and 10. Earnings is the performance dashboard the
 * owner asked for; commission is the one number they pay out.
 */
export default function OwnerLayout() {
  return (
    <RoleTabs
      allow={['owner']}
      screens={[
        { name: 'earnings', title: 'Earnings', icon: 'cash-outline' },
        { name: 'commission', title: 'Commission', icon: 'pie-chart-outline' },
      ]}
    />
  );
}
