'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UserPlus,
  ShieldCheck,
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

interface Student {
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
  students?: Student[];
}

// ─── Form Schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  studentId: z.string().min(1, { message: "Choisir un étudiant pour l'inscription" }),
  classId: z.string().min(1, { message: 'Veuillez sélectionner une classe cible' }),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDisplayName(s: Student): string {
  return s.username || s.name || s.email;
}

function getUserId(s: Student): string | null {
  return s.userId || s.user_id || null;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function AssignStudentPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [removingClassId, setRemovingClassId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { studentId: '', classId: '' },
  });

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get<Student[]>('/admin/users?role=STUDENT'),
        api.get<SchoolClass[]>('/admin/classes'),
      ]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch {
      toast.error('Échec de la synchronisation du registre des étudiants');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadStudentClasses = useCallback(async (studentId: number, currentClasses?: SchoolClass[]) => {
    setLoadingClasses(true);
    try {
      const res = await api.get<SchoolClass[]>(`/admin/students/${studentId}/classes`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setAssignedClasses(res.data);
      } else {
        const clsList = currentClasses || classes;
        const matching = clsList.filter((c) =>
          c.students?.some((s) => Number(s.id) === Number(studentId))
        );
        setAssignedClasses(matching);
      }
    } catch {
      const clsList = currentClasses || classes;
      const matching = clsList.filter((c) =>
        c.students?.some((s) => Number(s.id) === Number(studentId))
      );
      setAssignedClasses(matching);
    } finally {
      setLoadingClasses(false);
    }
  }, [classes]);

  // ── Event Handlers ─────────────────────────────────────────────────────────

  const handleStudentSelect = (student: Student | null) => {
    setSelectedStudent(student);
    if (student) {
      form.setValue('studentId', String(student.id));
      form.setValue('classId', '');
      loadStudentClasses(student.id);
    } else {
      form.setValue('studentId', '');
      form.setValue('classId', '');
      setAssignedClasses([]);
    }
  };

  const handleRemoveClass = async (cls: SchoolClass) => {
    if (!selectedStudent) return;
    setRemovingClassId(cls.id);
    try {
      await api.post('/admin/unassign-student', {
        studentId: selectedStudent.id,
        classId: cls.id,
      });
      toast.success(`"${cls.name}" retiré avec succès`);
      setAssignedClasses((prev) => prev.filter((c) => c.id !== cls.id));
      api.get<SchoolClass[]>('/admin/classes').then((res) => setClasses(res.data || []));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error('Échec du retrait', { description: msg });
    } finally {
      setRemovingClassId(null);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const duplicate = assignedClasses.find((c) => String(c.id) === values.classId);
    if (duplicate) {
      const studentName = selectedStudent ? getDisplayName(selectedStudent) : 'Cet étudiant';
      toast.warning('Étudiant déjà inscrit', {
        description: `${studentName} est déjà inscrit dans "${duplicate.name}".`,
      });
      return;
    }

    setIsLoading(true);
    const tid = toast.loading("Traitement de l'inscription...");
    try {
      await api.post('/admin/assign-student', {
        studentId: parseInt(values.studentId),
        classId: parseInt(values.classId),
      });
      toast.success('Inscription finalisée', { id: tid });
      form.setValue('classId', '');
      const updatedClassesRes = await api.get<SchoolClass[]>('/admin/classes');
      setClasses(updatedClassesRes.data || []);
      await loadStudentClasses(parseInt(values.studentId), updatedClassesRes.data || []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.toLowerCase().includes('already') || msg?.toLowerCase().includes('déjà')) {
        toast.warning('Inscription déjà existante', { id: tid, description: msg });
      } else {
        toast.error('Inscription échouée', { id: tid, description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived State ──────────────────────────────────────────────────────────

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) =>
      getDisplayName(s).toLowerCase().includes(q) ||
      (getUserId(s) ?? '').toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  // ── Loading Screen ─────────────────────────────────────────────────────────

  if (dataLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
        Chargement des données académiques...
      </p>
    </div>
  );

  const studentDisplayName = selectedStudent ? getDisplayName(selectedStudent) : null;
  const studentUserId = selectedStudent ? getUserId(selectedStudent) : null;

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
        <h1 className="text-[clamp(1.2rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter italic uppercase">
          Inscription <span className="text-primary">des étudiants</span>
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest max-w-2xl mx-auto leading-loose">
          Attribuer des étudiants à leurs groupes universitaires respectifs pour activer la
          synchronisation des horaires et le suivi des notes.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-[clamp(1rem,2vw+1rem,2rem)] items-start">

        {/* ── LEFT: Assignment Console ──────────────────────────────────── */}
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="rounded-[clamp(1rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-5">
              <div className="space-y-2">
                <h2 className="text-[clamp(1rem,3vw,4rem)] font-black text-slate-900 italic tracking-tight uppercase">
                  Console d&apos;inscription
                </h2>
                <div className="h-1.5 w-16 bg-blue-600 rounded-full" />
              </div>

              {/* Selected Student Indicator */}
              {selectedStudent ? (
                <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <UserCheck size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Étudiant sélectionné
                    </p>
                    <p className="font-bold text-slate-800 text-sm truncate">{studentDisplayName}</p>
                  </div>
                  <Badge className="bg-primary text-white border-none font-black text-[9px] px-2 shrink-0">
                    Prêt
                  </Badge>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-xs font-bold text-amber-700">
                    Veuillez sélectionner un étudiant dans le panneau de droite.
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
                          disabled={!selectedStudent}
                        >
                          <FormControl>
                            <SelectTrigger className="h-16 rounded-2xl max-md:rounded-xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20 disabled:opacity-50">
                              <SelectValue placeholder={selectedStudent ? 'Identifier le groupe cible...' : 'Sélectionnez d\'abord un étudiant'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl max-md:rounded-xl border-slate-100 shadow-2xl">
                            {classes.map((c) => {
                              const alreadyAssigned = assignedClasses.some((ac) => ac.id === c.id);
                              return (
                                <SelectItem key={c.id} value={String(c.id)} className="font-bold p-3 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <span>{c.name}</span>
                                    {alreadyAssigned && (
                                      <span className="text-[9px] bg-amber-100 text-amber-600 font-black px-2 py-0.5 rounded-full uppercase shrink-0">
                                        Déjà inscrit
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
                    disabled={isLoading || !selectedStudent}
                    className="w-full h-14 bg-slate-900 md:hover:bg-primary text-white font-black rounded-3xl transition-all shadow-xl shadow-slate-200 uppercase text-[11px] tracking-[0.3em] group disabled:opacity-50"
                  >
                    {isLoading ? (
                      <><Loader2 className="animate-spin mr-2" size={16} /> Traitement...</>
                    ) : (
                      <>
                        VALIDER L&apos;INSCRIPTION
                        <UserPlus className="ml-2 group-hover:scale-110 transition-transform" size={18} />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── RIGHT: Student Search, Profile & Dynamic Assigned Classes ──── */}
        <motion.div
          className="lg:col-span-7 flex flex-col gap-5"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2 group md:hover:bg-primary transition-all duration-500">
              <GraduationCap className="text-primary group-hover:text-white transition-colors" size={24} />
              <p className="text-4xl font-black text-slate-900 tracking-tighter italic group-hover:text-white transition-colors">
                {students.length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-100 transition-colors">
                Total Étudiants
              </p>
            </div>
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2 group md:hover:bg-primary transition-all duration-500">
              <Landmark className="text-primary group-hover:text-white transition-colors" size={24} />
              <p className="text-4xl font-black text-slate-900 tracking-tighter italic group-hover:text-white transition-colors">
                {classes.length}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-100 transition-colors">
                Groupes d&apos;études
              </p>
            </div>
          </div>

          {/* Main Registry Card */}
          <div className="bg-white rounded-[clamp(1rem,2vw+1rem,2rem)] p-[clamp(1rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm flex flex-col gap-5">
            
            {/* 🔍 Search & Selection on RIGHT side */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Rechercher et sélectionner un étudiant
                </label>
                <Badge className="bg-blue-100 text-primary border-none font-black text-[9px] px-2 tracking-widest uppercase">
                  Système vérifié
                </Badge>
              </div>
              
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, email ou ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-10 h-12 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>

              {/* Student Dropdown Selector */}
              <Select
                onValueChange={(val) => {
                  const s = students.find((item) => String(item.id) === val) || null;
                  handleStudentSelect(s);
                }}
                value={selectedStudent ? String(selectedStudent.id) : ''}
              >
                <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20">
                  <SelectValue placeholder="-- Choisir un étudiant dans la liste --" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-md:rounded-xl border-slate-100 shadow-2xl max-h-64 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400 font-bold">
                      Aucun étudiant trouvé pour &quot;{studentSearch}&quot;
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <SelectItem
                        key={student.id}
                        value={String(student.id)}
                        className="font-bold p-3 cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-800">{getDisplayName(student)}</span>
                          <div className="flex items-center gap-2">
                            {getUserId(student) && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {getUserId(student)}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              • {student.email}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Student Details & Assigned Classes */}
            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xs">
                  <BookOpen className="text-slate-300" size={28} />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Aucun étudiant sélectionné
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    Sélectionnez un étudiant ci-dessus pour afficher ses inscriptions
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Selected Student Profile Banner */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedStudent.id}
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
                          {studentDisplayName}
                        </p>
                        {studentUserId && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Hash size={11} className="text-slate-400" />
                            <span className="text-[11px] text-slate-500 font-mono font-bold">
                              {studentUserId}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Mail size={11} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500 font-bold truncate">
                            {selectedStudent.email}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-primary border-none font-black text-[9px] px-2.5 py-1 tracking-widest uppercase shrink-0">
                        Étudiant
                      </Badge>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Assigned Classes Header */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-[clamp(14px,2vw,18px)] font-black text-slate-900 italic tracking-tight uppercase">
                    Classes inscrites
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
                        Aucune inscription trouvée
                      </p>
                      <p className="text-[10px] text-slate-300 font-bold mt-1">
                        Utilisez le formulaire ci-contre pour inscrire cet étudiant
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
                                    aria-label={`Retirer ${cls.name} de l'étudiant ${studentDisplayName}`}
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
                                  Retirer l&apos;inscription ?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500">
                                  Voulez-vous retirer{' '}
                                  <strong className="text-slate-800">{studentDisplayName}</strong> de la
                                  classe{' '}
                                  <strong className="text-slate-800">{cls.name}</strong> ?
                                  <br />
                                  <span className="text-xs text-slate-400 mt-1 inline-block">
                                    Cette action peut être annulée en réinscrivant l&apos;étudiant.
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
