'use client';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import SessionTimeoutModal from '@/components/SessionTimeoutModal';

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { showWarning, countdown, stayLoggedIn, doLogout } = useSessionTimeout();
  return (
    <>
      {children}
      <SessionTimeoutModal
        show={showWarning}
        countdown={countdown}
        onStayLoggedIn={stayLoggedIn}
        onLogoutNow={doLogout}
      />
    </>
  );
}
