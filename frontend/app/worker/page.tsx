'use client';

import PayrollPortal from '@/components/portals/PayrollPortal';
import { School } from 'lucide-react';

export default function WorkerDashboard() {
  return (
    <PayrollPortal
      role="WORKER"
      icon={School}
      portalName="Support Portal"
    />
  );
}
