import SessionGuard from '@/components/SessionGuard';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionGuard>
      {children}
    </SessionGuard>
  );
}
