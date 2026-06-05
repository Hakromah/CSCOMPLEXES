/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
   Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
   Search, UserPlus, MoreVertical, UserCog, Trash2, ShieldCheck,
   User, Mail, Fingerprint, Calendar as CalendarIcon, MapPin,
   Phone, Globe, Info, Loader2, Edit, FileUp, Download,
   AlertCircle, Home, LayoutDashboard, PieChart, Activity,
   Bus, Briefcase, Landmark
} from 'lucide-react';
import {
   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
   DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';
import Papa from 'papaparse';

// External Components
import EditUserForm from '@/components/forms/EditUserForm';
import DeleteUserAlert from '@/components/forms/DeleteUserAlert';

const userFormSchema = z.object({
   name: z.string().min(1, 'Name is required'),
   email: z.string().email('Invalid email'),
   password: z.string().min(6, 'Min 6 characters'),
   role: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'ACCOUNTANT', 'ACCOUNTLEAD', 'DRIVER', 'WORKER']),
   birthDate: z.string().optional(),
   birthCountry: z.string().optional(),
   birthCity: z.string().optional(),
   address: z.string().optional(),
   gender: z.string().optional(),
   phoneNumber: z.string().optional(),
});

interface User {
   id: number;
   name: string;
   email: string;
   // ... other fields
}

export default function UserManagement() {
   const [users, setUsers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [search, setSearch] = useState('');
   const [roleFilter, setRoleFilter] = useState('ALL');

   // Dialog States
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isImportOpen, setIsImportOpen] = useState(false);
   const [importing, setImporting] = useState(false);
   const [selectedUser, setSelectedUser] = useState<any>(null);
   const [emailDuplicate, setEmailDuplicate] = useState<any | null>(null);  // existing user with same email
   const [checkingEmail, setCheckingEmail] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Inspector States
   const [selectedStudentId, setSelectedStudentId] = useState<string>('');
   const [studentClasses, setStudentClasses] = useState<any[]>([]);
   const [isLoadingClasses, setIsLoadingClasses] = useState(false);

   const [csvPreview, setCsvPreview] = useState<any[]>([]);
   const [importSummary, setImportSummary] = useState<{ imported: number, skipped: number } | null>(null);

   const form = useForm<z.infer<typeof userFormSchema>>({
      resolver: zodResolver(userFormSchema),
      defaultValues: {
         role: 'STUDENT', name: '', email: '', password: '',
         birthDate: '', birthCountry: '', birthCity: '', address: '', gender: '', phoneNumber: ''
      },
   });

   // --- DATA CALCULATIONS (The "Command Center" Logic) ---
    const statsData = useMemo(() => {
       const counts = { STUDENT: 0, TEACHER: 0, ADMIN: 0, ACCOUNTANT: 0, ACCOUNTLEAD: 0, DRIVER: 0, WORKER: 0 };
       users.forEach(u => { if (counts[u.role as keyof typeof counts] !== undefined) counts[u.role as keyof typeof counts]++; });
       return [
          { name: 'Students', value: counts.STUDENT, color: '#10b981' },
          { name: 'Teachers', value: counts.TEACHER, color: '#3b82f6' },
          { name: 'Admins', value: counts.ADMIN, color: '#f59e0b' },
          { name: 'Accountants', value: counts.ACCOUNTANT + counts.ACCOUNTLEAD, color: '#8b5cf6' },
          { name: 'Drivers/Workers', value: counts.DRIVER + counts.WORKER, color: '#6366f1' }
       ];
    }, [users]);

   const fetchUsers = async () => {
      setLoading(true);
      try {
         const response = await api.get('/admin/users');
         const mappedUsers = response.data.map((u: any) => ({
            ...u,
            role: u.schoolRole,
            name: u.username || u.name,
         }));
         setUsers(mappedUsers);
      } catch (error) {
         toast.error('Registry sync failed');
         console.log(error)

      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { fetchUsers(); }, []);

   // --- HANDLERS ---
   const handleCreateSubmit = async (values: z.infer<typeof userFormSchema>) => {
      if (emailDuplicate) {
         toast.error(`Cannot create user: Email "${values.email}" is already registered.`);
         return;
      }
      setIsSubmitting(true);
      try {
         await api.post('/admin/users', values);
         toast.success('Identity generated and stored in ledger');
         setIsCreateOpen(false);
         form.reset();
         setEmailDuplicate(null);
         fetchUsers();
      } catch (error: any) {
         const msg = error?.response?.data?.error?.message
            || error?.response?.data?.message
            || 'Generation failed — check the email address';
         toast.error(msg);
      } finally {
         setIsSubmitting(false);
      }
   };

   // Live email duplicate check — runs against the already-fetched users list (no extra API call)
   const checkEmailDuplicate = (email: string) => {
      if (!email || !email.includes('@')) { setEmailDuplicate(null); return; }
      const match = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
      setEmailDuplicate(match || null);
   };

   // 1. Logic for parsing and cleaning
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      Papa.parse(file, {
         header: true,
         skipEmptyLines: true,
         transformHeader: (header) => header.replace(/^\ufeff/, "").trim(),
         complete: (results) => {
            // THE CLEANING LAYER
            const cleanedData = results.data.map((row: any) => {
               // --- 1. Date Transformation (01/01/2000 -> 2000-01-01) ---
               let formattedDate = row.birthDate || row.birthdate; // Support both cases
               if (formattedDate && formattedDate.includes('/')) {
                  const parts = formattedDate.split('/');
                  if (parts.length === 3) {
                     // Reorder to YYYY-MM-DD
                     // Assumes MM/DD/YYYY. Switch parts[0] and parts[1] if CSV is DD/MM/YYYY
                     formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                  }
               }

               return {
                  ...row,
                  // Normalizes role to UPPERCASE for the Java Enum
                  role: row.role?.toUpperCase().trim(),
                  // Normalizes the date for Spring's LocalDate
                  birthDate: formattedDate && formattedDate !== "" ? formattedDate : null,
                  // Trims potential whitespace from emails/names
                  name: row.name?.trim(),
                  email: row.email?.trim(),
               };
            });

            setCsvPreview(cleanedData);
            setImportSummary(null);
         }
      });
   };

   // 2. Logic for sending to Spring Boot
   const processImport = async () => {
      if (csvPreview.length === 0) return;

      const tid = toast.loading("Processing registry injection...");
      setImporting(true);

      try {
         const response = await api.post('/admin/users/bulk', csvPreview);
         setImportSummary(response.data); // Receives {imported, skipped, totalProcessed}
         toast.success("Injection successful", { id: tid });
         fetchUsers();
      } catch (error: any) {
         console.error("Import Error Detail:", error.response?.data);
         const errorMsg = error.response?.data?.message || "Check CSV headers and date formats";
         toast.error(`Registry mismatch: ${errorMsg}`, { id: tid });
      } finally {
         setImporting(false);
      }
   };

   // const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
   //    const file = e.target.files?.[0];
   //    if (!file) return;

   //    Papa.parse(file, {
   //       header: true,
   //       skipEmptyLines: true,
   //       complete: (results) => {
   //          // Set preview so the Admin can verify before hitting the backend
   //          setCsvPreview(results.data);
   //          setImportSummary(null); // Clear previous reports
   //       }
   //    });
   // };

   // const processImport = async () => {
   //    if (csvPreview.length === 0) return;

   //    const tid = toast.loading("Processing registry injection...");
   //    setImporting(true);

   //    try {
   //       const response = await api.post('/admin/users/bulk', csvPreview);
   //       setImportSummary(response.data);
   //       toast.success("Injection successful", { id: tid });
   //       fetchUsers(); // Refresh the main table
   //    } catch (error) {
   //       toast.error("Registry mismatch: Check CSV headers", { id: tid });
   //       console.log(error)
   //    } finally {
   //       setImporting(false);
   //    }
   // };

   const downloadTemplate = () => {
      const csv = "name,email,password,role,birthDate,birthCountry,birthCity,address,gender,phoneNumber\nJohn Doe,john@amf.edu,pass123,STUDENT,2005-12-01,USA,New York,123 Broadway,Male,+123456";
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'amf_template.csv'; a.click();
   };

   const handleStudentSelect = async (studentId: string) => {
      setSelectedStudentId(studentId);
      if (!studentId) return;
      setIsLoadingClasses(true);
      try {
         const res = await api.get(`/admin/students/${studentId}/classes`);
         setStudentClasses(res.data);
      } catch (e) { toast.error('Retrieval failed'); console.log(e) }
      finally { setIsLoadingClasses(false); }
   };

   // const filteredUsers = users.filter(u => {
   //    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.userId.toLowerCase().includes(search.toLowerCase());
   //    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
   //    return matchesSearch && matchesRole;
   // });

   const filteredUsers = users.filter(u => {
      // Use optional chaining (?.) and provide a fallback empty string ('')
      // This prevents the crash if name or userId is missing from the database
      const name = u.name?.toLowerCase() || '';
      const id = u.userId?.toLowerCase() || '';
      const searchLower = search.toLowerCase();

      const matchesSearch = name.includes(searchLower) || id.includes(searchLower);

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
   });

   // --- ANIMATION VARIANTS ---
   const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
   const itemVars = { hidden: { y: 15, opacity: 0 }, show: { y: 0, opacity: 1 } };

   const getRoleBadge = (role: string) => {
      const styles: any = {
         ADMIN: "bg-amber-500 hover:bg-amber-600",
         TEACHER: "bg-blue-600 hover:bg-blue-700",
         STUDENT: "bg-emerald-500 hover:bg-emerald-600",
         ACCOUNTANT: "bg-purple-600 hover:bg-purple-700",
         ACCOUNTLEAD: "bg-violet-600 hover:bg-violet-700",
         DRIVER: "bg-indigo-600 hover:bg-indigo-700",
         WORKER: "bg-slate-700 hover:bg-slate-800"
      };

      return (
         <Badge className={`${styles[role] || 'bg-slate-500'} border-none px-3 py-1 flex w-fit items-center gap-1 uppercase text-[10px] font-black tracking-widest text-white`}>
            {role === 'ADMIN' && <ShieldCheck size={10} />}
            {role === 'TEACHER' && <UserCog size={10} />}
            {role === 'STUDENT' && <User size={10} />}
            {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD') && <Landmark size={10} />}
            {role === 'DRIVER' && <Bus size={10} />}
            {role === 'WORKER' && <Briefcase size={10} />}
            {role}
         </Badge>
      );
   };

   return (
      <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50/50 min-h-screen">

         {/* 1. TOP COMMAND HEADER */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
               <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
                  REGISTRY COMMAND <Activity className="text-blue-500 animate-pulse" size={24} />
               </h1>
               <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Identity & Access Management</p>
            </motion.div>
            <div className="flex gap-3">
               <Button onClick={() => setIsImportOpen(true)} variant="outline" className="rounded-2xl h-12 border-slate-200 hover:bg-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-sm">
                  <FileUp size={16} /> Bulk Import
               </Button>
               <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95">
                  <UserPlus size={16} /> New Identity
               </Button>
            </div>
         </div>

         {/* 2. ANALYTICS ROW (The Design Upgrade) */}
         <div className="grid lg:grid-cols-3 gap-8">
            {/* User Distribution Chart */}
            <Card className="lg:col-span-1 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-3xl bg-white overflow-hidden">
               <CardHeader className="bg-slate-900 text-white py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <PieChart size={14} className="text-blue-400" /> User Matrix
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="h-[180px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                           <Pie data={statsData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value" stroke="none">
                              {statsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                           </Pie>
                           <ReTooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                        </RePie>
                     </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                     {statsData.map((s) => (
                        <div
                           key={s.name}
                           className="text-center p-3 rounded-2xl border transition-all hover:scale-105"
                           style={{
                              backgroundColor: `${s.color}20`, // Adds 15% opacity to the pie color
                              borderColor: `${s.color}35`,     // Adds 30% opacity to the border
                           }}
                        >
                           <p
                              className="text-[9px] font-black uppercase tracking-tighter"
                              style={{ color: s.color }} // Matches label color to the pie slice
                           >
                              {s.name}
                           </p>
                           <p className="text-xl font-black text-slate-800 leading-none mt-1">
                              {s.value}
                           </p>
                        </div>
                     ))}
                  </div>
                  {/* <div className="grid grid-cols-3 gap-2 mt-4">
                     {statsData.map(s => (
                        <div key={s.name} className="text-center p-2 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{s.name}</p>
                           <p className="text-lg font-black text-slate-800 leading-none mt-1">{s.value}</p>
                        </div>
                     ))}
                  </div> */}
               </CardContent>
            </Card>

            {/* Enrollment Inspector (Selective Lookup) */}
            <Card className="lg:col-span-2 border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white rounded-3xl overflow-hidden">
               <CardHeader className="bg-slate-900 text-white py-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <Search size={14} className="text-blue-400" /> Enrollment Inspector
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 h-full flex flex-col gap-6">
                  <Select onValueChange={handleStudentSelect}>
                     <SelectTrigger className="rounded-xl border-slate-200 h-11 bg-slate-50 font-bold">
                        <SelectValue placeholder="Identify student record..." />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl shadow-2xl border-slate-100">
                        {users.filter(u => u.role === 'STUDENT').map(s => (
                           <SelectItem key={s.id} value={String(s.id)} className="rounded-lg font-medium">{s.name} ({s.userId})</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <div className="flex-1 overflow-y-auto">
                     <AnimatePresence mode="wait">
                        {isLoadingClasses ? (
                           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase"><Loader2 className="animate-spin size-4" /> Fetching ledger...</motion.div>
                        ) : selectedStudentId && studentClasses.length > 0 ? (
                           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {studentClasses.map(c => (
                                 <div key={c.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex justify-between items-center">
                                    <div>
                                       <p className="text-xs font-black text-indigo-700 uppercase">{c.name}</p>
                                       <p className="text-[10px] text-indigo-500 font-bold">Lvl: {c.grade}</p>
                                    </div>

                                    <Badge className="bg-indigo-200 text-indigo-700 hover:bg-indigo-200 text-[9px] font-black px-2 uppercase">
                                       {c.teachers && c.teachers.length > 0
                                          ? (c.teachers.length > 1
                                             ? `${c.teachers[0].name} +${c.teachers.length - 1}`
                                             : c.teachers[0].name)
                                          : 'Tutor'}
                                    </Badge>
                                 </div>
                              ))}
                           </motion.div>
                        ) : selectedStudentId && (
                           <p className="text-slate-400 italic text-sm font-medium">No active class enrollments detected.</p>
                        )}
                     </AnimatePresence>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* 3. SEARCH & ROLE FILTERS */}
         <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white overflow-hidden p-4">
               <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                     <Input placeholder="Search registry by name, email, or fingerprint ID..." className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-600 font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                     {['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'ACCOUNTLEAD', 'DRIVER', 'WORKER'].map((role) => (
                        <Button key={role} variant="ghost" size="sm" onClick={() => setRoleFilter(role)} className={`rounded-xl h-10 px-5 font-black uppercase text-[10px] tracking-widest transition-all ${roleFilter === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{role}</Button>
                     ))}
                  </div>
               </div>
            </Card>
         </motion.div>

         {/* 4. MAIN REGISTRY TABLE (Staggered Entrance) */}
         <Card className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white overflow-hidden rounded-3xl">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                     <TableHead className="w-12"></TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Identity Profile</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Fingerprint ID</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Access Tier</TableHead>
                     <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Gender</TableHead>
                     <TableHead className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  <AnimatePresence mode="popLayout">
                     {loading ? (
                        <TableRow key="loading">
                           <TableCell colSpan={6} className="text-center py-24 text-slate-400 font-black animate-pulse uppercase tracking-widest">
                              Synchronizing Encrypted Ledger...
                           </TableCell>
                        </TableRow>
                     ) : (
                        filteredUsers.map((user) => (
                           <motion.tr key={user.id} variants={itemVars} className="group hover:bg-slate-50/80 transition-colors border-slate-50">
                              <TableCell>
                                 <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Fingerprint size={20} /></div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 tracking-tight">{user.name}</span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Mail size={12} /> {user.email}</span>
                                 </div>
                              </TableCell>
                              <TableCell><code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase tracking-tighter">{user.userId}</code></TableCell>
                              <TableCell>{getRoleBadge(user.role)}</TableCell>
                              <TableCell className="text-xs font-bold text-slate-500 uppercase">{user.gender || '—'}</TableCell>
                              <TableCell className="text-right">
                                 <div className="flex items-center justify-end gap-2">
                                    <Popover>
                                       <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-blue-50"><Info size={18} /></Button></PopoverTrigger>
                                       <PopoverContent className="w-80 rounded-3xl p-5 shadow-2xl border-slate-100">
                                          <div className="space-y-4">
                                             <div className="flex items-center justify-between border-b pb-2">
                                                <h4 className="font-black text-[10px] uppercase text-slate-400 tracking-widest">Metadata</h4>
                                                <Badge variant="outline" className="text-[10px] font-mono">{user.userId}</Badge>
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                <InfoBox icon={<CalendarIcon size={12} />} label="Birth Date" value={user.birthDate} />
                                                <InfoBox icon={<MapPin size={12} />} label="Birth City" value={user.birthCity} />
                                                <InfoBox icon={<Globe size={12} />} label="Country" value={user.birthCountry} />
                                                <InfoBox icon={<Phone size={12} />} label="Contact" value={user.phoneNumber} />
                                             </div>
                                             <div className="pt-3 border-t">
                                                <InfoBox icon={<Home size={12} />} label="Residential Address" value={user.address} />
                                             </div>
                                          </div>
                                       </PopoverContent>
                                    </Popover>
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={18} /></Button></DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2 shadow-2xl">
                                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsEditOpen(true); }} className="rounded-xl flex gap-2 py-2 cursor-pointer focus:bg-blue-50">
                                             <Edit size={16} className="text-blue-500" /> Edit Credentials
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDeleteOpen(true); }} className="rounded-xl flex gap-2 py-2 text-rose-600 font-black uppercase text-[10px] tracking-widest focus:bg-rose-50">
                                             <Trash2 size={16} /> Purge Identity
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </div>
                              </TableCell>
                           </motion.tr>
                        ))
                     )}
                  </AnimatePresence>
               </TableBody>
            </Table>
         </Card>

         {/* 5. DIALOGS (Integrated User Registration Forms) */}

         {/* Create Identity */}
         <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) { setEmailDuplicate(null); form.reset(); } }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
               <DialogHeader className="p-6 bg-blue-600 text-white">
                  <DialogTitle className="text-xl font-black tracking-tighter uppercase">Initialize New Identity</DialogTitle>
               </DialogHeader>
               <div className="p-8">
                  <Form {...form}>
                     <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <FormField control={form.control} name="name" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Legal Name</FormLabel><FormControl><Input placeholder="Full Name" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                               <FormItem>
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Institutional Email</FormLabel>
                                 <FormControl>
                                   <div className="relative">
                                     <Input
                                       placeholder="email@amf.edu"
                                       className={`rounded-xl bg-slate-50 border h-11 px-4 transition-colors ${
                                         emailDuplicate ? 'border-rose-400 bg-rose-50 focus-visible:ring-rose-300' : 'border-transparent'
                                       }`}
                                       {...field}
                                       onChange={(e) => {
                                         field.onChange(e);
                                         checkEmailDuplicate(e.target.value);
                                       }}
                                     />
                                     {emailDuplicate && (
                                       <AlertCircle size={15} className="absolute right-3 top-3.5 text-rose-500" />
                                     )}
                                   </div>
                                 </FormControl>
                                 <FormMessage />
                                 {emailDuplicate && (
                                   <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mt-1">
                                     <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                     <p className="text-[11px] font-bold text-rose-700 leading-snug">
                                       This email is already registered to{' '}
                                       <span className="font-black">{emailDuplicate.name}</span>{' '}
                                       <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-black text-[9px] uppercase">{emailDuplicate.role}</span>
                                     </p>
                                   </div>
                                 )}
                               </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-6 border-t pt-6">
                           <FormField control={form.control} name="password" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Access Key</FormLabel><FormControl><Input type="password" placeholder="••••••••" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl><FormMessage /></FormItem>
                           )} />
                           <FormField control={form.control} name="role" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Permission Tier</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none h-11"><SelectValue placeholder="Role" /></SelectTrigger></FormControl>
                                    <SelectContent className="rounded-xl shadow-xl">
                                       <SelectItem value="STUDENT">Student</SelectItem>
                                       <SelectItem value="TEACHER">Teacher</SelectItem>
                                       <SelectItem value="ADMIN">Admin</SelectItem>
                                       <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                                       <SelectItem value="ACCOUNTLEAD">Account Lead</SelectItem>
                                       <SelectItem value="DRIVER">Driver</SelectItem>
                                       <SelectItem value="WORKER">Worker</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </FormItem>
                           )} />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <FormField control={form.control} name="birthDate" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Date of Birth</FormLabel><FormControl><Input type="date" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Contact Number</FormLabel><FormControl><Input placeholder="+..." className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                           <FormField control={form.control} name="birthCountry" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Country</FormLabel><FormControl><Input placeholder="Country" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="birthCity" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">City</FormLabel><FormControl><Input placeholder="City" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                           )} />
                           <FormField control={form.control} name="gender" render={({ field }) => (
                              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Gender</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none h-11"><SelectValue placeholder="Gender" /></SelectTrigger></FormControl>
                                    <SelectContent className="rounded-xl shadow-xl"><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent>
                                 </Select>
                              </FormItem>
                           )} />
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => (
                           <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Address</FormLabel><FormControl><Input placeholder="Full Residential Address" className="rounded-xl bg-slate-50 border-none h-11 px-4" {...field} /></FormControl></FormItem>
                        )} />
                         <Button
                            type="submit"
                            disabled={isSubmitting || !!emailDuplicate}
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black font-black tracking-[0.3em] text-[10px] uppercase shadow-lg transition-all active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <><Loader2 size={16} className="animate-spin mr-2" /> Verifying... </>
                            ) : emailDuplicate ? (
                              <><AlertCircle size={16} className="mr-2" /> Duplicate Email </>
                            ) : 'Authorize Storage'}
                          </Button>
                     </form>
                  </Form>
               </div>
            </DialogContent>
         </Dialog>

         {/* Bulk Import */}
         <Dialog open={isImportOpen} onOpenChange={(open) => {
            setIsImportOpen(open);
            if (!open) { setCsvPreview([]); setImportSummary(null); }
         }}>
            <DialogContent className="max-w-2xl rounded-3xl border-none p-0 shadow-2xl overflow-hidden bg-white">
               <DialogHeader className="p-6 bg-slate-900 text-white">
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                     <FileUp className="text-blue-400" /> Registry Bulk Injection
                  </DialogTitle>
               </DialogHeader>

               <div className="p-8 space-y-6">
                  <AnimatePresence mode="wait">
                     {!csvPreview.length && !importSummary ? (
                        /* PHASE 1: FILE SELECTION */
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                           <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                              <AlertCircle className="text-amber-600 shrink-0" size={20} />
                              <div className="space-y-1">
                                 <p className="text-[10px] text-amber-800 leading-relaxed font-black uppercase tracking-widest">Format Requirement</p>
                                 <p className="text-[11px] text-amber-700 font-medium">Dates must be YYYY-MM-DD or MM/DD/YYYY. Roles must be STUDENT, TEACHER, or ADMIN.</p>
                              </div>
                           </div>

                           <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-12 hover:border-blue-400 transition-all bg-slate-50/50 relative group overflow-hidden">
                              <Input
                                 type="file"
                                 accept=".csv"
                                 className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                 onChange={handleFileUpload}
                              />
                              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                 <Download className="text-primary" size={32} />
                              </div>
                              <p className="font-black text-slate-700 uppercase text-xs tracking-widest">Select CSV Registry</p>
                           </div>
                        </motion.div>

                     ) : csvPreview.length > 0 && !importSummary ? (
                        /* PHASE 2: DATA PREVIEW */
                        <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                           <div className="flex justify-between items-center">
                              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Scanner: {csvPreview.length} Records Detected</h3>
                              <Button variant="ghost" size="sm" onClick={() => setCsvPreview([])} className="text-rose-500 font-black text-[10px] uppercase h-7 px-2">Clear</Button>
                           </div>
                           <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50">
                              <Table>
                                 <TableHeader className="sticky top-0 bg-white shadow-sm">
                                    <TableRow className="text-[9px] uppercase font-black tracking-widest border-none">
                                       <TableHead>Profile</TableHead>
                                       <TableHead>Registry Email</TableHead>
                                       <TableHead>Tier</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {csvPreview.slice(0, 5).map((row, i) => (
                                       <TableRow key={i} className="text-[11px] font-bold text-slate-600 border-slate-100">
                                          <TableCell>{row.name}</TableCell>
                                          <TableCell className="lowercase text-slate-400">{row.email}</TableCell>
                                          <TableCell><Badge className="bg-slate-200 text-slate-700 text-[9px] font-black border-none">{row.role}</Badge></TableCell>
                                       </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                              {csvPreview.length > 5 && (
                                 <div className="p-4 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] bg-white border-t border-slate-100">
                                    + {csvPreview.length - 5} additional identities in buffer
                                 </div>
                              )}
                           </div>
                           <Button onClick={processImport} disabled={importing} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95">
                              {importing ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" size={18} />}
                              Authorize Registry Injection
                           </Button>
                        </motion.div>

                     ) : (
                        /* PHASE 3: SUMMARY REPORT */
                        <motion.div key="report" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-6">
                           <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner shadow-emerald-200">
                              <ShieldCheck size={48} />
                           </div>
                           <div>
                              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Injection Success</h2>
                              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Registry ledger has been updated</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Injected</p>
                                 <p className="text-3xl font-black text-emerald-700 leading-none">{importSummary?.imported}</p>
                              </div>
                              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skipped</p>
                                 <p className="text-3xl font-black text-slate-600 leading-none">{importSummary?.skipped}</p>
                              </div>
                           </div>
                           <Button onClick={() => setIsImportOpen(false)} className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl">Return to Command Center</Button>
                        </motion.div>
                     )}
                  </AnimatePresence>

                  {!importSummary && (
                     <div className="pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={downloadTemplate} className="w-full text-primary hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl gap-2 transition-colors">
                           <Download size={16} /> Download CSV Sample
                        </Button>
                     </div>
                  )}
               </div>
            </DialogContent>
         </Dialog>


         {/* <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="max-w-md rounded-3xl border-none p-0 shadow-2xl overflow-hidden">
               <DialogHeader className="p-6 bg-slate-900 text-white">
                  <DialogTitle className="text-xl font-black uppercase tracking-tighter">Bulk Identity Upload</DialogTitle>
               </DialogHeader>
               <div className="p-8 space-y-6 text-center">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-left">
                     <AlertCircle className="text-amber-600 shrink-0" size={20} />
                     <p className="text-[10px] text-amber-800 leading-relaxed font-bold uppercase">Schema check: headers must include name, email, password, and role.</p>
                  </div>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-10 hover:border-blue-400 transition-colors bg-slate-50/50 relative group">
                     <Input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={importing} />
                     <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        {importing ? <Loader2 className="animate-spin text-primary" /> : <FileUp className="text-primary" size={32} />}
                     </div>
                     <p className="font-black text-slate-700 uppercase text-[10px] tracking-widest">Drop CSV Registry</p>
                  </div>
                  <Button variant="ghost" onClick={downloadTemplate} className="w-full text-primary hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-12 rounded-2xl">
                     <Download size={16} /> Download Template
                  </Button>
               </div>
            </DialogContent>
         </Dialog> */}

         {/* Edit & Delete Wrappers */}
         {
            selectedUser && (
               <>
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                     <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                        <DialogHeader className="p-6 bg-amber-500 text-white"><DialogTitle className="text-xl font-black uppercase">Edit Identity: {selectedUser.name}</DialogTitle></DialogHeader>
                        <div className="p-6"><EditUserForm user={selectedUser} onFinished={async () => { setIsEditOpen(false); await fetchUsers(); }} /></div>
                     </DialogContent>
                  </Dialog>
                  <DeleteUserAlert userId={selectedUser.id} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onFinished={async () => { setIsDeleteOpen(false); await fetchUsers(); }} />
               </>
            )
         }
      </div >
   );
}

function InfoBox({ icon, label, value }: any) {
   return (
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1 mb-0.5">{icon} {label}</p>
         <p className="text-[11px] font-black text-slate-700 truncate uppercase tracking-tight">{value || 'UNSET'}</p>
      </div>
   );
}
