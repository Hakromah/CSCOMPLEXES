import Sidebar from '@/components/layout/Sidebar';
import SessionGuard from '@/components/SessionGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Users Management', href: '/admin/users' },
    { name: 'Class Management', href: '/admin/classes' },
    { name: 'Subject Management', href: '/admin/subjects' },
    { name: 'Exam Management', href: '/admin/exams' },
    { name: 'Materials Management', href: '/admin/materials' },
    { name: 'Results Management', href: '/admin/results' },
    { name: 'Attendance', href: '/admin/attendance' },
    { name: 'Teacher Assignment', href: '/admin/assign-teacher' },
    { name: 'Student Assignment', href: '/admin/assign-student' },
    { name: 'Timetable', href: '/admin/timetable' },
    { name: 'Reports', href: '/admin/reports' },
    { name: 'Transcripts', href: '/admin/transcripts' },
    { name: 'Settings', href: '/admin/settings' },
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
