/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Clock,
  BookOpen,
  Layers,
  User,
  X,
  ChevronRight,
  GraduationCap,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Building2,
  BarChart3,
  Sliders,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Users,
  Grid,
  MapPin,
  Flame,
  Zap,
  Tag,
  FileSpreadsheet,
  Printer,
  Info,
  Check,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateTimetable } from '@/lib/pdf-generator';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "LUNDI",
  TUESDAY: "MARDI",
  WEDNESDAY: "MERCREDI",
  THURSDAY: "JEUDI",
  FRIDAY: "VENDREDI",
  SATURDAY: "SAMEDI",
};

const LESSON_TYPES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REGULAR: { label: "Cours Magistral", color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  PRACTICAL: { label: "Travaux Pratiques (TP)", color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  LAB: { label: "Laboratoire", color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  TUTORIAL: { label: "Travaux Dirigés (TD)", color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  BREAK: { label: "Pause / Récréation", color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  LUNCH: { label: "Pause Déjeuner", color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  ASSEMBLY: { label: "Rassemblement", color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  EXAM: { label: "Évaluation / Examen", color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  STUDY: { label: "Étude Surveillée", color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  SPORTS: { label: "Éducation Physique / Sport", color: 'text-lime-700', bg: 'bg-lime-50', border: 'border-lime-200' },
  OTHER: { label: "Autre Activité", color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

// Standard School Period Presets
const STANDARD_SLOT_PRESETS = [
  { name: "P1 Matin (08:00 - 09:30)", start: '08:00', end: '09:30', periodName: 'Période 1' },
  { name: "P2 Matin (09:45 - 11:00)", start: '09:45', end: '11:00', periodName: 'Période 2' },
  { name: "P3 Midi (11:15 - 12:30)", start: '11:15', end: '12:30', periodName: 'Période 3' },
  { name: "P4 Après-midi (13:00 - 14:30)", start: '13:00', end: '14:30', periodName: 'Période 4' },
  { name: "P5 Après-midi (14:45 - 16:00)", start: '14:45', end: '16:00', periodName: 'Période 5' },
  { name: "P6 Fin de journée (16:15 - 17:30)", start: '16:15', end: '17:30', periodName: 'Période 6' },
];

const entrySchema = z.object({
  classId: z.string().min(1, "Classe requise"),
  subjectId: z.string().min(1, "Matière requise"),
  teacherId: z.string().optional(),
  roomId: z.string().optional(),
  roomName: z.string().optional(),
  dayOfWeek: z.string().min(1, "Jour requis"),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
  periodName: z.string().optional(),
  lessonType: z.string().min(1, "Type de cours requis"),
  notes: z.string().optional(),
});

function timeToMin(t?: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
}

function isOverlap(s1: string, e1: string, s2: string, e2: string): boolean {
  return timeToMin(s1) < timeToMin(e2) && timeToMin(e1) > timeToMin(s2);
}

function formatDuration(start: string, end: string): string {
  const diff = timeToMin(end) - timeToMin(start);
  if (diff <= 0) return "Durée invalide";
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return m + ' min';
  if (m === 0) return h + 'h';
  return h + 'h ' + m + 'm';
}

export default function TimetableManagement() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  const [selectedYearId, setSelectedYearId] = useState<string>('all');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('grid');
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [forceOverride, setForceOverride] = useState(false);

  const [liveConflicts, setLiveConflicts] = useState<any[]>([]);
  const [auditData, setAuditData] = useState<any>({ conflicts: [] });
  const [analytics, setAnalytics] = useState<any>(null);

  // Batch Duplication states
  const [dupMode, setDupMode] = useState<'DAY' | 'CLASS' | 'TERM'>('DAY');
  const [dupSourceDay, setDupSourceDay] = useState<string>('MONDAY');
  const [dupTargetDays, setDupTargetDays] = useState<string[]>(['TUESDAY']);
  const [dupSourceClass, setDupSourceClass] = useState<string>('');
  const [dupTargetClass, setDupTargetClass] = useState<string>('');
  const [dupCopyTeachers, setDupCopyTeachers] = useState<boolean>(true);
  const [dupSourceSem, setDupSourceSem] = useState<string>('');
  const [dupTargetSem, setDupTargetSem] = useState<string>('');
  const [duplicating, setDuplicating] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomBuilding, setRoomBuilding] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('40');
  const [roomType, setRoomType] = useState('CLASSROOM');

  const [slotName, setSlotName] = useState('');
  const [slotCode, setSlotCode] = useState('');
  const [slotStart, setSlotStart] = useState('08:00');
  const [slotEnd, setSlotEnd] = useState('08:50');
  const [slotType, setSlotType] = useState('LESSON');
  const [slotOrder, setSlotOrder] = useState('1');

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      classId: '',
      subjectId: '',
      teacherId: '',
      roomId: '',
      roomName: '',
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '08:55',
      periodName: 'Période 1',
      lessonType: 'REGULAR',
      notes: '',
    },
  });

  const watchedDay = form.watch('dayOfWeek');
  const watchedStart = form.watch('startTime');
  const watchedEnd = form.watch('endTime');
  const watchedTeacher = form.watch('teacherId');
  const watchedRoom = form.watch('roomId');
  const watchedClass = form.watch('classId');

  // Detect early morning hours (e.g., 01:00 AM instead of 13:00 / 1:00 PM)
  const isEarlyMorningStart = useMemo(() => {
    if (!watchedStart) return false;
    const hour = parseInt(watchedStart.split(':')[0] || '0', 10);
    return hour >= 1 && hour <= 6;
  }, [watchedStart]);

  const convertedPMTime = useMemo(() => {
    if (!watchedStart) return '13:00';
    const parts = watchedStart.split(':');
    const hour = parseInt(parts[0] || '0', 10);
    const minute = parts[1] || '00';
    const pmHour = hour + 12;
    return (pmHour < 10 ? '0' + pmHour : String(pmHour)) + ':' + minute;
  }, [watchedStart]);

  const currentDurationMinutes = useMemo(() => {
    if (!watchedStart || !watchedEnd) return 0;
    return timeToMin(watchedEnd) - timeToMin(watchedStart);
  }, [watchedStart, watchedEnd]);

  useEffect(() => {
    if (!watchedDay || !watchedStart || !watchedEnd) {
      setLiveConflicts([]);
      return;
    }
    const conflicts: any[] = [];
    const excludeId = editingEntry?.id;

    for (const item of timetable) {
      if (excludeId && item.id === excludeId) continue;
      if (item.dayOfWeek !== watchedDay) continue;
      if (!isOverlap(watchedStart, watchedEnd, item.startTime, item.endTime)) continue;

      if (watchedTeacher && item.teacher?.id && Number(watchedTeacher) === Number(item.teacher.id)) {
        const teacherName = item.teacher.name || item.teacher.username || 'Enseignant';
        const className = item.classe?.name || 'une autre classe';
        const subName = item.subject?.name || 'Matière';
        conflicts.push({
          type: 'TEACHER',
          message: "L'enseignant " + teacherName + " est déjà en cours avec " + subName + ' (' + className + ') ' + "de " + (item.startTime?.substring(0,5)) + " à " + (item.endTime?.substring(0,5)) + '.',
        });
      }

      if (watchedRoom && item.room?.id && Number(watchedRoom) === Number(item.room.id)) {
        const rName = item.room.name || 'salle';
        const className = item.classe?.name || '';
        conflicts.push({
          type: 'ROOM',
          message: "La salle " + rName + " est déjà réservée par la classe " + className + ' ' + "de " + (item.startTime?.substring(0,5)) + " à " + (item.endTime?.substring(0,5)) + '.',
        });
      }

      if (watchedClass && item.classe?.id && Number(watchedClass) === Number(item.classe.id)) {
        const className = item.classe.name || 'cette classe';
        const subName = item.subject?.name || 'cours';
        conflicts.push({
          type: 'CLASS',
          message: "La classe " + className + " a déjà le cours de " + subName + " programmé de " + (item.startTime?.substring(0,5)) + " à " + (item.endTime?.substring(0,5)) + '.',
        });
      }
    }
    setLiveConflicts(conflicts);
  }, [watchedDay, watchedStart, watchedEnd, watchedTeacher, watchedRoom, watchedClass, timetable, editingEntry]);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [tRes, cRes, sRes, uRes, rRes, tsRes, yRes, semRes] = await Promise.all([
        api.get('/admin/timetables'),
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
        api.get('/admin/users'),
        api.get('/admin/rooms').catch(() => ({ data: [] })),
        api.get('/admin/time-slots').catch(() => ({ data: [] })),
        api.get('/admin/academic-years').catch(() => api.get('/academic-years')).catch(() => ({ data: [] })),
        api.get('/admin/academic-periods').catch(() => api.get('/semesters')).catch(() => ({ data: [] })),
      ]);

      const ttList = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.data || []);
      const clsList = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.data || []);
      const subList = Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data || []);
      const usrList = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.data || []);
      const rmList = Array.isArray(rRes.data) ? rRes.data : (rRes.data?.data || []);
      const slotList = Array.isArray(tsRes.data) ? tsRes.data : (tsRes.data?.data || []);
      
      const rawYears = Array.isArray(yRes.data) ? yRes.data : (yRes.data?.data || []);
      const yearList = rawYears.map((y: any) => ({
        id: y.id,
        name: y.name || y.attributes?.name || String(y.id),
        isCurrent: y.isCurrent || y.attributes?.isCurrent || false,
      }));

      const rawSems = Array.isArray(semRes.data) ? semRes.data : (semRes.data?.data || []);
      const semList = rawSems.map((s: any) => ({
        id: s.id,
        name: s.name || s.attributes?.name || String(s.id),
      }));

      setTimetable(ttList);
      setClasses(clsList);
      setSubjects(subList);
      setRooms(rmList);
      setTimeSlots(slotList);
      setAcademicYears(yearList);
      setSemesters(semList);

      const filteredTeachers = usrList.filter((u: any) => u.schoolRole === 'TEACHER');
      setTeachers(filteredTeachers);

      // Auto-select academic year if available and not selected
      if (yearList.length > 0 && selectedYearId === 'all') {
        const active = yearList.find((y: any) => y.isCurrent) || yearList[0];
        if (active) setSelectedYearId(String(active.id));
      }

      const [anRes, auditRes] = await Promise.all([
        api.get('/admin/timetables/analytics').catch(() => ({ data: null })),
        api.post('/admin/timetables/audit', {}).catch(() => ({ data: { conflicts: [] } })),
      ]);
      setAnalytics(anRes.data);
      setAuditData(auditRes.data || { conflicts: [] });

    } catch (error) {
      console.error('Timetable sync error:', error);
      toast.error("Échec de la synchronisation des données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYearId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (classes.length > 0 && !dupSourceClass) {
      setDupSourceClass(String(classes[0].id));
      if (classes.length > 1) setDupTargetClass(String(classes[1].id));
    }
  }, [classes, dupSourceClass]);

  // Filter timetable entries according to active top-bar selectors
  const filteredTimetable = useMemo(() => {
    return timetable.filter((item) => {
      if (selectedYearId && selectedYearId !== 'all') {
        const yId = item.academicYear?.id ?? item.academicYear;
        if (yId && String(yId) !== selectedYearId) return false;
      }
      if (selectedSemesterId && selectedSemesterId !== 'all') {
        const sId = item.semester?.id ?? item.semester;
        if (sId && String(sId) !== selectedSemesterId) return false;
      }
      if (selectedClassId && selectedClassId !== 'all') {
        const cId = item.classe?.id ?? item.classe;
        if (String(cId) !== selectedClassId) return false;
      }
      if (selectedTeacherId && selectedTeacherId !== 'all') {
        const tId = item.teacher?.id ?? item.teacher;
        if (String(tId) !== selectedTeacherId) return false;
      }
      if (selectedRoomId && selectedRoomId !== 'all') {
        const rId = item.room?.id ?? item.room;
        if (String(rId) !== selectedRoomId) return false;
      }
      return true;
    });
  }, [timetable, selectedYearId, selectedSemesterId, selectedClassId, selectedTeacherId, selectedRoomId]);

  // Entries for the currently selected day
  const dayEntries = useMemo(() => {
    return filteredTimetable
      .filter((item) => item.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredTimetable, selectedDay]);

  const getEntryConflict = (entry: any) => {
    return auditData?.conflicts?.find(
      (c: any) => c.entry1?.id === entry.id || c.entry2?.id === entry.id
    );
  };

  const onSubmitEntry = async (values: z.infer<typeof entrySchema>) => {
    setSaving(true);
    const toStrapiTime = (t: string) => (t && t.length === 5 ? t + ':00' : t);

    const payload: any = {
      classe: parseInt(values.classId),
      subject: parseInt(values.subjectId),
      teacher: values.teacherId ? parseInt(values.teacherId) : null,
      room: values.roomId ? parseInt(values.roomId) : null,
      roomName: values.roomName || null,
      dayOfWeek: values.dayOfWeek,
      startTime: toStrapiTime(values.startTime),
      endTime: toStrapiTime(values.endTime),
      periodName: values.periodName || null,
      lessonType: values.lessonType || 'REGULAR',
      notes: values.notes || null,
      status: 'PUBLISHED',
      overrideConflicts: forceOverride,
      force: forceOverride,
      academicYear: selectedYearId && selectedYearId !== 'all' ? parseInt(selectedYearId) : (academicYears[0]?.id || null),
      semester: selectedSemesterId && selectedSemesterId !== 'all' ? parseInt(selectedSemesterId) : (semesters[0]?.id || null),
    };

    try {
      if (editingEntry) {
        await api.put('/admin/timetables/' + editingEntry.id, payload);
        toast.success("Session mise à jour avec succès");
      } else {
        await api.post('/admin/timetables', payload);
        toast.success("Nouvelle session ajoutée au planning");
      }
      setIsEntryDialogOpen(false);
      setIsDetailOpen(false);
      setEditingEntry(null);
      setForceOverride(false);
      fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || 'Error saving session';
      toast.error("Conflit ou erreur détectée : " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce cours du planning ?")) return;
    try {
      await api.delete('/admin/timetables/' + id);
      toast.success("Cours retiré avec succès");
      setIsDetailOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEditClick = (entry: any) => {
    setEditingEntry(entry);
    setForceOverride(false);
    form.reset({
      classId: entry.classe?.id ? String(entry.classe.id) : '',
      subjectId: entry.subject?.id ? String(entry.subject.id) : '',
      teacherId: entry.teacher?.id ? String(entry.teacher.id) : '',
      roomId: entry.room?.id ? String(entry.room.id) : '',
      roomName: entry.roomName || '',
      dayOfWeek: entry.dayOfWeek || 'MONDAY',
      startTime: entry.startTime ? entry.startTime.substring(0, 5) : '08:00',
      endTime: entry.endTime ? entry.endTime.substring(0, 5) : '08:55',
      periodName: entry.periodName || '',
      lessonType: entry.lessonType || 'REGULAR',
      notes: entry.notes || '',
    });
    setIsEntryDialogOpen(true);
  };

  // Compute smart default start/end times based on existing sessions for that day
  const handleQuickAdd = (day: string, customStart?: string, customEnd?: string) => {
    setEditingEntry(null);
    setForceOverride(false);

    const targetClassId = selectedClassId !== 'all' ? selectedClassId : (classes[0]?.id ? String(classes[0].id) : '');

    let suggestedStart = customStart || '08:00';
    let suggestedEnd = customEnd || '09:30';
    let suggestedPeriod = 'Période 1';

    if (!customStart && targetClassId) {
      const existingOnDay = timetable
        .filter(item => item.dayOfWeek === day && String(item.classe?.id || item.classe) === targetClassId)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (existingOnDay.length > 0) {
        const lastEntry = existingOnDay[existingOnDay.length - 1];
        const lastEndMin = timeToMin(lastEntry.endTime);

        if (lastEndMin <= timeToMin('09:30')) {
          suggestedStart = '09:45';
          suggestedEnd = '11:00';
          suggestedPeriod = 'Période 2';
        } else if (lastEndMin <= timeToMin('11:00')) {
          suggestedStart = '11:15';
          suggestedEnd = '12:30';
          suggestedPeriod = 'Période 3';
        } else if (lastEndMin <= timeToMin('12:45')) {
          // Afternoon start: 13:00 (1:00 PM)
          suggestedStart = '13:00';
          suggestedEnd = '14:30';
          suggestedPeriod = 'Période 4';
        } else if (lastEndMin <= timeToMin('14:30')) {
          suggestedStart = '14:45';
          suggestedEnd = '16:00';
          suggestedPeriod = 'Période 5';
        } else if (lastEndMin <= timeToMin('16:00')) {
          suggestedStart = '16:15';
          suggestedEnd = '17:30';
          suggestedPeriod = 'Période 6';
        }
      }
    }

    form.reset({
      classId: targetClassId,
      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
      teacherId: selectedTeacherId !== 'all' ? selectedTeacherId : '',
      roomId: selectedRoomId !== 'all' ? selectedRoomId : '',
      roomName: '',
      dayOfWeek: day === 'ALL' ? 'MONDAY' : day,
      startTime: suggestedStart,
      endTime: suggestedEnd,
      periodName: suggestedPeriod,
      lessonType: 'REGULAR',
      notes: '',
    });
    setIsEntryDialogOpen(true);
  };

  const handleApplyPreset = (preset: { start: string; end: string; periodName?: string }) => {
    form.setValue('startTime', preset.start);
    form.setValue('endTime', preset.end);
    if (preset.periodName) form.setValue('periodName', preset.periodName);
  };

  const handleRunDuplication = async () => {
    setDuplicating(true);
    try {
      if (dupMode === 'DAY') {
        const res = await api.post('/admin/timetables/duplicate-day', {
          sourceDay: dupSourceDay,
          targetDays: dupTargetDays,
          classId: selectedClassId !== 'all' ? Number(selectedClassId) : undefined,
          academicYearId: selectedYearId !== 'all' ? Number(selectedYearId) : undefined,
          semesterId: selectedSemesterId !== 'all' ? Number(selectedSemesterId) : undefined,
        });
        toast.success(res.data?.message || "Journée dupliquée avec succès");
      } else if (dupMode === 'CLASS') {
        if (!dupSourceClass || !dupTargetClass) {
          toast.error("Veuillez sélectionner la classe source et la classe cible");
          return;
        }
        const res = await api.post('/admin/timetables/duplicate-class', {
          sourceClassId: Number(dupSourceClass),
          targetClassId: Number(dupTargetClass),
          copyTeachers: dupCopyTeachers,
          academicYearId: selectedYearId !== 'all' ? Number(selectedYearId) : undefined,
          semesterId: selectedSemesterId !== 'all' ? Number(selectedSemesterId) : undefined,
        });
        toast.success(res.data?.message || "Emploi du temps de classe dupliqué");
      } else if (dupMode === 'TERM') {
        if (!dupSourceSem || !dupTargetSem) {
          toast.error("Veuillez sélectionner les semestres source et cible");
          return;
        }
        const res = await api.post('/admin/timetables/duplicate-term', {
          sourceSemesterId: Number(dupSourceSem),
          targetSemesterId: Number(dupTargetSem),
          academicYearId: selectedYearId !== 'all' ? Number(selectedYearId) : undefined,
        });
        toast.success(res.data?.message || "Planning semestriel dupliqué");
      }
      setIsDuplicateDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || "Échec de la duplication");
    } finally {
      setDuplicating(false);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: roomName,
        code: roomCode,
        building: roomBuilding,
        capacity: Number(roomCapacity) || 40,
        roomType: roomType,
        isActive: true,
      };
      if (editingRoom) {
        await api.put('/admin/rooms/' + editingRoom.id, payload);
        toast.success("Salle mise à jour avec succès");
      } else {
        await api.post('/admin/rooms', payload);
        toast.success("Nouvelle salle ajoutée avec succès");
      }
      setIsRoomDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de la salle");
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm("Voulez-vous supprimer cette salle ?")) return;
    try {
      await api.delete('/admin/rooms/' + id);
      toast.success("Salle supprimée");
      fetchData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: slotName,
        code: slotCode,
        startTime: slotStart,
        endTime: slotEnd,
        slotType: slotType,
        order: Number(slotOrder) || 1,
        academicYear: selectedYearId !== 'all' ? Number(selectedYearId) : undefined,
      };
      if (editingSlot) {
        await api.put('/admin/time-slots/' + editingSlot.id, payload);
        toast.success("Créneau horaire mis à jour");
      } else {
        await api.post('/admin/time-slots', payload);
        toast.success("Créneau horaire créé");
      }
      setIsSlotDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement du créneau");
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Voulez-vous supprimer ce créneau ?")) return;
    try {
      await api.delete('/admin/time-slots/' + id);
      toast.success("Créneau supprimé");
      fetchData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleExportPDF = () => {
    if (filteredTimetable.length === 0) {
      toast.error("Aucun cours trouvé pour l'export PDF");
      return;
    }
    const currentClass = classes.find(c => String(c.id) === selectedClassId);
    const className = currentClass ? currentClass.name : "Emploi du Temps Général";
    const currentYear = academicYears.find(y => String(y.id) === selectedYearId);
    const currentSem = semesters.find(s => String(s.id) === selectedSemesterId);

    try {
      const doc = generateTimetable({
        className,
        academicYear: currentYear?.name || undefined,
        semester: currentSem?.name || undefined,
        entries: filteredTimetable.map(item => ({
          day: item.dayOfWeek,
          startTime: item.startTime?.substring(0, 5) || '',
          endTime: item.endTime?.substring(0, 5) || '',
          subject: (item.subject?.name || '—') + (selectedClassId === 'all' && item.classe?.name ? ' (' + item.classe.name + ')' : ''),
          subjectCode: item.subject?.code,
          teacher: item.teacher?.name || item.teacher?.username || '—',
          room: item.room?.name || item.roomName || '—',
          lessonType: LESSON_TYPES[item.lessonType]?.label || item.lessonType,
        })),
      });
      doc.save('emploi-du-temps-' + className.toLowerCase().replace(/\s+/g, '-') + '.pdf');
      toast.success("Emploi du temps exporté en PDF avec succès");
    } catch (e: any) {
      toast.error("Échec de l'exportation PDF");
    }
  };

  const conflictCount = auditData?.conflicts?.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={42} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Synchronisation du planning...
        </p>
      </div>
    );
  }

  const selectedClassName = classes.find(c => String(c.id) === selectedClassId)?.name;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-8">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-blue-600/10 text-blue-600 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} /> Système d'Emploi du Temps Secondaire
            </Badge>
            {conflictCount > 0 && (
              <Badge className="bg-rose-600 text-white border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                <AlertTriangle size={12} /> {conflictCount} Conflits Détectés
              </Badge>
            )}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">
            Centre de Gestion des Emplois du Temps
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Planification, détection de conflits et publication des emplois du temps par classe, enseignant et salle
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => fetchData()}
            variant="outline"
            disabled={refreshing}
            className="rounded-2xl h-11 px-4 font-bold text-xs bg-white hover:bg-slate-50 border-slate-200"
          >
            <RefreshCw size={14} className={'mr-1.5 ' + (refreshing ? 'animate-spin' : '')} />
            Actualiser
          </Button>

          <Button
            onClick={() => setIsDuplicateDialogOpen(true)}
            variant="outline"
            className="rounded-2xl h-11 px-4 font-bold text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          >
            <Copy size={14} className="mr-1.5 text-blue-600" />
            Duplication & Outils Batch
          </Button>

          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="rounded-2xl h-11 px-4 font-bold text-xs bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
          >
            <Download size={14} className="mr-1.5 text-emerald-600" />
            Télécharger PDF
          </Button>

          <Button
            onClick={() => handleQuickAdd(selectedDay === 'ALL' ? 'MONDAY' : selectedDay)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 h-11 font-black text-xs shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus size={16} className="mr-1.5" /> NOUVELLE SESSION
          </Button>
        </div>
      </header>

      {/* ─── FILTERS & KPIS ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Academic Year */}
          <div className="min-w-44">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Année Académique
            </label>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/80 font-bold text-xs h-10">
                <SelectValue placeholder="Toutes les années" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold text-xs">Toutes les années</SelectItem>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={String(y.id)} className="font-bold text-xs">
                    {y.name} {y.isCurrent ? '• (' + "Active" + ')' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester / Period */}
          <div className="min-w-40">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Semestre / Période
            </label>
            <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
              <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/80 font-bold text-xs h-10">
                <SelectValue placeholder="Tous les semestres" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold text-xs">Tous les semestres</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)} className="font-bold text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter by Class */}
          <div className="min-w-40">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Filtrer par Classe
            </label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/80 font-bold text-xs h-10">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold text-xs">Toutes les classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="font-bold text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher */}
          <div className="min-w-40">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Enseignant
            </label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/80 font-bold text-xs h-10">
                <SelectValue placeholder="Tous les enseignants" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold text-xs">Tous les enseignants</SelectItem>
                {teachers.map((tch) => (
                  <SelectItem key={tch.id} value={String(tch.id)} className="font-bold text-xs">
                    {tch.name || tch.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room */}
          <div className="min-w-36">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              Salle / Espace
            </label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/80 font-bold text-xs h-10">
                <SelectValue placeholder="Toutes les salles" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="font-bold text-xs">Toutes les salles</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)} className="font-bold text-xs">
                    {r.name} {r.building ? '(' + r.building + ')' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          <div className="text-center px-2.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sessions</p>
            <p className="text-base font-black text-slate-900">{filteredTimetable.length}</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="text-center px-2.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Classes</p>
            <p className="text-base font-black text-blue-600">{classes.length}</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="text-center px-2.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salles</p>
            <p className="text-base font-black text-emerald-600">{rooms.length}</p>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-1 h-auto">
            <TabsTrigger
              value="grid"
              className="rounded-xl font-black text-xs uppercase tracking-wider py-2.5 px-5 data-[state=active]:bg-slate-950 data-[state=active]:text-white flex items-center gap-2"
            >
              <Grid size={15} /> Grille par Classe
            </TabsTrigger>
            <TabsTrigger
              value="teachers"
              className="rounded-xl font-black text-xs uppercase tracking-wider py-2.5 px-5 data-[state=active]:bg-slate-950 data-[state=active]:text-white flex items-center gap-2"
            >
              <Users size={15} /> Vue Enseignants
            </TabsTrigger>
            <TabsTrigger
              value="rooms"
              className="rounded-xl font-black text-xs uppercase tracking-wider py-2.5 px-5 data-[state=active]:bg-slate-950 data-[state=active]:text-white flex items-center gap-2"
            >
              <Building2 size={15} /> Occupation des Salles
            </TabsTrigger>
            <TabsTrigger
              value="conflicts"
              className="rounded-xl font-black text-xs uppercase tracking-wider py-2.5 px-5 data-[state=active]:bg-rose-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <AlertTriangle size={15} /> Conflits ({conflictCount})
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="rounded-xl font-black text-xs uppercase tracking-wider py-2.5 px-5 data-[state=active]:bg-slate-950 data-[state=active]:text-white flex items-center gap-2"
            >
              <Sliders size={15} /> Salles & Créneaux
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl font-black text-xs uppercase tracking-wider py-2.5 px-5 data-[state=active]:bg-slate-950 data-[state=active]:text-white flex items-center gap-2"
            >
              <BarChart3 size={15} /> Analytique & Charge
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: GRID & DAILY TIMELINE (PLACEHOLDER-FREE & SMART ORDERING)   */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="grid" className="space-y-6 mt-6">
            {/* Day Selector Pills */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedDay('ALL')}
                className={'px-5 py-2.5 rounded-2xl font-black text-xs tracking-wider transition-all cursor-pointer whitespace-nowrap ' + (
                  selectedDay === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-100 hover:text-slate-900 hover:border-blue-200'
                )}
              >
                VUE HEBDOMADAIRE COMPLÈTE
              </button>
              {DAYS.map((day) => {
                const dayCount = filteredTimetable.filter(item => item.dayOfWeek === day).length;
                const isDayActive = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={'px-5 py-2.5 rounded-2xl font-black text-xs tracking-wider transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ' + (
                      isDayActive
                        ? 'bg-slate-950 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-100 hover:text-slate-900 hover:border-slate-300'
                    )}
                  >
                    <span>{DAY_LABELS[day]}</span>
                    <span className={'text-[10px] px-1.5 py-0.2 rounded-full font-bold ' + (
                      isDayActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    )}>
                      {dayCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* FULL WEEK VIEW */}
            {selectedDay === 'ALL' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {DAYS.map((day) => {
                  const dayItems = filteredTimetable
                    .filter((item) => item.dayOfWeek === day)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  return (
                    <div
                      key={day}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                          <h3 className="font-black text-slate-900 text-xs tracking-wider uppercase">
                            {DAY_LABELS[day]}
                          </h3>
                          <Badge className="bg-slate-100 text-slate-600 font-bold text-[10px] border-none">
                            {dayItems.length}
                          </Badge>
                        </div>

                        <div className="space-y-2.5">
                          {dayItems.map((entry) => {
                            const conf = getEntryConflict(entry);
                            const lt = LESSON_TYPES[entry.lessonType] || LESSON_TYPES.REGULAR;

                            return (
                              <div
                                key={entry.id}
                                onClick={() => {
                                  setSelectedEntry(entry);
                                  setIsDetailOpen(true);
                                }}
                                className={'p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-md ' + (
                                  conf ? 'border-rose-400 bg-rose-50/70' : (lt.border + ' ' + lt.bg)
                                )}
                              >
                                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 mb-1">
                                  <span className="flex items-center gap-1 font-bold text-slate-700">
                                    <Clock size={11} className="text-blue-600" />
                                    {entry.startTime?.substring(0, 5)} - {entry.endTime?.substring(0, 5)}
                                  </span>
                                  {conf && (
                                    <span className="text-rose-600 flex items-center gap-0.5 font-black text-[9px]">
                                      <AlertTriangle size={10} /> Conflit
                                    </span>
                                  )}
                                </div>
                                <p className="font-black text-slate-900 text-xs uppercase tracking-tight line-clamp-1">
                                  {entry.subject?.name || "Matière"}
                                </p>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold mt-2">
                                  <span className="text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded-md">
                                    {entry.classe?.name || "Classe"}
                                  </span>
                                  {(entry.room?.name || entry.roomName) && (
                                    <span className="text-slate-600 flex items-center gap-0.5">
                                      <MapPin size={10} /> {entry.room?.name || entry.roomName}
                                    </span>
                                  )}
                                </div>
                                {entry.teacher && (
                                  <p className="text-[10px] text-slate-500 font-medium truncate mt-1">
                                    👨‍🏫 {entry.teacher.name || entry.teacher.username}
                                  </p>
                                )}
                              </div>
                            );
                          })}

                          {dayItems.length === 0 && (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-300 text-center">
                              <Calendar size={24} className="opacity-30 mb-1.5" />
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Aucun cours
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleQuickAdd(day)}
                        variant="ghost"
                        className="w-full mt-3 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-[11px] font-black h-8 border border-dashed border-slate-200"
                      >
                        <Plus size={13} className="mr-1" /> Ajouter
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* SINGLE DAY CHRONOLOGICAL TIMELINE (CLEAN & PLACEHOLDER-FREE) */
              <div className="space-y-4">
                {dayEntries.length === 0 ? (
                  /* BEAUTIFUL EMPTY STATE WHEN 0 ENTRIES */
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Calendar size={32} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg">
                        Aucun cours programmé pour ce jour ({DAY_LABELS[selectedDay]})
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md">
                        {selectedClassName ? ("Aucune séance n'est enregistrée pour ce jour avec les filtres actuellement sélectionnés." + ' (' + selectedClassName + ')') : "Aucune séance n'est enregistrée pour ce jour avec les filtres actuellement sélectionnés."}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleQuickAdd(selectedDay)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 h-11 font-black text-xs shadow-md shadow-blue-500/20"
                    >
                      <Plus size={16} className="mr-2" /> Programmer un cours ({DAY_LABELS[selectedDay]})
                    </Button>
                  </div>
                ) : (
                  /* LIST OF ACTUAL SCHEDULED SESSIONS FOR THIS DAY */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        {dayEntries.length} Séance(s) le {DAY_LABELS[selectedDay]} {selectedClassName ? ('• ' + selectedClassName) : ''}
                      </p>
                      <Button
                        onClick={() => handleQuickAdd(selectedDay)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3.5 h-8 font-black text-xs shadow-sm"
                      >
                        <Plus size={14} className="mr-1" /> Ajouter un cours
                      </Button>
                    </div>

                    {dayEntries.map((entry) => {
                      const conf = getEntryConflict(entry);
                      const lt = LESSON_TYPES[entry.lessonType] || LESSON_TYPES.REGULAR;
                      const duration = formatDuration(entry.startTime, entry.endTime);

                      return (
                        <div
                          key={entry.id}
                          className={'bg-white rounded-3xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ' + (
                            conf ? 'border-rose-300 bg-rose-50/40' : 'border-slate-100 hover:border-blue-200'
                          )}
                        >
                          <div className="flex items-start md:items-center gap-4">
                            {/* Time Box */}
                            <div className="px-4 py-3 rounded-2xl bg-slate-950 text-white font-mono font-black text-xs text-center min-w-[120px] shadow-sm flex-shrink-0">
                              <div className="text-sm">{entry.startTime?.substring(0, 5)} - {entry.endTime?.substring(0, 5)}</div>
                              <div className="text-[10px] text-blue-400 font-sans font-medium mt-0.5">{duration}</div>
                            </div>

                            {/* Session Info */}
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className={'text-[9px] font-black uppercase tracking-wider ' + lt.bg + ' ' + lt.color + ' ' + lt.border + ' border'}>
                                  {lt.label}
                                </Badge>
                                {entry.periodName && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {entry.periodName}
                                  </span>
                                )}
                                {conf && (
                                  <Badge className="bg-rose-600 text-white font-black text-[9px] flex items-center gap-1">
                                    <AlertTriangle size={10} /> Conflit
                                  </Badge>
                                )}
                              </div>

                              <h3 className="font-black text-slate-900 text-base uppercase tracking-tight">
                                {entry.subject?.name || "Matière"}
                                {entry.subject?.code && (
                                  <span className="text-xs font-bold text-slate-400 ml-2 font-mono">[{entry.subject.code}]</span>
                                )}
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold">
                                <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                                  <GraduationCap size={13} /> {entry.classe?.name || "Classe N/A"}
                                </span>
                                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                                  <MapPin size={13} /> {entry.room?.name || entry.roomName || "Non assignée"}
                                </span>
                                {entry.teacher && (
                                  <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100">
                                    <User size={13} /> {entry.teacher.name || entry.teacher.username}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 self-end md:self-center">
                            <Button
                              onClick={() => {
                                setSelectedEntry(entry);
                                setIsDetailOpen(true);
                              }}
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-xs font-bold h-9 px-3 border-slate-200 hover:bg-slate-50"
                            >
                              Détails
                            </Button>
                            <Button
                              onClick={() => handleEditClick(entry)}
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-xs font-bold h-9 px-3 border-slate-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit3 size={13} className="mr-1" /> Modifier
                            </Button>
                            <Button
                              onClick={() => handleDeleteEntry(entry.id)}
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-xs font-bold h-9 px-3 border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: TEACHERS                                                   */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="teachers" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => {
                const tEntries = filteredTimetable.filter((e) => e.teacher?.id === teacher.id);
                const totalMinutes = tEntries.reduce((acc, e) => acc + Math.max(0, timeToMin(e.endTime) - timeToMin(e.startTime)), 0);
                const weeklyHours = Math.round((totalMinutes / 60) * 10) / 10;
                const distinctClasses = Array.from(new Set(tEntries.map(e => e.classe?.name).filter(Boolean)));

                return (
                  <Card key={teacher.id} className="border border-slate-100 shadow-sm rounded-3xl bg-white p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-sm">
                          {teacher.username?.substring(0, 2).toUpperCase() || 'TC'}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">{teacher.name || teacher.username}</h3>
                          <p className="text-[11px] text-slate-400 font-medium">{teacher.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-100 text-purple-700 font-black text-xs border-none">
                        {weeklyHours}h/sem
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Séances programmées</span>
                        <span className="text-slate-900 font-black">{tEntries.length}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Classes prises en charge</span>
                        <span className="text-slate-900 font-black">{distinctClasses.length}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {distinctClasses.map((cls, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-100">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: ROOMS                                                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="rooms" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const rEntries = filteredTimetable.filter((e) => e.room?.id === room.id);
                const occTotal = rEntries.reduce((acc, e) => acc + Math.max(0, timeToMin(e.endTime) - timeToMin(e.startTime)), 0);
                const totalHours = Math.round((occTotal / 60) * 10) / 10;

                return (
                  <Card key={room.id} className="border border-slate-100 shadow-sm rounded-3xl bg-white p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">{room.name}</h3>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {room.building || "Bâtiment Principal"} • {room.capacity || 40} places
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 font-black text-xs border-none">
                        {totalHours}h occupée
                      </Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Code Salle</span>
                        <span className="font-mono font-bold text-slate-900">{room.code || '—'}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Séances par semaine</span>
                        <span className="text-slate-900 font-black">{rEntries.length}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: CONFLICT RESOLVER                                          */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="conflicts" className="space-y-6 mt-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Moteur d'Audit et de Détection des Conflits
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vérification automatique des chevauchements d'enseignants, collisions de salles et conflits de classe
                  </p>
                </div>
                <Badge className={conflictCount === 0 ? 'bg-emerald-600 text-white font-black text-xs px-3 py-1.5' : 'bg-rose-600 text-white font-black text-xs px-3 py-1.5'}>
                  {conflictCount === 0 ? "0 Conflit — Planning Parfait" : (conflictCount + ' ' + "Conflit(s) Actif(s)")}
                </Badge>
              </div>

              {conflictCount === 0 ? (
                <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck size={36} />
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    Aucun conflit détecté sur l'ensemble du planning
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md">
                    Tous les enseignants, salles de cours et groupes d'élèves disposent de créneaux bien disjoints.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditData.conflicts.map((conf: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-rose-600 text-white text-[10px] font-black">{conf.type}</Badge>
                          <span className="font-bold text-xs">{DAY_LABELS[conf.dayOfWeek] || conf.dayOfWeek} • {conf.startTime?.substring(0,5)} - {conf.endTime?.substring(0,5)}</span>
                        </div>
                        <p className="text-xs font-semibold">{conf.message}</p>
                      </div>
                      <Button
                        onClick={() => handleEditClick(conf.entry1 || conf.entry2)}
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-100"
                      >
                        Résoudre
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: ROOMS & SLOTS CONFIGURATION                                */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="config" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rooms Config */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase">Salles de Classe & Espaces</h3>
                    <p className="text-xs text-slate-400">Gérer les salles et capacités</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomName('');
                      setRoomCode('');
                      setRoomBuilding('');
                      setRoomCapacity('40');
                      setRoomType('CLASSROOM');
                      setIsRoomDialogOpen(true);
                    }}
                    size="sm"
                    className="rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs"
                  >
                    <Plus size={14} className="mr-1" /> Ajouter Salle
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {rooms.map((rm) => (
                    <div key={rm.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-sm">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-xs">{rm.name}</p>
                          <p className="text-[10px] text-slate-400">{rm.building || 'Principal'} • {rm.capacity || 40} places</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => {
                            setEditingRoom(rm);
                            setRoomName(rm.name);
                            setRoomCode(rm.code || '');
                            setRoomBuilding(rm.building || '');
                            setRoomCapacity(String(rm.capacity || 40));
                            setRoomType(rm.roomType || 'CLASSROOM');
                            setIsRoomDialogOpen(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-slate-600"
                        >
                          <Edit3 size={13} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteRoom(rm.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-rose-600"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {rooms.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6 italic">Aucune salle configurée</p>
                  )}
                </div>
              </div>

              {/* Time Slots Config */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm uppercase">Créneaux Horaires</h3>
                    <p className="text-xs text-slate-400">Définir les périodes de cours</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingSlot(null);
                      setSlotName('');
                      setSlotCode('');
                      setSlotStart('08:00');
                      setSlotEnd('08:50');
                      setSlotType('LESSON');
                      setSlotOrder('1');
                      setIsSlotDialogOpen(true);
                    }}
                    size="sm"
                    className="rounded-xl bg-slate-900 hover:bg-purple-600 text-white font-bold text-xs"
                  >
                    <Plus size={14} className="mr-1" /> Ajouter Créneau
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {timeSlots.map((ts) => (
                    <div key={ts.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-[11px]">
                          {ts.startTime} - {ts.endTime}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-xs">{ts.name}</p>
                          <p className="text-[10px] text-slate-500">{ts.slotType || 'LESSON'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => {
                            setEditingSlot(ts);
                            setSlotName(ts.name);
                            setSlotCode(ts.code || '');
                            setSlotStart(ts.startTime);
                            setSlotEnd(ts.endTime);
                            setSlotType(ts.slotType || 'LESSON');
                            setSlotOrder(String(ts.order || 1));
                            setIsSlotDialogOpen(true);
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-slate-600"
                        >
                          <Edit3 size={13} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteSlot(ts.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-rose-600"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {timeSlots.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6 italic">Aucun créneau configuré</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 6: ANALYTICS & WORKLOAD                                       */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="font-black text-slate-900 text-sm uppercase">Charge Horaire Enseignants</h3>
                <div className="space-y-3">
                  {(analytics?.teacherWorkloads || []).slice(0, 6).map((tw: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{tw.teacher?.name}</span>
                        <span className="text-blue-600">{tw.weeklyHours}h/sem</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: Math.min(100, (tw.weeklyHours / 25) * 100) + '%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="font-black text-slate-900 text-sm uppercase">Utilisation des Salles</h3>
                <div className="space-y-3">
                  {(analytics?.roomOccupancy || []).slice(0, 6).map((ro: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{ro.room?.name}</span>
                        <span className="text-emerald-600">{ro.utilizationRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: ro.utilizationRate + '%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="font-black text-slate-900 text-sm uppercase">Matières par Classe</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {(analytics?.classSubjectHours || []).map((cs: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <p className="font-black text-slate-900 mb-1">{cs.className}</p>
                      <div className="flex flex-wrap gap-1">
                        {cs.subjects.map((sub: any, i: number) => (
                          <span key={i} className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                            {sub.subject}: {sub.hours}h
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT TIMETABLE ENTRY (WITH QUICK PRESETS & HELPERS)   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tight uppercase">
              {editingEntry ? "Modifier" : "Nouvelle"} <span className="text-blue-600">Séance de Cours</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Configurez la classe, la matière, l'enseignant, la salle et les horaires de cours.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Slot Presets Selector */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-600" /> Créneaux Types / Raccourcis Horaires
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                Cliquez pour remplir automatiquement
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STANDARD_SLOT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={'p-2 rounded-xl border text-xs font-bold text-left transition-all ' + (
                    watchedStart === p.start && watchedEnd === p.end
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                  )}
                >
                  <div className="font-mono text-[11px]">{p.start} - {p.end}</div>
                  <div className={'text-[10px] truncate ' + (watchedStart === p.start && watchedEnd === p.end ? 'text-blue-100' : 'text-slate-500 font-medium')}>
                    {p.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Early Morning / AM-PM Warning */}
          {isEarlyMorningStart && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">
                    Heure très matinale détectée : <span className="font-mono">{watchedStart}</span> (1h du matin en format 24h)
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Vouliez-vous dire l'après-midi à <strong className="font-mono">{convertedPMTime}</strong> (13h00) ?
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  form.setValue('startTime', convertedPMTime);
                  if (timeToMin(watchedEnd) < timeToMin(convertedPMTime)) {
                    form.setValue('endTime', '14:30');
                  }
                }}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl h-8 px-3 flex-shrink-0"
              >
                Changer en {convertedPMTime} (PM)
              </Button>
            </div>
          )}

          {/* Live Conflict Warning */}
          {liveConflicts.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider text-rose-700">
                <AlertTriangle size={15} /> Alerte de Conflit Détecté
              </div>
              <div className="space-y-1 pl-1">
                {liveConflicts.map((c, i) => (
                  <p key={i} className="text-xs font-semibold flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{c.message}</span>
                  </p>
                ))}
              </div>
              <div className="pt-2 border-t border-rose-200/80 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="forceOverrideCheck"
                  checked={forceOverride}
                  onChange={(e) => setForceOverride(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
                <label htmlFor="forceOverrideCheck" className="text-xs font-bold text-rose-900 cursor-pointer">
                  Ignorer l'alerte et forcer l'enregistrement (Mode Administrateur)
                </label>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEntry)} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Class */}
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Classe *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl font-bold text-xs">
                            <SelectValue placeholder="Choisir la Classe" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)} className="font-bold text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject */}
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Matière *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl font-bold text-xs">
                            <SelectValue placeholder="Choisir la Matière" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)} className="font-bold text-xs">
                              {s.name} {s.code ? '[' + s.code + ']' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Teacher */}
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Enseignant
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl font-bold text-xs">
                            <SelectValue placeholder="Choisir un Enseignant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {teachers.map((tch) => (
                            <SelectItem key={tch.id} value={String(tch.id)} className="font-bold text-xs">
                              {tch.name || tch.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Room */}
                <FormField
                  control={form.control}
                  name="roomId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Salle / Espace
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl font-bold text-xs">
                            <SelectValue placeholder="Choisir une Salle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {rooms.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)} className="font-bold text-xs">
                              {r.name} {r.building ? '(' + r.building + ')' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Day */}
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Jour *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {DAYS.map((d) => (
                            <SelectItem key={d} value={d} className="font-bold text-xs">
                              {DAY_LABELS[d]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Début * (24h)
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="rounded-xl font-mono font-bold text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* End Time */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Fin * (24h)
                      </FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="rounded-xl font-mono font-bold text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Real-Time Duration Badge */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-600" /> Durée calculée :
                </span>
                <span className={'font-mono font-black ' + (currentDurationMinutes <= 0 || currentDurationMinutes > 300 ? 'text-rose-600' : 'text-blue-700')}>
                  {formatDuration(watchedStart, watchedEnd)} ({watchedStart} → {watchedEnd})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Lesson Type */}
                <FormField
                  control={form.control}
                  name="lessonType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Type de Cours
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl font-bold text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          {Object.entries(LESSON_TYPES).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="font-bold text-xs">
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Period Name */}
                <FormField
                  control={form.control}
                  name="periodName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Nom du Créneau (Optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Période 1, Matinée..." {...field} className="rounded-xl font-bold text-xs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEntryDialogOpen(false)}
                  className="flex-1 rounded-2xl h-12 font-black text-xs border-slate-200"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving || (liveConflicts.length > 0 && !forceOverride)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 font-black text-xs shadow-lg shadow-blue-500/20"
                >
                  {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Enregistrer la Session
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: DETAIL POPUP                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic tracking-tight uppercase">
              Détails de la <span className="text-blue-600">Séance</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Aperçu de la séance de cours programmée
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge className={'text-[10px] font-black uppercase tracking-wider ' + (LESSON_TYPES[selectedEntry.lessonType]?.bg || 'bg-blue-50') + ' ' + (LESSON_TYPES[selectedEntry.lessonType]?.color || 'text-blue-700') + ' border'}>
                  {LESSON_TYPES[selectedEntry.lessonType]?.label || "Cours"}
                </Badge>
                <span className="font-mono text-xs font-black text-slate-400">
                  {selectedEntry.startTime?.substring(0, 5)} - {selectedEntry.endTime?.substring(0, 5)}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {selectedEntry.subject?.name || "Matière"}
                </h3>
                <p className="text-xs text-blue-600 font-bold mt-1">
                  {selectedEntry.classe?.name} • {DAY_LABELS[selectedEntry.dayOfWeek]}
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Salle / Espace</span>
                  <span className="font-black text-slate-800">{selectedEntry.room?.name || selectedEntry.roomName || "Non assignée"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Enseignant</span>
                  <span className="font-black text-slate-800">{selectedEntry.teacher ? (selectedEntry.teacher.name || selectedEntry.teacher.username) : "Non assignée"}</span>
                </div>
                {selectedEntry.periodName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">Période</span>
                    <span className="font-black text-slate-800">{selectedEntry.periodName}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleEditClick(selectedEntry);
                  }}
                  className="flex-1 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-11 font-black text-xs"
                >
                  <Edit3 size={14} className="mr-1.5" /> Modifier
                </Button>
                <Button
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  variant="outline"
                  className="rounded-2xl h-11 px-4 text-rose-600 border-rose-200 hover:bg-rose-50 font-black text-xs"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: BATCH DUPLICATION                                              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
              Outils de <span className="text-blue-600">Duplication Batch</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Dupliquez des journées entières, copiez un emploi du temps de classe ou reportez un trimestre.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl my-3">
            <button
              onClick={() => setDupMode('DAY')}
              className={'flex-1 py-2 rounded-xl text-xs font-black transition-all ' + (
                dupMode === 'DAY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              )}
            >
              Dupliquer Jour
            </button>
            <button
              onClick={() => setDupMode('CLASS')}
              className={'flex-1 py-2 rounded-xl text-xs font-black transition-all ' + (
                dupMode === 'CLASS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              )}
            >
              Dupliquer Classe
            </button>
            <button
              onClick={() => setDupMode('TERM')}
              className={'flex-1 py-2 rounded-xl text-xs font-black transition-all ' + (
                dupMode === 'TERM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              )}
            >
              Dupliquer Semestre
            </button>
          </div>

          {dupMode === 'DAY' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Jour Source (à copier)
                </label>
                <Select value={dupSourceDay} onValueChange={setDupSourceDay}>
                  <SelectTrigger className="rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DAYS.map(d => <SelectItem key={d} value={d} className="font-bold text-xs">{DAY_LABELS[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Jours Cibles (qui recevront les cours)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DAYS.filter(d => d !== dupSourceDay).map(d => {
                    const isChecked = dupTargetDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          if (isChecked) setDupTargetDays(dupTargetDays.filter(x => x !== d));
                          else setDupTargetDays([...dupTargetDays, d]);
                        }}
                        className={'p-2.5 rounded-xl border text-xs font-bold transition-all text-center ' + (
                          isChecked ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        )}
                      >
                        {DAY_LABELS[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {dupMode === 'CLASS' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Classe Source
                </label>
                <Select value={dupSourceClass} onValueChange={setDupSourceClass}>
                  <SelectTrigger className="rounded-xl font-bold text-xs"><SelectValue placeholder="Choisir la Classe" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {classes.map(c => <SelectItem key={c.id} value={String(c.id)} className="font-bold text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Classe Cible
                </label>
                <Select value={dupTargetClass} onValueChange={setDupTargetClass}>
                  <SelectTrigger className="rounded-xl font-bold text-xs"><SelectValue placeholder="Choisir la Classe" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {classes.filter(c => String(c.id) !== dupSourceClass).map(c => <SelectItem key={c.id} value={String(c.id)} className="font-bold text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="copyTeachers"
                  checked={dupCopyTeachers}
                  onChange={(e) => setDupCopyTeachers(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="copyTeachers" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Copier également les enseignants assignés
                </label>
              </div>
            </div>
          )}

          {dupMode === 'TERM' && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Semestre Source
                </label>
                <Select value={dupSourceSem} onValueChange={setDupSourceSem}>
                  <SelectTrigger className="rounded-xl font-bold text-xs"><SelectValue placeholder="Tous les semestres" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {semesters.map(s => <SelectItem key={s.id} value={String(s.id)} className="font-bold text-xs">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Semestre Cible
                </label>
                <Select value={dupTargetSem} onValueChange={setDupTargetSem}>
                  <SelectTrigger className="rounded-xl font-bold text-xs"><SelectValue placeholder="Tous les semestres" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {semesters.filter(s => String(s.id) !== dupSourceSem).map(s => <SelectItem key={s.id} value={String(s.id)} className="font-bold text-xs">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
              className="flex-1 rounded-2xl h-12 font-black text-xs"
            >
              Annuler
            </Button>
            <Button
              onClick={handleRunDuplication}
              disabled={duplicating}
              className="flex-1 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl h-12 font-black text-xs shadow-lg"
            >
              {duplicating ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Exécuter la Duplication
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ROOM CREATE / EDIT                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
              {editingRoom ? "Modifier" : "Nouvelle"} <span className="text-blue-600">Salle de Classe</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRoom} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Nom de la Salle *
              </label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} required placeholder="Salle 101, Labo SVT..." className="rounded-xl font-bold text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Code / Abréviation
              </label>
              <Input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="S101, LAB-1..." className="rounded-xl font-bold text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Bâtiment / Aile
              </label>
              <Input value={roomBuilding} onChange={(e) => setRoomBuilding(e.target.value)} placeholder="Bâtiment Principal, Aile Scientifique..." className="rounded-xl font-bold text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Capacité (nombre d'élèves)
              </label>
              <Input type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} className="rounded-xl font-bold text-xs" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRoomDialogOpen(false)} className="flex-1 rounded-2xl h-11 font-black text-xs">Annuler</Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 font-black text-xs">Enregistrer la Session</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: TIME SLOT CREATE / EDIT                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
              {editingSlot ? "Modifier" : "Nouvelle"} <span className="text-purple-600">Créneau Horaire</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveSlot} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Nom du Créneau *
              </label>
              <Input value={slotName} onChange={(e) => setSlotName(e.target.value)} required placeholder="Période 1, Pause Déjeuner..." className="rounded-xl font-bold text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Début *
                </label>
                <Input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} required className="rounded-xl font-bold text-xs" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Fin *
                </label>
                <Input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} required className="rounded-xl font-bold text-xs" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Type de Créneau
              </label>
              <Select value={slotType} onValueChange={setSlotType}>
                <SelectTrigger className="rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="LESSON" className="font-bold text-xs">Cours Régulier</SelectItem>
                  <SelectItem value="BREAK" className="font-bold text-xs">Pause Récréation</SelectItem>
                  <SelectItem value="LUNCH" className="font-bold text-xs">Pause Déjeuner</SelectItem>
                  <SelectItem value="ASSEMBLY" className="font-bold text-xs">Rassemblement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSlotDialogOpen(false)} className="flex-1 rounded-2xl h-11 font-black text-xs">Annuler</Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-11 font-black text-xs">Enregistrer la Session</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
