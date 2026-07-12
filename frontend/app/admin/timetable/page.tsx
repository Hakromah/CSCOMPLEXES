/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'LUNDI',
  TUESDAY: 'MARDI',
  WEDNESDAY: 'MERCREDI',
  THURSDAY: 'JEUDI',
  FRIDAY: 'VENDREDI',
};

const formSchema = z.object({
  classId: z.string().min(1, 'Classe requise'),
  subjectId: z.string().min(1, 'Matière requise'),
  teacherId: z.string().optional(),
  dayOfWeek: z.string().min(1, 'Jour requis'),
  startTime: z.string().min(1, 'Heure de début requise'),
  endTime: z.string().min(1, 'Heure de fin requise'),
});

export default function TimetableManagement() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string>('MONDAY');
  const [semesterText, setSemesterText] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: '',
      subjectId: '',
      teacherId: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    },
  });

  const getDynamicSemester = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const semester = month >= 1 && month <= 7 ? 2 : 1;
    const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return 'Semestre ' + semester + ', ' + capitalizedMonth + ' - Année ' + year;
  };

  const fetchData = async () => {
    try {
      const [tRes, cRes, sRes, uRes] = await Promise.all([
        api.get('/admin/timetables'),
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
        api.get('/admin/users'),
      ]);
      setTimetable(tRes.data);
      setClasses(cRes.data);
      setSubjects(sRes.data);
      const filteredTeachers = (uRes.data || []).filter(
        (u: any) => u.schoolRole === 'TEACHER'
      );
      setTeachers(filteredTeachers);
    } catch (error) {
      toast.error('Échec de la synchronisation du registre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSemesterText(getDynamicSemester());
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const toStrapiTime = (t: string) => (t && t.length === 5 ? t + ':00' : t);

    const payload = {
      classe: { id: parseInt(values.classId) },
      subject: { id: parseInt(values.subjectId) },
      teacher: values.teacherId ? { id: parseInt(values.teacherId) } : null,
      dayOfWeek: values.dayOfWeek,
      startTime: toStrapiTime(values.startTime),
      endTime: toStrapiTime(values.endTime),
    };

    try {
      if (editingEntry) {
        await api.put('/admin/timetables/' + editingEntry.id, payload);
        toast.success('Entrée mise à jour');
      } else {
        await api.post('/admin/timetables', payload);
        toast.success('Entrée ajoutée au planning');
      }
      fetchData();
      setIsDialogOpen(false);
      setIsDetailOpen(false);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || 'Erreur serveur';
      toast.error('Échec : ' + msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette entrée ?')) return;
    try {
      await api.delete('/admin/timetables/' + id);
      toast.success('Supprimé du planning');
      fetchData();
      setIsDetailOpen(false);
    } catch (e: any) {
      toast.error('Échec de la suppression');
    }
  };

  const handleEditClick = (entry: any) => {
    setEditingEntry(entry);
    form.reset({
      classId: entry.classe?.id ? String(entry.classe.id) : '',
      subjectId: entry.subject?.id ? String(entry.subject.id) : '',
      teacherId: entry.teacher?.id ? String(entry.teacher.id) : '',
      dayOfWeek: entry.dayOfWeek || 'MONDAY',
      startTime: entry.startTime ? entry.startTime.substring(0, 5) : '',
      endTime: entry.endTime ? entry.endTime.substring(0, 5) : '',
    });
    setIsDialogOpen(true);
  };

  const dayTimetable = useMemo(() => {
    return timetable
      .filter((item) => item.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, selectedDay]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50/50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Chargement de l'emploi du temps...
        </p>
      </div>
    );
  }

  return (
    <div className="md:min-h-screen bg-[#f8fafc] p-[clamp(1rem,2vw+1rem,2rem)] space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 max-w-7xl mx-auto">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw+1rem,3rem)] font-black text-slate-950 tracking-tighter italic uppercase">
            Gestion de <span className="text-blue-600">l'Emploi du temps</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
            Portail Administrateur • {semesterText}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEntry(null);
            form.reset({
              classId: '',
              subjectId: '',
              teacherId: '',
              dayOfWeek: selectedDay,
              startTime: '',
              endTime: '',
            });
            setIsDialogOpen(true);
          }}
          className="bg-slate-950 hover:bg-blue-600 text-white rounded-2xl px-6 h-12 font-black transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} className="mr-2" /> AJOUTER UNE ENTRÉE
        </Button>
      </header>

      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 max-w-7xl mx-auto scrollbar-hide">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={
              'px-8 py-3 rounded-2xl font-black cursor-pointer text-[11px] tracking-widest transition-all ' +
              (selectedDay === day
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-600')
            }
          >
            {DAY_LABELS[day] ?? day}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="max-w-7xl mx-auto grid gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4"
          >
            {dayTimetable.map((entry) => (
              <Card
                key={entry.id}
                onClick={() => {
                  setSelectedEntry(entry);
                  setIsDetailOpen(true);
                }}
                className="border border-slate-100 hover:border-blue-600 duration-300 transition-all shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center">
                    {/* Time Block */}
                    <div className="bg-slate-950 text-white p-6 md:w-48 flex flex-col justify-center items-center border-r border-slate-100">
                      <Clock className="text-blue-500 mb-1" size={18} />
                      <span className="font-black text-white text-sm tracking-tighter">
                        {entry.startTime ? entry.startTime.substring(0, 5) : ''}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        à {entry.endTime ? entry.endTime.substring(0, 5) : ''}
                      </span>
                    </div>

                    {/* Content Block */}
                    <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 uppercase italic tracking-tight text-lg">
                            {entry.subject?.name || 'Aucune matière'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            <span className="flex items-center gap-1">
                              <Layers size={12} className="text-slate-300" />
                              {entry.classe?.name || 'Aucune classe'}
                            </span>
                            {entry.teacher && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <User size={12} className="text-slate-300" />
                                {entry.teacher.name || entry.teacher.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dayTimetable.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p className="font-black uppercase text-xs tracking-widest text-slate-400">
                  Aucun cours prévu pour {DAY_LABELS[selectedDay]}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
          {selectedEntry && (
            <div className="space-y-6">
              <div className="bg-blue-600 -mx-8 -mt-8 p-8 text-white rounded-t-[2.5rem]">
                <DialogHeader className="p-0 text-left">
                  <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-white">
                    {selectedEntry.subject?.name || 'Matière'}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-black uppercase tracking-[0.2em] text-blue-200 mt-1 block">
                    Détails de la Session
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Classe
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <GraduationCap size={16} className="text-blue-600" />
                    {selectedEntry.classe?.name || 'N/A'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Jour
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Calendar size={16} className="text-blue-600" />
                    {DAY_LABELS[selectedEntry.dayOfWeek] || selectedEntry.dayOfWeek}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Enseignant
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <User size={16} className="text-blue-600" />
                    {selectedEntry.teacher
                      ? selectedEntry.teacher.name || selectedEntry.teacher.username
                      : 'Non assigné'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    Créneau Horaire
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <Clock size={16} className="text-blue-600" />
                    {selectedEntry.startTime ? selectedEntry.startTime.substring(0, 5) : ''} -{' '}
                    {selectedEntry.endTime ? selectedEntry.endTime.substring(0, 5) : ''}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleEditClick(selectedEntry)}
                  className="flex-1 h-12 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  <Edit3 size={14} className="mr-2" /> Modifier
                </Button>
                <Button
                  onClick={() => handleDelete(selectedEntry.id)}
                  className="h-12 w-12 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center transition-all"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter">
              {editingEntry ? 'Modifier' : 'Nouvelle'} <span className="text-blue-600">Entrée</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Configurer les paramètres de la session de cours.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Classe
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)} className="font-bold">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Matière
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)} className="font-bold">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Enseignant (Optionnel)
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold">
                          <SelectValue placeholder="Non assigné" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="none" className="font-bold text-slate-400">
                          Non assigné
                        </SelectItem>
                        {teachers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)} className="font-bold">
                            {t.name || t.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Jour de la semaine
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold">
                          <SelectValue placeholder="Choisir un jour" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {DAYS.map((day) => (
                          <SelectItem key={day} value={day} className="font-bold">
                            {DAY_LABELS[day] ?? day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Heure de début
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="rounded-xl border-slate-100 bg-slate-50 font-bold"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Heure de fin
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="rounded-xl border-slate-100 bg-slate-50 font-bold"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all uppercase tracking-widest text-xs"
              >
                {editingEntry ? 'Mettre à jour' : 'Confirmer l\'entrée'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
