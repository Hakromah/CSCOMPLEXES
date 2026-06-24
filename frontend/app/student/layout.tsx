import Sidebar from '@/components/layout/Sidebar';
import SessionGuard from '@/components/SessionGuard';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Tableau de bord', href: '/student' },
    { name: 'Mes classes', href: '/student/classes' },
    { name: 'Emploi Du Temps', href: '/student/timetable' },
    { name: 'Gestion des présences', href: '/student/attendance' },
    { name: 'Gestion des examens', href: '/student/exams' },
    { name: 'Gestion des résultats', href: '/student/results' },
    { name: 'Matériel pédagogique', href: '/student/materials' },
    { name: 'Relevés de notes', href: '/student/transcripts' },
    { name: 'Finance', href: '/student/finance' },
    { name: 'Transport', href: '/student/transport' },
    { name: 'Calendrier', href: '/student/calendar' },
    { name: 'Notifications', href: '/student/notifications' },
    { name: 'Paramètres', href: '/student/profile' },
  ];

  return (
    <SessionGuard>
      <div className="flex max-md:flex-col">
        <Sidebar menuItems={menuItems} />
        <main className="flex-1">{children}</main>
      </div>
    </SessionGuard>
  );
}
