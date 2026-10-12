'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  User,
  Mail,
  GraduationCap,
  Loader2,
  LayoutGrid,
  Calendar as CalendarIcon,
  Search,
  Eye,
  Users,
  Clock,
  Sparkles,
  ChevronRight,
  School
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClassDetailModal from '@/components/modals/ClassDetailModal';

interface Teacher {
  id: number;
  name?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  subjects?: Array<{ id: number; name: string }>;
}

interface ClassItem {
  id: number;
  name: string;
  grade?: string;
  academicYear?: { id: number; name: string };
  teachers?: Teacher[];
  students?: any[];
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/student/classes');
        setClasses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        toast.error('Échec de synchronisation', {
          description: 'Impossible de récupérer la liste de vos cours.',
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.grade && c.grade.toLowerCase().includes(q))
    );
  }, [classes, searchTerm]);

  const openClassModal = (cls: ClassItem) => {
    setSelectedClass(cls);
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50/50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Chargement de votre curriculum...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
            <GraduationCap size={16} />
            Portail Académique de l'Élève
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            Mes <span className="text-primary">Classes & Matières.</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl text-sm">
            Cliquez sur votre classe pour consulter l'emploi du temps complet, les camarades de promotion et les professeurs responsables de vos cours.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {classes.length > 0 && (
            <Button
              onClick={() => openClassModal(classes[0])}
              className="bg-white border border-slate-200 hover:border-primary hover:bg-slate-50 text-slate-900 rounded-2xl px-5 h-12 font-bold shadow-sm gap-2"
            >
              <CalendarIcon size={18} className="text-primary" />
              Consulter l'Emploi du Temps
            </Button>
          )}

          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Rechercher une classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 pl-10 pr-4 rounded-2xl bg-white border-slate-200 text-xs font-bold shadow-sm focus-visible:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence>
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((c, index) => {
                const teachers = c.teachers || [];
                const classmatesCount = c.students?.length || 0;

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      onClick={() => openClassModal(c)}
                      className="group border border-slate-200/80 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-white cursor-pointer"
                    >
                      <CardContent className="p-0">
                        {/* Card Top: Visual Accent */}
                        <div className="h-32 bg-slate-900 p-6 flex justify-between items-start relative overflow-hidden">
                          <div className="z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-primary/20 text-blue-300 border-none backdrop-blur-md font-bold text-[9px] uppercase tracking-wider">
                                Session Active
                              </Badge>
                              {c.grade && (
                                <Badge variant="outline" className="text-white/80 border-white/20 text-[9px] font-bold">
                                  Niv. {c.grade}
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-white text-2xl font-black tracking-tight leading-none uppercase italic">
                              {c.name}
                            </h3>
                          </div>
                          <BookOpen className="text-white/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" size={120} />
                        </div>

                        {/* Card Bottom: Content */}
                        <div className="p-6 space-y-5">
                          {/* Quick Cohort Stats */}
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-blue-600" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Camarades</p>
                                <p className="text-xs font-black text-slate-800">{classmatesCount}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <GraduationCap size={16} className="text-indigo-600" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Professeurs</p>
                                <p className="text-xs font-black text-slate-800">{teachers.length}</p>
                              </div>
                            </div>
                          </div>

                          {/* Teachers List Preview */}
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Professeurs assignés ({teachers.length})
                            </p>

                            <div className="space-y-2">
                              {teachers.length > 0 ? (
                                teachers.slice(0, 3).map((teacher) => {
                                  const tName = teacher.name || teacher.username || 'Enseignant';
                                  return (
                                    <div
                                      key={teacher.id}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/70 hover:border-blue-400 transition-colors"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                                          <User size={14} />
                                        </div>
                                        <div className="truncate">
                                          <p className="text-xs font-black text-slate-800 truncate">{tName}</p>
                                          {teacher.email && (
                                            <p className="text-[10px] text-slate-400 truncate">{teacher.email}</p>
                                          )}
                                        </div>
                                      </div>
                                      {teacher.email && (
                                        <a
                                          href={`mailto:${teacher.email}`}
                                          className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600"
                                        >
                                          <Mail size={14} />
                                        </a>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="py-3 text-center border border-dashed border-slate-200 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Aucun enseignant spécifié
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* CTA Button */}
                          <Button
                            onClick={() => openClassModal(c)}
                            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black uppercase text-[10px] tracking-wider h-12 rounded-2xl transition-all gap-1.5 shadow-sm group-hover:shadow-md"
                          >
                            <Eye size={14} />
                            Fiche de Classe & Emploi du Temps
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <LayoutGrid size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Aucune classe trouvée
              </h2>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                {searchTerm
                  ? 'Aucune classe ne correspond à votre recherche.'
                  : 'Vous n\'avez pas encore été assigné à une classe pour l\'année académique active.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
