import Sidebar from "@/components/layout/Sidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Tableau de bord', href: '/teacher' },
    { name: 'Gestion des classes', href: '/teacher/classes' },
    { name: 'Étudiants', href: '/teacher/students' },
    { name: 'Gestion des présences', href: '/teacher/attendance' },
    { name: 'Emploi du temps', href: '/teacher/timetable' },
    { name: 'Gestion des Examens', href: '/teacher/exams' },
    { name: 'Gestion des Résultats', href: '/teacher/results' }, // Added
    { name: 'Upload des Matériels', href: '/teacher/materials' },
    { name: 'Relevés de notes', href: '/teacher/transcripts' },
    //    { name: 'Messages', href: '/teacher/messages' },
    { name: 'Profil', href: '/teacher/profile' },
  ];

  return (
    <div className="flex max-md:flex-col">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
