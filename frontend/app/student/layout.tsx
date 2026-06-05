import Sidebar from '@/components/layout/Sidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Dashboard', href: '/student' },
    { name: 'My Classes', href: '/student/classes' },
    { name: 'Timetable', href: '/student/timetable' },
    { name: 'Attendance', href: '/student/attendance' },
    { name: 'Exams', href: '/student/exams' },
    { name: 'Exam Results', href: '/student/results' },
    { name: 'Materials', href: '/student/materials' },
    { name: 'Transcripts', href: '/student/transcripts' },
    { name: 'Profile', href: '/student/profile' },
  ];

  return (
    <div className="flex max-md:flex-col">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
