/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
   Menu, School, LogOut, LayoutDashboard, GraduationCap, Calendar,
   Users, Settings, UserCircle, Activity, Bell,
   AlertCircle, MessageSquare, FileUp, UserCheck, BookOpen,
   Clock, UserPlus, BookOpenText, BarChart4, UsersRound, Landmark,
   FileText,
   Receipt,
   BadgeDollarSign,
   Calculator,
   type LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ClientOnly from './ClientOnly';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
interface MenuItem {
   name: string;
   href: string;
   icon?: LucideIcon;
}

interface SidebarProps {
   menuItems: MenuItem[];
}

// --- ICON MAPPING LOGIC ---
const getIcon = (name: string) => {
   const n = name.toLowerCase();
   if (n.includes('dashboard')) return <LayoutDashboard className="w-4 h-4" />;
   if (n.includes('result') || n.includes('grade')) return <GraduationCap className="w-4 h-4" />;
   if (n.includes('exam') || n.includes('schedule')) return <Calendar className="w-4 h-4" />;
   if (n.includes('timetable')) return <Clock className="w-4 h-4" />;
   if (n.includes('users management')) return <UsersRound className="w-4 h-4" />;
   if (n.includes('subject management')) return <BookOpen className="w-4 h-4" />;
   if (n.includes('teacher assignment')) return <UserPlus className="w-4 h-4" />;
   if (n.includes('class management')) return <Landmark className="w-4 h-4" />;
   if (n.includes('student assignment')) return <BookOpenText className="w-4 h-4" />;
   if (n.includes('report')) return <BarChart4 className="w-4 h-4" />;
   if (n.includes('message')) return <MessageSquare className="w-4 h-4" />;
   if (n.includes('material') || n.includes('upload')) return <FileUp className="w-4 h-4" />;
   if (n.includes('attendance')) return <UserCheck className="w-4 h-4" />;
   if (n.includes('student') || n.includes('class')) return <Users className="w-4 h-4" />;
   if (n.includes('transcripts')) return <FileText className="w-4 h-4" />;
   if (n.includes('staff')) return <UsersRound className="w-4 h-4" />;
   if (n.includes('utility')) return <Landmark className="w-4 h-4" />;
   return <Settings className="w-4 h-4" />;
};

export default function Sidebar({ menuItems }: SidebarProps) {
   const pathname = usePathname();
   const [userData, setUserData] = useState<{ name: string; role: string } | null>(null);
   const [draftCount, setDraftCount] = useState(0);
   const [isOnline, setIsOnline] = useState(false);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

   // Close the mobile menu automatically when the pathname changes (user clicks a link)
   useEffect(() => {
      setIsMobileMenuOpen(false);
   }, [pathname]);

   useEffect(() => {
      const fetchSidebarData = async () => {
         try {
            const userRes = await api.get('/auth/me');
            // Standardize the role string (remove ROLE_ prefix if present)
            const cleanRole = userRes.data.role.replace('ROLE_', '');

            setUserData({
               name: userRes.data.name,
               role: cleanRole
            });
            setIsOnline(true);

            // Conditional fetch for teachers
            if (cleanRole === 'TEACHER') {
               const resultsRes = await api.get('/teacher/results/filter').catch(() => ({ data: [] }));
               const drafts = resultsRes.data.filter((r: any) => r.status === 'DRAFT').length;
               setDraftCount(drafts);
            }
         } catch (e) {
            console.error("Erreur de synchronisation d'authentification:", e);
            setIsOnline(false);
         }
      };
      fetchSidebarData();
   }, []);

   const handleLogout = async () => {
      const tid = toast.loading('Fin de session...');
      try {
         await api.post('/auth/logout', {});

         // Manually clear the First-Party NextJS cookies since the Strapi network headers can't touch them natively
         Cookies.remove('accessToken', { path: '/' });
         Cookies.remove('userRole', { path: '/' });

         toast.success('Fin de session réussie', { id: tid });
         window.location.href = '/login';
      } catch (error) {
         toast.error('Fin de session échouée', { id: tid });
         console.log(error)
      }
   };

   /*    const finalMenuItems = userData?.role === 'ACCOUNTANT' ? [
         { name: 'Tablea de bord financier', href: '/admin/finance', icon: LayoutDashboard },
         { name: 'Finance des étudiants', href: '/admin/finance/students', icon: Receipt },
         { name: 'Finance du personnel', href: '/admin/finance/staff', icon: BadgeDollarSign },
         { name: 'Rapports', href: '/admin/finance/reports', icon: BarChart4 }
      ] : userData?.role === 'ACCOUNTLEAD' ? [
         { name: 'Tablea de bord financier', href: '/admin/finance', icon: LayoutDashboard },
         { name: 'Finance des étudiants', href: '/admin/finance/students', icon: Receipt },
         { name: 'Finance du personnel', href: '/admin/finance/staff', icon: BadgeDollarSign },
         { name: 'Rapports', href: '/admin/finance/reports', icon: BarChart4 },
         { name: 'Utilitaires', href: '/admin/finance/utilities', icon: Calculator }
      ] : userData?.role === 'ADMIN' ? [
         ...menuItems,
         { name: 'Tablea de bord financier', href: '/admin/finance', icon: LayoutDashboard },
         { name: 'Finance des étudiants', href: '/admin/finance/students', icon: Receipt },
         { name: 'Finance du personnel', href: '/admin/finance/staff', icon: BadgeDollarSign },
         { name: 'Rapports financiers', href: '/admin/finance/reports', icon: BarChart4 },
         { name: 'Utilitaires financiers', href: '/admin/finance/utilities', icon: Calculator }
      ] : menuItems; */

   const finalMenuItems: MenuItem[] =
      userData?.role === 'ACCOUNTANT'
         ? [
            {
               name: 'Tableau de bord financier',
               href: '/admin/finance',
               icon: LayoutDashboard,
            },
            {
               name: 'Finance des étudiants',
               href: '/admin/finance/students',
               icon: Receipt,
            },
            {
               name: 'Finance du personnel',
               href: '/admin/finance/staff',
               icon: BadgeDollarSign,
            },
            {
               name: 'Rapports',
               href: '/admin/finance/reports',
               icon: BarChart4,
            },
         ]
         : userData?.role === 'ACCOUNTLEAD'
            ? [
               {
                  name: 'Tableau de bord financier',
                  href: '/admin/finance',
                  icon: LayoutDashboard,
               },
               {
                  name: 'Finance des étudiants',
                  href: '/admin/finance/students',
                  icon: Receipt,
               },
               {
                  name: 'Finance du personnel',
                  href: '/admin/finance/staff',
                  icon: BadgeDollarSign,
               },
               {
                  name: 'Rapports',
                  href: '/admin/finance/reports',
                  icon: BarChart4,
               },
               {
                  name: 'Utilitaires',
                  href: '/admin/finance/utilities',
                  icon: Calculator,
               },
            ]
            : userData?.role === 'ADMIN'
               ? [
                  ...menuItems,
                  {
                     name: 'Tableau de bord financier',
                     href: '/admin/finance',
                     icon: LayoutDashboard,
                  },
                  {
                     name: 'Finance des étudiants',
                     href: '/admin/finance/students',
                     icon: Receipt,
                  },
                  {
                     name: 'Finance du personnel',
                     href: '/admin/finance/staff',
                     icon: BadgeDollarSign,
                  },
                  {
                     name: 'Rapports financiers',
                     href: '/admin/finance/reports',
                     icon: BarChart4,
                  },
                  {
                     name: 'Utilitaires financiers',
                     href: '/admin/finance/utilities',
                     icon: Calculator,
                  },
               ]
               : menuItems;


   const renderContent = () => (
      <div className="flex flex-col h-full bg-white">
         {/* Branding Section */}
         <div className="flex items-center justify-between px-7 h-24 border-b border-slate-50">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-200">
                  <School className="h-6 w-6 text-white" />
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter text-slate-900 leading-none italic">2CS</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Registre.</span>
               </div>
            </div>
            <div className="relative p-2 bg-slate-50 rounded-xl">
               <Bell className="w-5 h-5 text-slate-400" />
               {draftCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
            </div>
         </div>

         {/* Navigation Section */}
         <div className="flex-1 px-4 py-8 space-y-8 overflow-y-auto">

            <div className="flex-1 px-4 py-6 overflow-y-auto">
               <div className="space-y-6">
                  {/* Section Header */}
                  <div className="px-3">
                     <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                        {userData?.role || 'Invité'} Menu
                     </p>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col gap-1">
                     {finalMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                           <Link key={item.name} href={item.href} className="group">
                              <div
                                 className={`relative flex items-center gap-3 h-11 px-4 rounded-xl transition-all
                                    ${isActive
                                       ? 'bg-slate-900 text-white'
                                       : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                              >
                                 {/* Active Indicator */}
                                 {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary" />
                                 )}

                                 {/*  <span
                                    className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-700'
                                       }`}
                                 >
                                    {getIcon(item.name)}
                                 </span> */}
                                 <span
                                    className={`transition-colors ${isActive
                                       ? 'text-blue-400'
                                       : 'text-slate-400 group-hover:text-slate-700'
                                       }`}
                                 >
                                    {Icon ? (
                                       <Icon className="w-4 h-4" />
                                    ) : (
                                       getIcon(item.name)
                                    )}
                                 </span>
                                 <span className="text-sm font-medium">
                                    {item.name}
                                 </span>
                              </div>
                           </Link>
                        );
                     })}
                  </nav>
               </div>
            </div>

            {/* Teacher Specific Alerts */}
            <AnimatePresence>
               {userData?.role === 'TEACHER' && draftCount > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-2">
                     <div className="bg-amber-50 border border-amber-100/50 rounded-3xl p-5 flex gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">UPLOADS EN ATTENTE</p>
                           <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                              Vous avez <span className="font-black underline">{draftCount} notes</span> en attente de publication.
                           </p>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* User Card Footer */}
         <div className="p-5 mt-auto border-t border-slate-50 bg-slate-50/30">
            <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="relative">
                     <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700">
                        <UserCircle className="w-8 h-8 text-slate-500" />
                     </div>
                     <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                     </span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                     <span className="font-black text-sm text-white truncate italic tracking-tighter uppercase">
                        {userData?.name || 'Syncing...'}
                     </span>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">
                           {userData?.role ? `${userData.role} Session` : 'Authenticating'}
                        </span>
                     </div>
                  </div>
               </div>
               <Button
                  onClick={handleLogout}
                  className="w-full justify-center gap-2 bg-white/5 md:hover:bg-primary md:hover:text-white text-slate-400 border duration-500 border-white/10 rounded-2xl transition-all h-11 text-[10px] font-black uppercase tracking-[0.2em]"
               >
                  <LogOut className="w-3.5 h-3.5" /> Fermer la Session
               </Button>
            </div>
         </div>
      </div>
   );

   return (
      <>
         {/* Desktop Sidebar */}
         <aside className="hidden md:flex md:flex-col md:w-80 border-r border-slate-100 h-screen sticky top-0 z-50">
            {renderContent()}
         </aside>

         {/* Mobile Sidebar */}
         <ClientOnly>
            <div className="md:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl">
                     <School className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-black text-lg tracking-tighter uppercase italic">2CS</span>
               </div>
               <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                     <Button variant="ghost" size="icon" className="relative rounded-2xl bg-slate-50 border border-slate-100">
                        <Menu className="h-6 w-6 text-slate-600" />
                        {draftCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                     </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0 border-r-0 rounded-r-[3rem] overflow-hidden">
                     <SheetTitle className="sr-only">Menu</SheetTitle>
                     {renderContent()}
                  </SheetContent>
               </Sheet>
            </div>
         </ClientOnly>
      </>
   );
}

