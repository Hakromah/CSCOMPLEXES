'use client';

import PayrollPortal from '@/components/portals/PayrollPortal';
import { Bus } from 'lucide-react';

export default function DriverDashboard() {
  return (
    <PayrollPortal
      role="DRIVER"
      icon={Bus}
      portalName="Driver Portal"
    />
  );
}
