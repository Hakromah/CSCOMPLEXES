'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  School,
  Users,
  Calendar,
  ArrowRight,
  BookOpen,
  Activity,
  Search,
  Eye,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import ClassDetailModal from '@/components/modals/ClassDetailModal';

interface ClassItem {
  id: number;
  name: string;
  grade?: string;
  academicYear?: { id: number; name: string };
  students?: any[];
  teachers?: any[];
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const response = await api.get('/teacher/classes');
        if (isMounted) {
          setClasses(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        toast.error('Échec du chargement du registre des classes');
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, []);

  const filteredClasses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.grade && c.grade.toLowerCase().includes(q))
    );
  }, [classes, searchTerm]);

  const totalStudents = useMemo(() => {
    return classes.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);
  }, [classes]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-[#f8fafc] space-y-6 lg:space-y-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <School className="text-primary w-5 h-5" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Portail Enseignant • Cohortes
            </h2>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter italic uppercase">
            Mes <span className="text-primary">Classes.</span>
          </h1>
          <p className="mt-2 text-slate-500 font-medium max-w-2xl text-sm">
            Consultez les effectifs complets de vos classes attribuées, découvrez les autres enseignants et accédez à l'emploi du temps officiel.
          </p>
        </motion.div>

        {/* Search Input */}
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
          <Input
            placeholder="Filtrer mes classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-11 pr-4 rounded-2xl bg-white border-slate-200 text-xs font-bold shadow-sm focus-visible:ring-blue-600"
          />
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mes Cohortes Actives</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{classes.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <School size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Élèves sous Supervision</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Statut Pédagogique</p>
            <p className="text-xs font-black text-blue-700 mt-1 uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Semestre en cours
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity size={22} />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400 animate-pulse">
              Chargement de vos cohortes...
            </p>
          </div>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="max-w-7xl mx-auto bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200 shadow-sm flex flex-col items-center">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <School size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700 tracking-tight mb-2">Aucune classe trouvée</h3>
          <p className="text-slate-400 font-medium text-xs max-w-md">
            {searchTerm
              ? 'Aucune classe ne correspond à vos critères de recherche.'
              : 'Vous n\'avez actuellement aucune cohorte active assignée dans le registre global.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredClasses.map((cls, idx) => {
            const studentCount = cls.students?.length || 0;
            const teachersCount = cls.teachers?.length || 0;

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  onClick={() => {
                    setSelectedClass(cls);
                    setIsDetailModalOpen(true);
                  }}
                  className="border border-slate-200/80 hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl rounded-3xl bg-white group overflow-hidden relative cursor-pointer"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-primary transition-colors flex items-center justify-center text-slate-500">
                        <Users size={24} />
                      </div>
                      <Badge className="bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors font-black text-[9px] uppercase tracking-wider px-3 py-1 border-none rounded-xl">
                        COHORTE #{cls.id}
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors uppercase italic">
                      {cls.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-5 flex items-center gap-1.5">
                      <Activity size={12} className="text-emerald-500" />
                      {studentCount} Élèves inscrits • {teachersCount} Enseignants
                    </p>

                    {/* Action buttons inside card */}
                    <div className="grid grid-cols-2 gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                      <a
                        href="/teacher/attendance"
                        className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors font-black text-[10px] uppercase tracking-wider border border-slate-100"
                      >
                        <Calendar size={14} />
                        Présence
                      </a>
                      <a
                        href="/teacher/results"
                        className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors font-black text-[10px] uppercase tracking-wider border border-slate-100"
                      >
                        <BookOpen size={14} />
                        Notes
                      </a>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedClass(cls);
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-wider transition-all gap-1.5 group-hover:shadow-lg group-hover:shadow-blue-200"
                    >
                      <Eye size={14} />
                      Voir la Cohorte & Emploi du Temps
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CLASS DETAIL MODAL */}
      <ClassDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        classId={selectedClass?.id || null}
        initialClass={selectedClass}
        locale="fr"
      />
    </div>
  );
}
