/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
   Pencil, Trash2, Calendar, Clock, BookOpen,
   Lock, CheckCircle2, AlertCircle, ChevronLeft,
   ChevronRight, MoreHorizontal, Power, Loader2, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// --- SCHEMA ---
const formSchema = z.object({
   subjectId: z.string().min(1, 'Subject is required'),
   classId: z.string().min(1, 'Class is required'),
   date: z.string().min(1, 'Date is required'),
   startTime: z.string().min(1, 'Start time is required'),
   endTime: z.string().min(1, 'End time is required'),
   academicYearId: z.string().min(1, 'Academic Year is required'),
   semesterId: z.string().min(1, 'Semester is required'),
   termId: z.string().min(1, 'Term is required'),
   weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Weight must be a positive number',
   }),
});

export default function TeacherExamsPage() {
   // --- STATES ---
   const [exams, setExams] = useState<any[]>([]);
   const [subjects, setSubjects] = useState<any[]>([]);
   const [classes, setClasses] = useState<any[]>([]);
   const [currentTeacherId, setCurrentTeacherId] = useState<number | null>(null);
   const [loading, setLoading] = useState(true);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingExam, setEditingExam] = useState<any | null>(null);

   // Dynamic Academic Session states
   const [academicYears, setAcademicYears] = useState<any[]>([]);
   const [semesters, setSemesters] = useState<any[]>([]);
   const [terms, setTerms] = useState<any[]>([]);

   const [isAddYearOpen, setIsAddYearOpen] = useState(false);
   const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
   const [isAddTermOpen, setIsAddTermOpen] = useState(false);

   const [newYearName, setNewYearName] = useState('');
   const [newSemesterName, setNewSemesterName] = useState('');
   const [newSemesterYearId, setNewSemesterYearId] = useState('');
   const [newTermName, setNewTermName] = useState('');
   const [newTermSemesterId, setNewTermSemesterId] = useState('');

   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         subjectId: '', classId: '', date: '', startTime: '', endTime: '',
         academicYearId: '', semesterId: '', termId: '', weight: '30'
      },
   });

   useEffect(() => { loadAllData(); }, []);

   const loadAcademicSessions = async () => {
      try {
         const [yearsRes, semestersRes, termsRes] = await Promise.all([
            api.get('/academic-years?pagination[pageSize]=100'),
            api.get('/semesters?pagination[pageSize]=100&populate=academicYear'),
            api.get('/terms?pagination[pageSize]=100&populate=semester')
         ]);
         setAcademicYears(yearsRes.data.data || []);
         setSemesters(semestersRes.data.data || []);
         setTerms(termsRes.data.data || []);
      } catch (e) {
         console.error('Failed to load academic sessions:', e);
      }
   };

   const loadAllData = async () => {
      setLoading(true);
      try {
         const examsRes = await api.get('/teacher/exams');
         const subjectsRes = await api.get('/teacher/subjects');
         const classesRes = await api.get('/teacher/classes');
         const userRes = await api.get('/auth/me');

         setExams(examsRes.data);
         setSubjects(subjectsRes.data);
         setClasses(classesRes.data);
         setCurrentTeacherId(userRes.data.id);
         await loadAcademicSessions();
      } catch (error: any) {
         console.error("400 Error Source:", error.response?.config.url);
         toast.error('Sync Error', {
            description: `Check console: ${error.response?.config.url} returned 400`
         });
      } finally {
         setLoading(false);
      }
   };

   const handleAddYear = async () => {
      if (!newYearName.trim()) return;
      const tid = toast.loading('Creating Academic Year...');
      try {
         const res = await api.post('/academic-years', { data: { name: newYearName.trim() } });
         toast.success('Academic Year created successfully', { id: tid });
         const created = res.data.data;
         await loadAcademicSessions();
         setIsAddYearOpen(false);
         setNewYearName('');
         if (created) form.setValue('academicYearId', String(created.id));
      } catch (err: any) {
         toast.error(err.response?.data?.message || 'Failed to create year', { id: tid });
      }
   };

   const handleAddSemester = async () => {
      if (!newSemesterName.trim() || !newSemesterYearId) return;
      const tid = toast.loading('Creating Semester...');
      try {
         const res = await api.post('/semesters', {
            data: {
               name: newSemesterName.trim(),
               academicYear: parseInt(newSemesterYearId)
            }
         });
         toast.success('Semester created successfully', { id: tid });
         const created = res.data.data;
         await loadAcademicSessions();
         setIsAddSemesterOpen(false);
         setNewSemesterName('');
         if (created) form.setValue('semesterId', String(created.id));
      } catch (err: any) {
         toast.error(err.response?.data?.message || 'Failed to create semester', { id: tid });
      }
   };

   const handleAddTerm = async () => {
      if (!newTermName.trim() || !newTermSemesterId) return;
      const tid = toast.loading('Creating Term...');
      try {
         const res = await api.post('/terms', {
            data: {
               name: newTermName.trim(),
               semester: parseInt(newTermSemesterId)
            }
         });
         toast.success('Term created successfully', { id: tid });
         const created = res.data.data;
         await loadAcademicSessions();
         setIsAddTermOpen(false);
         setNewTermName('');
         if (created) form.setValue('termId', String(created.id));
      } catch (err: any) {
         toast.error(err.response?.data?.message || 'Failed to create term', { id: tid });
      }
   };

   // --- CRUD ACTIONS ---
   const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const selectedSubject = subjects.find(s => String(s.id) === values.subjectId);
      const formatTime = (t: string) => t.length === 5 ? `${t}:00.000` : t.length === 8 ? `${t}.000` : t;

      const payload = {
         name: selectedSubject?.name || 'Exam',
         date: values.date,
         startTime: formatTime(values.startTime),
         endTime: formatTime(values.endTime),
         academicYear: parseInt(values.academicYearId),
         semesterRel: parseInt(values.semesterId),
         termRel: parseInt(values.termId),
         weight: parseInt(values.weight),
         classe: { id: parseInt(values.classId) },
         subject: { id: parseInt(values.subjectId) },
      };

      try {
         if (editingExam) {
            await api.put(`/teacher/exams/${editingExam.id}`, payload);
            toast.success('Exam details updated');
         } else {
            await api.post('/teacher/exams', payload);
            toast.success('Exam created successfully');
         }
         loadAllData();
         setIsDialogOpen(false);
      } catch (error: any) {
         toast.error(error.response?.data?.message || 'Action failed');
      }
   };

   const handleDelete = async (id: number) => {
      if (!confirm("Are you sure you want to delete this assessment?")) return;
      try {
         await api.delete(`/teacher/exams/${id}`);
         toast.success("Exam deleted");
         loadAllData();
      } catch (e) {
         toast.error("Deletion failed");
         console.log(e)
      }
   };

   const toggleStatus = async (exam: any) => {
      try {
         const newStatus = !exam.closed;
         console.log("Sending status update:", { closed: newStatus });
         await api.patch(`/teacher/exams/${exam.id}/toggle-status`, { closed: newStatus });
         toast.success(newStatus ? "Exam Marked as Closed" : "Exam Re-opened");
         loadAllData();
      } catch (e: any) {
         console.error("Status Toggle Error Details:", e.response?.data);
         toast.error("Status update failed");
      }
   };

   const onOpenEdit = (exam: any) => {
      setEditingExam(exam);
      form.reset({
         subjectId: String(exam.subject.id),
         classId: String(exam.classe.id),
         date: exam.date,
         startTime: exam.startTime,
         endTime: exam.endTime,
         academicYearId: exam.academicYear?.id ? String(exam.academicYear.id) : '',
         semesterId: exam.semesterRel?.id ? String(exam.semesterRel.id) : '',
         termId: exam.termRel?.id ? String(exam.termRel.id) : '',
         weight: String(exam.weight),
      });
      setIsDialogOpen(true);
   };

   // --- PAGINATION LOGIC ---
   const totalPages = Math.ceil(exams.length / itemsPerPage);
   const currentExams = exams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
         <Loader2 className="animate-spin text-primary" size={40} />
         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Exam Center...</p>
      </div>
   );

   return (
      <div className="p-6 lg:p-10 bg-[#f8fafc] md:min-h-screen space-y-[clamp(1.3rem,1vw+0.5rem,2rem)]">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl mx-auto">
            <div>
               <h1 className="text-[clamp(1.3rem,2.5vw+1rem,2rem)] font-black text-slate-900 tracking-tighter italic">Exam <span className="text-primary">Center.</span></h1>
               <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest text-[10px]">Registry & Assessments • 2026</p>
            </div>
            <Button onClick={() => { setEditingExam(null); form.reset(); setIsDialogOpen(true); }} className="bg-slate-900 hover:bg-blue-600 rounded-2xl h-14 px-8 font-black transition-all shadow-xl">
               <Plus className="mr-2 h-5 w-5" /> NEW ASSESSMENT
            </Button>
         </div>

         {/* Table Card */}
         <div className="bg-white rounded-[clamp(1.3rem,1vw+0.5rem,2rem)] shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors overflow-hidden max-w-7xl mx-auto">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                     <TableHead className="py-8 pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Exam Details</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Weight</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Schedule</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Status</TableHead>
                     <TableHead className="text-right pr-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Actions</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {currentExams.map((exam) => (
                     <TableRow key={exam.id} className="hover:bg-blue-50/10 transition-colors border-slate-50">
                        <TableCell className="pl-10 py-6">
                           <div className="font-black text-slate-900 italic uppercase text-sm">{exam.name}</div>
                           <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">{exam.classe.name}</div>
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="inline-block px-4 py-1.5 bg-slate-900 text-white rounded-xl font-black text-[10px] italic">
                              {exam.weight}%
                           </span>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                              <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {exam.date}</span>
                              <span className="flex items-center gap-1.5 uppercase text-slate-400 tracking-tighter"><Clock size={12} /> {exam.startTime} - {exam.endTime}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge className={`rounded-lg px-3 py-1 font-black text-[9px] tracking-widest border-none ${exam.closed ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                              {exam.closed ? 'CLOSED' : 'ACTIVE'}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal size={20} /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-2xl">
                                 <DropdownMenuItem onClick={() => toggleStatus(exam)} className="rounded-xl font-black text-[10px] p-3 uppercase tracking-widest">
                                    <Power size={14} className="mr-2 text-primary" /> {exam.closed ? "Re-open" : "Close Exam"}
                                 </DropdownMenuItem>
                                 <DropdownMenuItem disabled={exam.locked} onClick={() => onOpenEdit(exam)} className="rounded-xl font-black text-[10px] p-3 uppercase tracking-widest">
                                    <Pencil size={14} className="mr-2 text-amber-500" /> Edit
                                 </DropdownMenuItem>
                                 <DropdownMenuItem disabled={exam.locked} onClick={() => handleDelete(exam.id)} className="rounded-xl font-black text-[10px] p-3 uppercase tracking-widest text-rose-600">
                                    <Trash2 size={14} className="mr-2" /> Delete
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>

            {/* Pagination */}
            <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
               <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl h-10 w-10 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></Button>
                  <Button variant="outline" className="rounded-xl h-10 w-10 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={16} /></Button>
               </div>
            </div>
         </div>

         {/* Dialog for Edit/Create */}
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-10 border-none shadow-2xl">
               <DialogHeader>
                  <DialogTitle className="text-3xl font-black italic tracking-tighter">
                     {editingExam ? 'Edit' : 'Create'} <span className="text-primary">Assessment.</span>
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Configure weight and timing for the assessment.</DialogDescription>
               </DialogHeader>

               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                     <FormField control={form.control} name="academicYearId" render={({ field }) => (
                        <FormItem>
                           <div className="flex items-center gap-2">
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Academic Year</FormLabel>
                              <Button type="button" onClick={() => setIsAddYearOpen(true)} variant="link" className="h-fit p-0 text-[10px] font-black text-blue-600 uppercase hover:no-underline">
                                 + Add Year
                              </Button>
                           </div>
                           <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Select Academic Year" /></SelectTrigger></FormControl>
                              <SelectContent className="rounded-xl border-none shadow-xl animate-in fade-in zoom-in duration-200">
                                 {academicYears.map(y => (
                                    <SelectItem key={y.id} value={String(y.id)} className="font-bold">{y.name}</SelectItem>
                                 ))}
                              </SelectContent></Select>
                        </FormItem>
                     )} />

                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="semesterId" render={({ field }) => (
                           <FormItem>
                              <div className="flex items-center gap-2">
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Semester</FormLabel>
                                 <Button type="button" onClick={() => {
                                    setNewSemesterYearId(form.watch('academicYearId'));
                                    setIsAddSemesterOpen(true);
                                 }} variant="link" className="h-fit p-0 text-[10px] font-black text-blue-600 uppercase hover:no-underline">
                                    + Add Semester
                                 </Button>
                              </div>
                              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Select Semester" /></SelectTrigger></FormControl>
                                 <SelectContent className="rounded-xl border-none shadow-xl animate-in fade-in zoom-in duration-200">
                                    {semesters.filter(s => !form.watch('academicYearId') || String(s.academicYear?.id) === form.watch('academicYearId')).map(s => (
                                       <SelectItem key={s.id} value={String(s.id)} className="font-bold">{s.name}</SelectItem>
                                    ))}
                                 </SelectContent></Select>
                           </FormItem>
                        )} />
                        <FormField control={form.control} name="termId" render={({ field }) => (
                           <FormItem>
                              <div className="flex items-center gap-2">
                                 <FormLabel className="text-[10px] font-black uppercase text-slate-400">Term</FormLabel>
                                 <Button type="button" onClick={() => {
                                    setNewTermSemesterId(form.watch('semesterId'));
                                    setIsAddTermOpen(true);
                                 }} variant="link" className="h-fit p-0 text-[10px] font-black text-blue-600 uppercase hover:no-underline" disabled={!form.watch('semesterId')}>
                                    + Add Term
                                 </Button>
                              </div>
                              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Select Term" /></SelectTrigger></FormControl>
                                 <SelectContent className="rounded-xl border-none shadow-xl animate-in fade-in zoom-in duration-200">
                                    {terms.filter(t => !form.watch('semesterId') || String(t.semester?.id) === form.watch('semesterId')).map(t => (
                                       <SelectItem key={t.id} value={String(t.id)} className="font-bold">{t.name}</SelectItem>
                                    ))}
                                 </SelectContent></Select>
                           </FormItem>
                        )} />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="subjectId" render={({ field }) => (
                           <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Subject</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger></FormControl>
                                 <SelectContent className="rounded-xl border-none shadow-xl">
                                    {subjects.map(s => <SelectItem key={s.id} value={String(s.id)} className="font-bold">{s.name}</SelectItem>)}
                                 </SelectContent></Select>
                           </FormItem>
                        )} />
                        <FormField control={form.control} name="weight" render={({ field }) => (
                           <FormItem>
                              <FormLabel className="text-[10px] font-black uppercase text-slate-400">Weight (%)</FormLabel>
                              <FormControl><Input type="number" {...field} className="rounded-xl bg-slate-50 border-none font-bold" /></FormControl>
                              <FormMessage />
                           </FormItem>
                        )} />
                     </div>

                     <FormField control={form.control} name="classId" render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-[10px] font-black uppercase text-slate-400">Classroom</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent className="rounded-xl border-none shadow-xl">
                                 {classes.map(c => <SelectItem key={c.id} value={String(c.id)} className="font-bold">{c.name}</SelectItem>)}
                              </SelectContent></Select>
                        </FormItem>
                     )} />

                     <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="date" render={({ field }) => (
                           <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Date</FormLabel><FormControl><Input type="date" {...field} className="rounded-xl bg-slate-50 border-none font-bold" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="startTime" render={({ field }) => (
                           <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Start</FormLabel><FormControl><Input type="time" {...field} className="rounded-xl bg-slate-50 border-none font-bold" /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="endTime" render={({ field }) => (
                           <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">End</FormLabel><FormControl><Input type="time" {...field} className="rounded-xl bg-slate-50 border-none font-bold" /></FormControl></FormItem>
                        )} />
                     </div>

                     <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-500/20">
                        Confirm Academic Record
                     </Button>
                  </form>
               </Form>
            </DialogContent>
         </Dialog>

         {/* Sub-Dialog for Add Academic Year */}
         <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border border-slate-100 shadow-2xl bg-white">
               <DialogHeader>
                  <DialogTitle className="text-xl font-black italic tracking-tighter">Add <span className="text-primary">Academic Year.</span></DialogTitle>
                  <DialogDescription className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Create a new academic calendar period.</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Year Name</label>
                     <Input placeholder="e.g. 2026-2027" value={newYearName} onChange={(e) => setNewYearName(e.target.value)} className="rounded-xl bg-slate-50 border-none font-bold" />
                  </div>
                  <Button onClick={handleAddYear} className="w-full h-12 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-xl uppercase text-[9px] tracking-wider" disabled={!newYearName}>
                     Save Academic Year
                  </Button>
               </div>
            </DialogContent>
         </Dialog>

         {/* Sub-Dialog for Add Semester */}
         <Dialog open={isAddSemesterOpen} onOpenChange={setIsAddSemesterOpen}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border border-slate-100 shadow-2xl bg-white">
               <DialogHeader>
                  <DialogTitle className="text-xl font-black italic tracking-tighter">Add <span className="text-primary">Semester.</span></DialogTitle>
                  <DialogDescription className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Create a new academic session.</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Semester Name</label>
                     <Input placeholder="e.g. Trimester 1" value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)} className="rounded-xl bg-slate-50 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Academic Year</label>
                     <Select onValueChange={setNewSemesterYearId} value={newSemesterYearId}>
                        <SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                           {academicYears.map(y => <SelectItem key={y.id} value={String(y.id)} className="font-bold">{y.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <Button onClick={handleAddSemester} className="w-full h-12 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-xl uppercase text-[9px] tracking-wider" disabled={!newSemesterName || !newSemesterYearId}>
                     Save Semester
                  </Button>
               </div>
            </DialogContent>
         </Dialog>

         {/* Sub-Dialog for Add Term */}
         <Dialog open={isAddTermOpen} onOpenChange={setIsAddTermOpen}>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border border-slate-100 shadow-2xl bg-white">
               <DialogHeader>
                  <DialogTitle className="text-xl font-black italic tracking-tighter">Add <span className="text-primary">Term.</span></DialogTitle>
                  <DialogDescription className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Create a new term within a semester.</DialogDescription>
               </DialogHeader>
               <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Term Name</label>
                     <Input placeholder="e.g. First Quarter" value={newTermName} onChange={(e) => setNewTermName(e.target.value)} className="rounded-xl bg-slate-50 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-slate-400">Semester</label>
                     <Select onValueChange={setNewTermSemesterId} value={newTermSemesterId}>
                        <SelectTrigger className="rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Select Semester" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                           {semesters.map(s => <SelectItem key={s.id} value={String(s.id)} className="font-bold">{s.name} ({s.academicYear?.name})</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  <Button onClick={handleAddTerm} className="w-full h-12 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-xl uppercase text-[9px] tracking-wider" disabled={!newTermName || !newTermSemesterId}>
                     Save Term
                  </Button>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
}
