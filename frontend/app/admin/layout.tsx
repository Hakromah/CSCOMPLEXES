import Sidebar from '@/components/layout/Sidebar';
import SessionGuard from '@/components/SessionGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Tableau de bord', href: '/admin' },
    { name: 'Gestion des utilisateurs', href: '/admin/users' },
    { name: 'Gestion des classes', href: '/admin/classes' },
    { name: 'Gestion des sujets', href: '/admin/subjects' },
    { name: 'Gestion des examens', href: '/admin/exams' },
    { name: 'Matériel pédagogique', href: '/admin/materials' },
    { name: 'Gestion des résultats', href: '/admin/results' },
    { name: 'Gestion des présences', href: '/admin/attendance' },
    { name: 'Affectation enseignants', href: '/admin/assign-teacher' },
    { name: 'Affectation étudiants', href: '/admin/assign-student' },
    { name: 'Emploi du temps', href: '/admin/timetable' },
    { name: 'Rapports', href: '/admin/reports' },
    { name: 'Relevés de notes', href: '/admin/transcripts' },
    { name: 'Paramètres', href: '/admin/settings' },
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
