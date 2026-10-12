/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Mail,
  Hash,
  School,
  Trash2,
  Filter,
  Check,
  RefreshCw,
  Layers,
  Award,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Teacher {
  id: number;
  userId?: string | null;
  user_id?: string | null;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  schoolRole?: string;
  gender?: string | null;
  phoneNumber?: string | null;
}

interface SchoolClass {
  id: number;
  name: string;
  grade?: string | null;
  level?: string | null;
  teachers?: Teacher[];
  academicYear?: { id: number; name: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeArray<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) {
    return data.data.map((item: any) => {
      if (item && typeof item === 'object' && item.attributes) {
        return { id: item.id, documentId: item.documentId, ...item.attributes };
      }
      return item;
    });
  }
  return [];
}

function getTeacherFullName(t: Teacher): string {
  if (t.firstName || t.lastName) {
    return `${t.firstName || ''} ${t.lastName || ''}`.trim();
  }
  return t.username || t.email;
}

function getTeacherId(t: Teacher): string {
  return t.userId || t.user_id || `ENS-${t.id}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssignTeacherPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Engine & Filters
  const [teacherSearch, setTeacherSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Form State
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState<SchoolClass[]>([]);
  const [loadingTeacherClasses, setLoadingTeacherClasses] = useState(false);
  const [unassigningId, setUnassigningId] = useState<number | null>(null);

  // Class Roster Explorer Tab State
  const [rosterClassId, setRosterClassId] = useState<string>('all');
  const [rosterSearch, setRosterSearch] = useState('');

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.get('/admin/users?role=TEACHER'),
        api.get('/admin/classes'),
      ]);

      // Strict role filtering: Ensure ONLY users with schoolRole TEACHER are listed
      const rawTeachers = normalizeArray<Teacher>(teachersRes.data);
      const strictTeachers = rawTeachers.filter((u: any) => {
        const sr = (u.schoolRole || '').toUpperCase();
        return sr === 'TEACHER' || sr === 'ENSEIGNANT' || sr === 'PROFESSEUR';
      });

      const rawClasses = normalizeArray<SchoolClass>(classesRes.data);

      setTeachers(strictTeachers);
      setClasses(rawClasses);

      if (rawClasses.length > 0 && rosterClassId === 'all') {
        setRosterClassId(String(rawClasses[0].id));
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      toast.error('Échec de synchronisation des enseignants et des classes');
    } finally {
      setLoading(false);
    }
  }, [rosterClassId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Fetch Teacher's Assigned Classes ───────────────────────────────────────

  const loadTeacherClasses = useCallback(
    async (teacherId: number) => {
      setLoadingTeacherClasses(true);
      try {
        const res = await api.get(`/admin/teachers/${teacherId}/classes`);
        const resClasses = normalizeArray<SchoolClass>(res.data);
        if (resClasses.length > 0) {
          setAssignedClasses(resClasses);
        } else {
          // Fallback from local classes list
          const localMatch = classes.filter((c) =>
            c.teachers?.some((t) => Number(t.id) === Number(teacherId))
          );
          setAssignedClasses(localMatch);
        }
      } catch {
        const localMatch = classes.filter((c) =>
          c.teachers?.some((t) => Number(t.id) === Number(teacherId))
        );
        setAssignedClasses(localMatch);
      } finally {
        setLoadingTeacherClasses(false);
      }
    },
    [classes]
  );

  const handleSelectTeacher = (t: Teacher) => {
    setSelectedTeacher(t);
    setTargetClassId('');
    loadTeacherClasses(t.id);
  };

  // ─── Assign Teacher to Class ────────────────────────────────────────────────

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !targetClassId) {
      toast.warning('Veuillez sélectionner un enseignant et une classe cible.');
      return;
    }

    const alreadyInClass = assignedClasses.some((c) => String(c.id) === targetClassId);
    if (alreadyInClass) {
      const clsName = classes.find((c) => String(c.id) === targetClassId)?.name || 'cette classe';
      toast.warning('Enseignant déjà affecté', {
        description: `${getTeacherFullName(selectedTeacher)} est déjà affecté à "${clsName}".`,
      });
      return;
    }

    setAssigning(true);
    const tid = toast.loading("Affectation de l'enseignant en cours...");
    try {
      await api.post('/admin/assign-teacher', {
        teacherId: selectedTeacher.id,
        classId: parseInt(targetClassId),
      });

      toast.success("Enseignant affecté avec succès à la classe!", { id: tid });
      setTargetClassId('');

      // Refresh classes and teacher assignments
      const updatedClassesRes = await api.get('/admin/classes');
      const updatedClasses = normalizeArray<SchoolClass>(updatedClassesRes.data);
      setClasses(updatedClasses);

      await loadTeacherClasses(selectedTeacher.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'affectation";
      toast.error("Échec de l'affectation", { id: tid, description: msg });
    } finally {
      setAssigning(false);
    }
  };

  // ─── Unassign Teacher from Class ────────────────────────────────────────────

  const handleUnassignTeacher = async (clsId: number, teacherIdToUnassign?: number) => {
    const tId = teacherIdToUnassign || selectedTeacher?.id;
    if (!tId) return;

    setUnassigningId(clsId);
    const tid = toast.loading('Retrait de la classe...');
    try {
      await api.post('/admin/unassign-teacher', {
        teacherId: tId,
        classId: clsId,
      });

      toast.success("Enseignant retiré de la classe avec succès", { id: tid });

      // Refresh local states
      setAssignedClasses((prev) => prev.filter((c) => c.id !== clsId));

      const updatedClassesRes = await api.get('/admin/classes');
      const updatedClasses = normalizeArray<SchoolClass>(updatedClassesRes.data);
      setClasses(updatedClasses);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erreur lors du retrait';
      toast.error('Échec du retrait', { id: tid, description: msg });
    } finally {
      setUnassigningId(null);
    }
  };

  // ─── Filtered Teachers List (Search Engine) ─────────────────────────────────

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    return teachers.filter((t) => {
      const fullName = getTeacherFullName(t).toLowerCase();
      const matricule = getTeacherId(t).toLowerCase();
      const email = t.email.toLowerCase();

      const matchQuery = !q || fullName.includes(q) || matricule.includes(q) || email.includes(q);

      // Teacher assigned count
      const assignedCount = classes.filter((c) =>
        c.teachers?.some((tch) => Number(tch.id) === Number(t.id))
      ).length;

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNASSIGNED' && assignedCount === 0) ||
        (statusFilter === 'ASSIGNED' && assignedCount > 0);

      return matchQuery && matchStatus;
    });
  }, [teachers, teacherSearch, statusFilter, classes]);

  // ─── Metrics ────────────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const total = teachers.length;
    const assignedCount = teachers.filter((t) =>
      classes.some((c) => c.teachers?.some((tch) => Number(tch.id) === Number(t.id)))
    ).length;
    const unassignedCount = total - assignedCount;

    return {
      total,
      assignedCount,
      unassignedCount,
      totalClasses: classes.length,
    };
  }, [teachers, classes]);

  // ─── Class Staff for Explorer Tab ───────────────────────────────────────────

  const activeRosterClass = useMemo(() => {
    return classes.find((c) => String(c.id) === rosterClassId) || null;
  }, [classes, rosterClassId]);

  const rosterTeachers = useMemo(() => {
    if (!activeRosterClass || !activeRosterClass.teachers) return [];
    const q = rosterSearch.toLowerCase().trim();
    return activeRosterClass.teachers.filter((t) => {
      if (!q) return true;
      const name = getTeacherFullName(t).toLowerCase();
      const mat = getTeacherId(t).toLowerCase();
      const email = t.email.toLowerCase();
      return name.includes(q) || mat.includes(q) || email.includes(q);
    });
  }, [activeRosterClass, rosterSearch]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ─── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Attribution des Enseignants
                </h1>
                <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-bold border-indigo-200">
                  Corps Professoral
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Affecter les professeurs aux classes pédagogiques et gérer la charge d&apos;enseignement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-9 rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* ─── Metrics Strip ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Total Enseignants</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.total}
            </div>
            <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
              Professeurs validés uniquement
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Avec Classes</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.assignedCount}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
              Affectés à au moins 1 classe
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Sans Classe</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.unassignedCount}
            </div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">
              En attente d&apos;attribution
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Classes Actives</span>
              <School className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalClasses}
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-0.5">
              Groupes d&apos;enseignement
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Tabs ──────────────────────────────────────────────────────── */}
      <Tabs defaultValue="assignment" className="space-y-4">
        <TabsList className="bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-2xl grid grid-cols-2 max-w-md border border-slate-200 dark:border-slate-800">
          <TabsTrigger
            value="assignment"
            className="gap-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-indigo-600" /> Console d&apos;Attribution
          </TabsTrigger>
          <TabsTrigger
            value="roster"
            className="gap-2 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-xs"
          >
            <Layers className="w-4 h-4 text-blue-600" /> Corps Professoral par Classe
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: CONSOLE D'ATTRIBUTION & MOTEUR DE RECHERCHE ───────────── */}
        <TabsContent value="assignment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 🔍 SEARCH ENGINE & TEACHER SELECTION PANEL (Left 7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                        Moteur de Recherche des Enseignants
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Sélectionnez un professeur pour consulter ses affectations et ajouter de nouvelles classes.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5 w-fit">
                      {filteredTeachers.length} enseignant(s)
                    </Badge>
                  </div>

                  {/* Search Input Bar */}
                  <div className="mt-3 relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Rechercher par nom, matricule ou email..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="pl-10 h-10 rounded-xl bg-white dark:bg-slate-900 text-xs font-medium border-slate-200 dark:border-slate-700"
                    />
                    {teacherSearch && (
                      <button
                        onClick={() => setTeacherSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Button
                      variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('ALL')}
                      className={`h-7 px-3 text-[11px] rounded-lg font-bold ${
                        statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : ''
                      }`}
                    >
                      Tous ({teachers.length})
                    </Button>
                    <Button
                      variant={statusFilter === 'UNASSIGNED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('UNASSIGNED')}
                      className={`h-7 px-3 text-[11px] rounded-lg font-bold ${
                        statusFilter === 'UNASSIGNED' ? 'bg-amber-600 text-white' : ''
                      }`}
                    >
                      Sans classe ({metrics.unassignedCount})
                    </Button>
                    <Button
                      variant={statusFilter === 'ASSIGNED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter('ASSIGNED')}
                      className={`h-7 px-3 text-[11px] rounded-lg font-bold ${
                        statusFilter === 'ASSIGNED' ? 'bg-emerald-600 text-white' : ''
                      }`}
                    >
                      Avec classes ({metrics.assignedCount})
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-3 max-h-[500px] overflow-y-auto space-y-2">
                  {filteredTeachers.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-500">
                        Aucun enseignant ne correspond à votre recherche.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Seuls les comptes ayant le rôle officiel &quot;TEACHER&quot; sont listés ici.
                      </p>
                    </div>
                  ) : (
                    filteredTeachers.map((teacher) => {
                      const isSelected = selectedTeacher?.id === teacher.id;
                      const assignedCount = classes.filter((c) =>
                        c.teachers?.some((tch) => Number(tch.id) === Number(teacher.id))
                      ).length;

                      return (
                        <div
                          key={teacher.id}
                          onClick={() => handleSelectTeacher(teacher)}
                          className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {getTeacherFullName(teacher).charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                                  {getTeacherFullName(teacher)}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="font-mono text-[10px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                >
                                  {getTeacherId(teacher)}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {teacher.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {assignedCount > 0 ? (
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 text-[10px] font-bold">
                                {assignedCount} classe(s)
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 text-[10px] font-bold">
                                Sans classe
                              </Badge>
                            )}

                            {isSelected && (
                              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 🎯 TARGET CLASS ASSIGNMENT & DOSSIER PANEL (Right 5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Action d&apos;Affectation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Affectez l&apos;enseignant sélectionné à une classe cible.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-5">
                  {!selectedTeacher ? (
                    <div className="py-12 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto shadow-xs">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Aucun enseignant sélectionné
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                          Veuillez choisir un enseignant dans la liste à gauche pour gérer ses classes.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Selected Teacher Banner */}
                      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                              Enseignant sélectionné
                            </div>
                            <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                              {getTeacherFullName(selectedTeacher)}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Matricule: {getTeacherId(selectedTeacher)}
                            </div>
                          </div>
                          <Badge className="bg-indigo-600 text-white font-bold text-[10px]">
                            Prêt
                          </Badge>
                        </div>
                      </div>

                      {/* Currently Assigned Classes */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            Classes assignées ({assignedClasses.length})
                          </span>
                          {loadingTeacherClasses && (
                            <span className="text-[10px] text-slate-400 animate-pulse">
                              Chargement...
                            </span>
                          )}
                        </div>

                        {assignedClasses.length === 0 ? (
                          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                            Cet enseignant n&apos;a encore aucune classe attribuée.
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {assignedClasses.map((cls) => (
                              <div
                                key={cls.id}
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <School className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                    {cls.name}
                                  </span>
                                  {cls.grade && (
                                    <span className="text-[10px] text-slate-400">
                                      ({cls.grade})
                                    </span>
                                  )}
                                </div>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={unassigningId === cls.id}
                                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-base font-extrabold">
                                        Retirer de la classe ?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-xs">
                                        Êtes-vous sûr de vouloir retirer{' '}
                                        <strong>{getTeacherFullName(selectedTeacher)}</strong> de la
                                        classe <strong>{cls.name}</strong> ?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl text-xs">
                                        Annuler
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleUnassignTeacher(cls.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                                      >
                                        Confirmer le retrait
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Select Target Class Form */}
                      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          Sélectionner la classe à affecter <span className="text-red-500">*</span>
                        </label>
                        <Select value={targetClassId} onValueChange={setTargetClassId}>
                          <SelectTrigger className="w-full h-10 rounded-xl text-xs font-medium">
                            <SelectValue placeholder="Choisir une classe..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 rounded-xl">
                            {classes.map((c) => {
                              const alreadyIn = assignedClasses.some((ac) => ac.id === c.id);
                              return (
                                <SelectItem
                                  key={c.id}
                                  value={String(c.id)}
                                  disabled={alreadyIn}
                                  className="text-xs font-medium"
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span>{c.name}</span>
                                    {alreadyIn && (
                                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                                        Déjà affecté
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={handleAssignTeacher}
                          disabled={assigning || !targetClassId}
                          className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 shadow-md shadow-indigo-500/20"
                        >
                          <UserPlus className="w-4 h-4" />
                          {assigning ? 'Affectation en cours...' : 'Affecter à cette classe'}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: CORPS PROFESSORAL PAR CLASSE ─────────────────────────────── */}
        <TabsContent value="roster" className="space-y-4">
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="py-4 px-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                    Enseignants par Classe
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Consultez les enseignants affectés à chaque groupe pédagogique.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Select value={rosterClassId} onValueChange={setRosterClassId}>
                    <SelectTrigger className="w-48 h-9 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Choisir une classe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} ({c.teachers?.length || 0} profs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Filtrer dans la classe..."
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      className="pl-8 h-9 w-44 rounded-xl text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {rosterTeachers.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">
                    Aucun enseignant affecté à cette classe pour le moment.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Utilisez l&apos;onglet &quot;Console d&apos;Attribution&quot; pour assigner des professeurs.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-800/60">
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-slate-500">#</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500">Enseignant & Matricule</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500">Email</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500">Classe Affectée</TableHead>
                      <TableHead className="text-right pr-6 text-xs font-bold text-slate-500">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rosterTeachers.map((tch, idx) => (
                      <TableRow key={tch.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-6 py-3 text-xs font-bold text-slate-400">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {getTeacherFullName(tch)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {getTeacherId(tch)}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-slate-600 dark:text-slate-300">
                          {tch.email}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-indigo-600">
                          {activeRosterClass?.name}
                        </TableCell>
                        <TableCell className="text-right pr-6 py-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Retirer
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-base font-extrabold">
                                  Retirer cet enseignant de la classe ?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs">
                                  Confirmez le retrait de{' '}
                                  <strong>{getTeacherFullName(tch)}</strong> de la classe{' '}
                                  <strong>{activeRosterClass?.name}</strong>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl text-xs">
                                  Annuler
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleUnassignTeacher(Number(rosterClassId), tch.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                                >
                                  Retirer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
