import Sidebar from '@/components/layout/Sidebar';

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
    { name: 'Paramètres', href: '/student/profile' },
  ];

  return (
    <div className="flex max-md:flex-col">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
