/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useRef, startTransition, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Landmark,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Users2,
  Shapes,
  Loader2,
  ChevronRight,
  Eye,
  GraduationCap,
  Calendar,
  School,
  Sparkles,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  FormControl, FormField, FormItem,
  FormLabel, FormMessage
} from '@/components/ui/form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import DeleteClassAlert from '@/components/forms/DeleteClassAlert';
import EditClassForm from '@/components/forms/EditClassForm';
import ClassDetailModal from '@/components/modals/ClassDetailModal';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Nom de classe est requis' }),
  grade: z.string().min(1, { message: 'Niveau obligatoire' }),
});

interface Classe {
  id: number;
  name: string;
  grade: string;
  academicYear?: { id: number; name: string };
  students?: any[];
  teachers?: any[];
}

export default function AdvancedClassesPage() {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');

  // Modals state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [selectedClass, setSelectedClass] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', grade: '' },
  });

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/admin/classes');
      if (!isMounted.current) return;
      startTransition(() => {
        setClasses(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      });
    } catch (error) {
      if (!isMounted.current) return;
      toast.error('Synchronisation institutionnelle échouée.');
      console.error('fetchClasses error:', error);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchClasses();
    return () => { isMounted.current = false; };
  }, [fetchClasses]);

  const handleCreateSubmit = async (values: z.infer<typeof formSchema>) => {
    const tid = toast.loading('Enregistrement de la nouvelle unité de classe...');
    try {
      await api.post('/admin/classes', values);
      toast.success('Nouvelle classe enregistrée avec succès', { id: tid });
      await fetchClasses();
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Enregistrement échoué', { id: tid });
      console.error('handleCreateSubmit error:', error);
    }
  };

  // Unique grade values for filtering
  const uniqueGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    classes.forEach(c => {
      if (c.grade) gradesSet.add(c.grade);
    });
    return Array.from(gradesSet);
  }, [classes]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.grade.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = selectedGradeFilter === 'ALL' || c.grade === selectedGradeFilter;
      return matchesSearch && matchesGrade;
    });
  }, [classes, searchTerm, selectedGradeFilter]);

  // Overall statistics
  const totalStudentsCount = useMemo(() => {
    return classes.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);
  }, [classes]);

  const totalTeachersAssigned = useMemo(() => {
    const teacherIds = new Set<number>();
    classes.forEach(c => {
      (c.teachers || []).forEach((t: any) => {
        if (t.id) teacherIds.add(t.id);
      });
    });
    return teacherIds.size;
  }, [classes]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Chargement du registre des cohortes...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8">
      {/* HEADER SECTION */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-primary">
            <Shapes size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Structure Académique</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            Unités de Classe <span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium max-w-xl">
            Cliquez sur n'importe quelle classe pour ouvrir sa fiche complète : élèves inscrits, enseignants assignés, matières dispensées et emploi du temps.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-slate-900 hover:bg-primary text-white rounded-2xl h-14 px-8 font-black transition-all shadow-xl gap-2 uppercase text-xs tracking-wider"
        >
          <Plus size={20} />
          Créer une classe
        </Button>
      </header>

      {/* SUMMARY STATS TILES */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Classes Actives</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{classes.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <School size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Élèves Enrôlés au Total</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{totalStudentsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Enseignants Mobilisés</p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">{totalTeachersAssigned}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap size={22} />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative group w-full max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <Input
            placeholder="Rechercher des classes par nom ou niveau..."
            className="h-12 pl-12 pr-4 rounded-2xl border-slate-200 shadow-sm bg-white font-bold text-slate-700 text-xs focus-visible:ring-blue-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grade Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant={selectedGradeFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setSelectedGradeFilter('ALL')}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold ${
              selectedGradeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-white'
            }`}
          >
            Tous les niveaux
          </Button>
          {uniqueGrades.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={selectedGradeFilter === g ? 'default' : 'outline'}
              onClick={() => setSelectedGradeFilter(g)}
              className={`h-9 px-3 rounded-xl text-xs font-bold ${
                selectedGradeFilter === g ? 'bg-blue-600 text-white' : 'bg-white'
              }`}
            >
              Niv. {g}
            </Button>
          ))}
        </div>
      </div>

      {/* CLASSES GRID */}
      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {filteredClasses.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                <School size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-700">Aucune classe trouvée</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Aucune classe ne correspond à votre filtre actuel. Créez une nouvelle classe ou réinitialisez la recherche.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {filteredClasses.map((c) => {
                const studentsCount = c.students?.length || 0;
                const teachersCount = c.teachers?.length || 0;

                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative group h-full"
                  >
                    {/* ACTIONS DROPDOWN */}
                    <div
                      className="absolute top-5 right-5 z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full bg-slate-50/80 hover:bg-white shadow-sm border border-slate-100 h-8 w-8"
                          >
                            <MoreVertical size={16} className="text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-1.5 shadow-xl border-slate-100 min-w-44 z-50">
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedClass(c);
                              setIsDetailModalOpen(true);
                            }}
                            className="rounded-xl font-bold text-xs p-2.5 cursor-pointer text-slate-700"
                          >
                            <Eye size={14} className="mr-2 text-blue-600" /> Fiche de la cohorte
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedClass(c);
                              setIsEditDialogOpen(true);
                            }}
                            className="rounded-xl font-bold text-xs p-2.5 cursor-pointer text-slate-700"
                          >
                            <Pencil size={14} className="mr-2 text-amber-500" /> Modifier la classe
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setSelectedClass(c);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="rounded-xl font-bold text-xs p-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                          >
                            <Trash2 size={14} className="mr-2" /> Dissoudre l'unité
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* CARD BODY - CLICKABLE */}
                    <div
                      onClick={() => {
                        setSelectedClass(c);
                        setIsDetailModalOpen(true);
                      }}
                      className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between cursor-pointer relative overflow-hidden"
                    >
                      {/* Top Accent Gradient Bar */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div>
                        {/* Landmark Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 group-hover:bg-blue-600 flex items-center justify-center text-white mb-5 transition-colors duration-300 shadow-md">
                          <Landmark size={20} />
                        </div>

                        {/* Badges */}
                        <div className="space-y-1 mb-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none rounded-lg font-black text-[9px] px-2.5 py-0.5 tracking-wider uppercase">
                              NIVEAU {c.grade}
                            </Badge>
                            {c.academicYear?.name && (
                              <Badge variant="outline" className="text-[9px] font-bold border-slate-200 text-slate-500 px-2 py-0">
                                {c.academicYear.name}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase group-hover:text-blue-600 transition-colors pr-6 mt-1">
                            {c.name}
                          </h3>
                        </div>

                        {/* Metrics Pills */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                            <Users size={14} className="text-blue-600 flex-shrink-0" />
                            <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400">Élèves</p>
                              <p className="text-xs font-black text-slate-800">{studentsCount}</p>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                            <GraduationCap size={14} className="text-indigo-600 flex-shrink-0" />
                            <div>
                              <p className="text-[9px] font-bold uppercase text-slate-400">Profs</p>
                              <p className="text-xs font-black text-slate-800">{teachersCount}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Click prompt */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                        <span className="flex items-center gap-1 text-[11px] font-bold">
                          <Eye size={13} className="text-blue-500" />
                          Consulter la cohorte
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* CLASS DETAIL MODAL (STUDENTS + TEACHERS/COURSES + TIMETABLE) */}
      <ClassDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        classId={selectedClass?.id || null}
        initialClass={selectedClass}
        locale="fr"
      />

      {/* CREATE CLASS DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-3xl p-8 border-none shadow-2xl sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tight text-slate-900 uppercase">
              Nouvelle <span className="text-primary">Unité de Classe.</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Définissez la dénomination et le niveau d'enseignement de la cohorte.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...form}>
            <form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit(handleCreateSubmit)(); }} className="space-y-5 mt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Désignation de la classe
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Exemple: 10-A Sciences"
                        {...field}
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Niveau / Grade
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Exemple: 10 ou Terminale"
                        {...field}
                        className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-xl transition-all shadow-md uppercase text-[11px] tracking-wider"
              >
                Initialiser la classe
              </Button>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {/* EDIT CLASS DIALOG */}
      {selectedClass && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="rounded-3xl p-8 border-none shadow-2xl sm:max-w-[450px] bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tight text-slate-900 uppercase">
                Modifier <span className="text-primary">l'Unité.</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Mettez à jour le libellé et le niveau de la classe sélectionnée.
              </DialogDescription>
            </DialogHeader>
            <EditClassForm
              classe={selectedClass}
              onFinished={async () => {
                setIsEditDialogOpen(false);
                await fetchClasses();
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE CLASS ALERT */}
      {selectedClass && isDeleteDialogOpen && (
        <DeleteClassAlert
          classId={selectedClass.id}
          onFinished={async () => {
            setIsDeleteDialogOpen(false);
            await fetchClasses();
          }}
          onOpenChange={setIsDeleteDialogOpen}
        />
      )}
    </div>
  );
}
