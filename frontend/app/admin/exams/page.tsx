/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { loadExams(); }, []);

  const loadExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      toast.error('Failed to load global exam registry');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockSemester = async () => {
    if (!confirm("CRITICAL: Locking this semester will prevent ALL teachers from editing their exams. Proceed?")) return;

    try {
      await api.patch('/admin/exams/lock-semester', { semester: "Fall 2025" });
      toast.success("Semester records finalized and locked.");
      loadExams();
    } catch (e) {
      toast.error("Lock operation failed");
      console.log(e);
    }
  };

  // Filter Logic: Search by subject, teacher, or class
  const filteredExams = exams.filter(exam =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.teacher?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.classe?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage);
  const currentExams = filteredExams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Master Registry...</p>
    </div>
  );

  return (
    <div className="p-[clamp(1rem,2vw+1rem,2rem)] bg-[#f8fafc] min-h-screen space-y-[clamp(1rem,2vw+1rem,2rem)]">
      {/* Admin Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="text-primary" size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Authority Access</span>
          </div>
          <h1 className="text-[clamp(1.2rem,2vw+1rem,2rem)] font-black text-slate-900 tracking-tighter italic">Global <span className="text-primary">Exams.</span></h1>
        </div>

        <div className="flex gap-3 max-xs:flex-wrap">
          <Button variant="outline" className="rounded-[clamp(1rem,2vw+1rem,2rem)] border-slate-200 font-bold h-12 px-6">
            <Download size={18} className="mr-2" /> EXPORT PDF
          </Button>
          <Button onClick={handleLockSemester} className="bg-rose-600 hover:bg-rose-700 text-white rounded-[clamp(1rem,2vw+1rem,2rem)] h-12 px-6 font-black shadow-lg shadow-rose-200">
            <Lock size={18} className="mr-2" /> FINALIZE SEMESTER
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
        <Input
          placeholder="Search by subject, teacher, or classroom..."
          className="h-16 pl-16 pr-8 rounded-[clamp(1rem,2vw+1rem,2rem)] border border-primary/0 lg:hover:border-primary duration-500 shadow-sm bg-white font-bold text-slate-600 placeholder:text-slate-300 focus-visible:ring-blue-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Master Registry Table */}
      <div className="bg-white rounded-[clamp(1rem,2vw+1rem,2rem)] shadow-sm border border-slate-100 md:hover:border-primary duration-500 transition-colors overflow-hidden max-w-7xl mx-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none">
              <TableHead className="py-8 pl-10 font-black text-[10px] uppercase tracking-widest text-slate-400">Exam & Class</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Instructor</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Weight</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="text-right pr-10 font-black text-[10px] uppercase tracking-widest text-slate-400">Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentExams.map((exam) => (
              <TableRow key={exam.id} className="hover:bg-blue-50/10 transition-colors border-slate-50">
                <TableCell className="pl-10 py-6">
                  <div className="font-black text-slate-900 italic uppercase text-sm">{exam.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{exam.classe?.name || 'No Class'}</div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">
                      {(exam.teacher?.username || exam.teacher?.name || 'UN').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs text-slate-700">{exam.teacher?.username || exam.teacher?.name || 'Unknown'}</span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-[10px] italic">
                    {exam.weight}%
                  </span>
                </TableCell>

                <TableCell>
                  <Badge className={`rounded-lg px-3 py-1 font-black text-[9px] tracking-widest border-none ${exam.closed ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-primary'}`}>
                    {exam.closed ? 'FINISHED' : 'PENDING'}
                  </Badge>
                </TableCell>

                <TableCell className="text-right pr-10">
                  {exam.locked ? (
                    <Badge className="bg-rose-50 text-rose-600 border-rose-100 font-black text-[9px] px-3">
                      <Lock size={10} className="mr-1" /> RECORDS LOCKED
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black text-[9px] px-3">
                      <Unlock size={10} className="mr-1" /> MODIFIABLE
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Admin Pagination */}
        <div className="p-8 bg-slate-50/30 flex items-center justify-between border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Displaying {currentExams.length} results of {filteredExams.length} in registry
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl h-10 w-10 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={16} /></Button>
            <Button variant="outline" className="rounded-xl h-10 w-10 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={16} /></Button>
          </div>
        </div>
      </div>

      {/* System Warning */}
      {!exams.some(e => e.locked) && (
        <div className="max-w-7xl mx-auto flex items-center gap-4 bg-amber-50 border border-amber-100 p-6 rounded-4xl text-amber-700">
          <AlertTriangle size={24} className="shrink-0" />
          <p className="text-xs font-bold leading-relaxed">
            <span className="font-black uppercase tracking-wider block mb-1 underline">Security Notice:</span>
            All assessment records are currently modifiable by teachers. It is recommended to lock records after the final exam period to ensure data integrity for report cards.
          </p>
        </div>
      )}
    </div>
  );
}
