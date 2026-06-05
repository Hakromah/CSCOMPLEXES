'use client';

import { useEffect, useState, startTransition } from 'react';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setHasMounted(true);
    });
  }, []);

  if (!hasMounted) return null;
  return <>{children}</>;
}

