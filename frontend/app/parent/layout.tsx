import Sidebar from '@/components/layout/Sidebar';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { name: 'Tableau de bord', href: '/parent' },
    { name: 'Mes Enfants', href: '/parent/children' },
    { name: 'Aperçu Financier', href: '/parent/finance' },
    { name: 'Messages', href: '/parent/messages' },
    { name: 'Notifications', href: '/parent/notifications' },
    { name: 'Calendrier Scolaire', href: '/parent/calendar' },
    { name: 'Documents', href: '/parent/documents' },
    { name: 'Profil', href: '/parent/profile' },
  ];

  return (
    <div className="flex max-md:flex-col">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
