/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
   Calendar,
   Clock,
   BookOpen,
   CheckCircle2,
   Hourglass,
   Lock,
   ChevronLeft,
   ChevronRight,
   Loader2,
   AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function StudentExamsPage() {
   const [exams, setExams] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   useEffect(() => {
      const fetchExams = async () => {
         try {
            const response = await api.get('/student/exams');
            // Sort by date: upcoming first
            setExams(response.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
         } catch (error) {
            toast.error('Failed to load assessment schedule');
            console.log(error)
         } finally {
            setLoading(false);
         }
      };
      fetchExams();
   }, []);

   // Pagination Logic
   const totalPages = Math.ceil(exams.length / itemsPerPage);
   const currentExams = exams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
         <Loader2 className="animate-spin text-primary" size={40} />
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Syncing Academic Calendar...</p>
      </div>
   );

   return (
      <div className="p-6 lg:p-10 bg-[#f8fafc] md:min-h-screen space-y-[clamp(1rem,2vw+1rem,2rem)]">
         {/* Header Section */}
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
               <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter italic">Exam <span className="text-primary">Pulse.</span></h1>
               <p className="text-slate-500 font-bold text-sm mt-2 uppercase tracking-widest text-[10px]">Upcoming Assessments & Grading Status</p>
            </div>

            <Card className="shadow-sm rounded-2xl bg-white px-6 py-4 flex items-center gap-4 border border-slate-100 md:hover:border-primary duration-500 transition-colors">
               <div className="p-3 bg-blue-50 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                  <BookOpen size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assessments</p>
                  <p className="text-xl font-black text-slate-900">{exams.length}</p>
               </div>
            </Card>
         </div>

         {/* Main Registry Table */}
         <div className="bg-white rounded-[clamp(1rem,2vw+1rem,2rem)] shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors overflow-hidden max-w-7xl mx-auto">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none">
                     <TableHead className="py-8 pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Assessment</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Term & Weight</TableHead>
                     <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Schedule</TableHead>
                     <TableHead className="text-right pr-10 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Status</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {currentExams.map((exam) => (
                     <TableRow key={exam.id} className="hover:bg-blue-50/10 transition-colors duration-500 border-slate-50 group">
                        <TableCell className="pl-10 py-6">
                           <div className="font-black text-slate-900 italic uppercase text-sm tracking-tight">{exam.name}</div>
                           <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Class: {exam.classe.name}</div>
                        </TableCell>

                        <TableCell>
                           <div className="flex flex-col gap-1">
                              <span className="font-black text-[10px] text-slate-800 uppercase tracking-tighter italic">{exam.term}</span>
                              <Badge variant="outline" className="w-fit text-[9px] font-black border-slate-200 text-slate-500 rounded-md">
                                 WEIGHT: {exam.weight}%
                              </Badge>
                           </div>
                        </TableCell>

                        <TableCell>
                           <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-600">
                              <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {exam.date}</span>
                              <span className="flex items-center gap-1.5 uppercase text-slate-400 tracking-tighter">
                                 <Clock size={12} /> {exam.startTime} - {exam.endTime}
                              </span>
                           </div>
                        </TableCell>

                        <TableCell className="text-right pr-10">
                           {exam.closed ? (
                              <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-400 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest italic">
                                 <Hourglass size={12} /> Results Pending
                              </div>
                           ) : (
                              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest italic shadow-sm shadow-emerald-100">
                                 <AlertCircle size={12} className="animate-pulse" /> Upcoming Exam
                              </div>
                           )}
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>

            {/* Pagination Footer */}
            <div className="p-8 bg-slate-50/30 flex items-center justify-between border-t border-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                  Displaying assessment range {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, exams.length)}
               </p>
               <div className="flex gap-2">
                  <Button
                     variant="outline"
                     className="rounded-xl h-10 w-10 p-0 border-slate-200 md:hover:border-primary md:hover:text-primary duration-500 transition-colors"
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                     disabled={currentPage === 1}
                  >
                     <ChevronLeft size={16} />
                  </Button>
                  <Button
                     variant="outline"
                     className="rounded-xl h-10 w-10 p-0 border-slate-200 md:hover:border-primary md:hover:text-primary duration-500 transition-colors"
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                     disabled={currentPage === totalPages}
                  >
                     <ChevronRight size={16} />
                  </Button>
               </div>
            </div>
         </div>

         {/* Info Card */}
         <Card className="max-w-7xl mx-auto border border-blue-500 md:hover:border-white duration-500 transition-colors bg-blue-600 text-white rounded-[clamp(1rem,2vw+1rem,2rem)] p-8 shadow-xl shadow-blue-200 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                     <CheckCircle2 size={32} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black uppercase italic">Academic Integrity</h3>
                     <p className="text-blue-100 text-xs font-medium mt-1">Check your schedule regularly. Teachers may lock assessments upon semester completion.</p>
                  </div>
               </div>
               <Button variant="outline" className="bg-white/10 border-white/20 md:hover:border-white duration-500 hover:bg-white/20 text-white rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest transition-colors">
                  Download Regulations
               </Button>
            </div>
            <Lock className="absolute -right-10 -bottom-10 text-white/5" size={200} />
         </Card>
      </div>
   );
}
