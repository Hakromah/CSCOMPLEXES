'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UserPlus,
  ShieldCheck,
  Users,
  Landmark,
  Loader2,
  X,
  Search,
  BookOpen,
  Mail,
  Hash,
  GraduationCap,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Teacher {
  id: number;
  username: string | null;
  name: string | null;
  email: string;
  userId: string | null;
  user_id: string | null;
}

interface SchoolClass {
  id: number;
  name: string;
  grade?: string | null;
  level?: string | null;
  teachers?: Teacher[];
}

// ─── Form Schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  teacherId: z.string().min(1, { message: 'Veuillez sélectionner un instructeur' }),
  classId: z.string().min(1, { message: 'Veuillez sélectionner une classe cible' }),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDisplayName(t: Teacher): string {
  return t.username || t.name || t.email;
}

function getUserId(t: Teacher): string | null {
  return t.userId || t.user_id || null;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AssignTeacherPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [removingClassId, setRemovingClassId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { teacherId: '', classId: '' },
  });

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.get<Teacher[]>('/admin/users?role=TEACHER'),
        api.get<SchoolClass[]>('/admin/classes'),
      ]);
      setTeachers(teachersRes.data || []);
      setClasses(classesRes.data || []);
    } catch {
      toast.error('Échec de la synchronisation des données administratives');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load teacher's assigned classes from API + fallback to classes state
  const loadTeacherClasses = useCallback(async (teacherId: number, currentClasses?: SchoolClass[]) => {
    setLoadingClasses(true);
    try {
      const res = await api.get<SchoolClass[]>(`/admin/teachers/${teacherId}/classes`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAssignedClasses(res.data);
      } else {
        // Fallback to local classes list populated teachers
        const clsList = currentClasses || classes;
        const matching = clsList.filter((c) =>
          c.teachers?.some((t) => Number(t.id) === Number(teacherId))
        );
        setAssignedClasses(matching);
      }
    } catch {
      // Local fallback
      const clsList = currentClasses || classes;
      const matching = clsList.filter((c) =>
        c.teachers?.some((t) => Number(t.id) === Number(teacherId))
      );
      setAssignedClasses(matching);
    } finally {
      setLoadingClasses(false);
    }
  }, [classes]);

  // ── Event Handlers ─────────────────────────────────────────────────────────

  const handleTeacherSelect = (teacher: Teacher | null) => {
    setSelectedTeacher(teacher);
    if (teacher) {
      form.setValue('teacherId', String(teacher.id));
      form.setValue('classId', '');
      loadTeacherClasses(teacher.id);
    } else {
      form.setValue('teacherId', '');
      form.setValue('classId', '');
      setAssignedClasses([]);
    }
  };

  const handleRemoveClass = async (cls: SchoolClass) => {
    if (!selectedTeacher) return;
    setRemovingClassId(cls.id);
    try {
      await api.post('/admin/unassign-teacher', {
        teacherId: selectedTeacher.id,
        classId: cls.id,
      });
      toast.success(`"${cls.name}" retiré avec succès`);
      setAssignedClasses((prev) => prev.filter((c) => c.id !== cls.id));
      // Refresh global classes in background
      api.get<SchoolClass[]>('/admin/classes').then((res) => setClasses(res.data || []));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error('Échec du retrait', { description: msg });
    } finally {
      setRemovingClassId(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Duplicate check
    const duplicate = assignedClasses.find((c) => String(c.id) === values.classId);
    if (duplicate) {
      const teacherName = selectedTeacher ? getDisplayName(selectedTeacher) : 'Ce professeur';
      toast.warning('Professeur déjà affecté', {
        description: `${teacherName} est déjà affecté à "${duplicate.name}".`,
      });
      return;
    }

    setIsLoading(true);
    const tid = toast.loading('En cours de traitement, veuillez patienter...');
    try {
      await api.post('/admin/assign-teacher', {
        teacherId: parseInt(values.teacherId),
        classId: parseInt(values.classId),
      });
      toast.success('Affectation réussie', { id: tid });
      form.setValue('classId', '');
      // Refresh classes list from server
      const updatedClassesRes = await api.get<SchoolClass[]>('/admin/classes');
      setClasses(updatedClassesRes.data || []);
      await loadTeacherClasses(parseInt(values.teacherId), updatedClassesRes.data || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.toLowerCase().includes('already') || msg?.toLowerCase().includes('déjà')) {
        toast.warning('Affectation déjà existante', { id: tid, description: msg });
      } else {
        toast.error('Affectation échouée', { id: tid, description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived State ──────────────────────────────────────────────────────────

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter((t) =>
      getDisplayName(t).toLowerCase().includes(q) ||
      (getUserId(t) ?? '').toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  // ── Loading Screen ─────────────────────────────────────────────────────────

  if (dataLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
        Chargement du registre...
      </p>
    </div>
  );

  const teacherDisplayName = selectedTeacher ? getDisplayName(selectedTeacher) : null;
  const teacherUserId = selectedTeacher ? getUserId(selectedTeacher) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-primary"
        >
          <ShieldCheck size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">
            L&apos;autorité d&apos;enregistrement
          </span>
        </motion.div>
        <h1 className="text-[clamp(1.4rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter italic uppercase">
          Professeur <span className="text-primary">Attribution.</span>
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest max-w-xl mx-auto leading-loose">
          Établir des liens entre le personnel enseignant et les registres de classes pour autoriser
          la gestion des examens.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT: Assignment Action Console ────────────────────────────── */}
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="rounded-[clamp(1rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-5">
              <div className="space-y-2">
                <h2 className="text-[clamp(16px,3vw,24px)] font-black text-slate-900 italic tracking-tight uppercase">
                  Nouvelle attribution
                </h2>
                <div className="h-1 w-12 bg-primary rounded-full" />
              </div>

              {/* Selected Teacher Indicator */}
              {selectedTeacher ? (
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <UserCheck size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Professeur cible sélectionné
                    </p>
                    <p className="font-bold text-slate-800 text-sm truncate">{teacherDisplayName}</p>
                  </div>
                  <Badge className="bg-primary text-white border-none font-black text-[9px] px-2 shrink-0">
                    Prêt
                  </Badge>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-amber-700">
                    Veuillez sélectionner un professeur dans le panneau de droite.
                  </p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                  {/* Target Class Dropdown */}
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                          Classe cible
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedTeacher}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50">
                              <SelectValue placeholder={selectedTeacher ? 'Choisir une classe cible...' : 'Sélectionnez d\'abord un professeur'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            {classes.map((c) => {
                              const alreadyAssigned = assignedClasses.some((ac) => ac.id === c.id);
                              return (
                                <SelectItem key={c.id} value={String(c.id)} className="font-bold p-3 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <span>{c.name}</span>
                                    {alreadyAssigned && (
                                      <span className="text-[9px] bg-amber-100 text-amber-600 font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                        Déjà affecté
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading || !selectedTeacher}
                    className="w-full h-14 bg-slate-900 md:hover:bg-primary text-white font-black rounded-3xl transition-all shadow-xl shadow-slate-200 uppercase text-[11px] tracking-[0.3em] group disabled:opacity-50"
                  >
                    {isLoading ? (
                      <><Loader2 className="animate-spin mr-2" size={16} /> Enregistrement...</>
                    ) : (
                      <>
                        Confirmer l&apos;affectation
                        <UserPlus className="ml-2 group-hover:scale-110 transition-transform" size={18} />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── RIGHT: Teacher Search, Profile & Dynamic Assigned Classes ──── */}
        <motion.div
          className="lg:col-span-7 space-y-5"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <Users className="text-primary" size={22} />
              <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{teachers.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corps professoral</p>
            </div>
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <Landmark className="text-primary" size={22} />
              <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{classes.length}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classes disponibles</p>
            </div>
          </div>

          {/* Main Registry Card */}
          <div className="bg-white rounded-[clamp(1rem,2vw+1rem,2rem)] p-[clamp(1rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm flex flex-col gap-5">
            
            {/* 🔍 Search & Selection on RIGHT side */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Rechercher et sélectionner un professeur
                </label>
                <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] px-2 tracking-widest uppercase">
                  Live Registry
                </Badge>
              </div>
              
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, email ou ID..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              {/* Teacher Dropdown Selector */}
              <Select
                onValueChange={(val) => {
                  const t = teachers.find((item) => String(item.id) === val) || null;
                  handleTeacherSelect(t);
                }}
                value={selectedTeacher ? String(selectedTeacher.id) : ''}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20">
                  <SelectValue placeholder="-- Choisir un professeur dans la liste --" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl max-h-64 overflow-y-auto">
                  {filteredTeachers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400 font-bold">
                      Aucun professeur trouvé pour &quot;{teacherSearch}&quot;
                    </div>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <SelectItem
                        key={teacher.id}
                        value={String(teacher.id)}
                        className="font-bold p-3 cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-800">{getDisplayName(teacher)}</span>
                          <div className="flex items-center gap-2">
                            {getUserId(teacher) && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {getUserId(teacher)}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              • {teacher.email}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Details & Assigned Classes */}
            {!selectedTeacher ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xs">
                  <BookOpen className="text-slate-300" size={28} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Aucun professeur sélectionné
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Sélectionnez un professeur ci-dessus pour afficher ses classes affectées
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Selected Teacher Profile Banner */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedTeacher.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="text-primary" size={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-slate-900 text-base leading-tight truncate">
                          {teacherDisplayName}
                        </p>
                        {teacherUserId && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Hash size={11} className="text-slate-400" />
                            <span className="text-[11px] text-slate-500 font-mono font-bold">
                              {teacherUserId}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mail size={11} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500 font-bold truncate">
                            {selectedTeacher.email}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] px-2.5 py-1 tracking-widest uppercase shrink-0">
                        Actif
                      </Badge>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Assigned Classes Header */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-[clamp(14px,2vw,18px)] font-black text-slate-900 italic tracking-tight uppercase">
                    Classes affectées
                  </h2>
                  {!loadingClasses && (
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 py-1 rounded-full">
                      {assignedClasses.length} classe{assignedClasses.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {/* Classes List */}
                {loadingClasses ? (
                  <div className="flex items-center justify-center py-10 gap-3">
                    <Loader2 className="animate-spin text-primary" size={20} />
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Chargement des classes...
                    </span>
                  </div>
                ) : assignedClasses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <BookOpen className="text-slate-300" size={28} />
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Aucune classe affectée
                      </p>
                      <p className="text-[10px] text-slate-300 font-bold mt-1">
                        Utilisez le formulaire ci-contre pour affecter une classe
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`space-y-2 pr-1 ${
                      assignedClasses.length > 4
                        ? 'max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent'
                        : ''
                    }`}
                  >
                    <AnimatePresence initial={false}>
                      {assignedClasses.map((cls) => (
                        <motion.div
                          key={cls.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <BookOpen className="text-primary" size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 text-sm truncate">{cls.name}</p>
                              {(cls.grade || cls.level) && (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  {cls.grade || cls.level}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Remove button with confirmation dialog */}
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <button
                                    disabled={removingClassId === cls.id}
                                    aria-label={`Retirer ${cls.name} du professeur ${teacherDisplayName}`}
                                    className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50 shrink-0 cursor-pointer"
                                  >
                                    {removingClassId === cls.id ? (
                                      <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                      <X size={14} />
                                    )}
                                  </button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                Retirer {cls.name}
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-black text-slate-900">
                                  Retirer l&apos;affectation ?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500">
                                  Voulez-vous retirer{' '}
                                  <strong className="text-slate-800">{cls.name}</strong> de{' '}
                                  <strong className="text-slate-800">{teacherDisplayName}</strong> ?
                                  <br />
                                  <span className="text-xs text-slate-400 mt-1 inline-block">
                                    Cette action peut être annulée en réaffectant la classe.
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-2xl font-bold cursor-pointer">
                                  Annuler
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveClass(cls)}
                                  className="rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                                >
                                  Retirer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
