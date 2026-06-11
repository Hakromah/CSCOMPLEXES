/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit3,
  Clock,
  BookOpen,
  Layers,
  MoreVertical,
  Filter
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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

const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];

const formSchema = z.object({
  classId: z.string().min(1, "Classe requise"),
  subjectId: z.string().min(1, "Sujet requis"),
  dayOfWeek: z.string().min(1, "Jour requis"),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
});

export default function TimetableManagement() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string>('LUNDI');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { classId: '', subjectId: '', dayOfWeek: '', startTime: '', endTime: '' }
  });

  const fetchData = async () => {
    try {
      const [tRes, cRes, sRes] = await Promise.all([
        api.get('/admin/timetables'),
        api.get('/admin/classes'),
        api.get('/admin/subjects'),
      ]);
      setTimetable(tRes.data);
      setClasses(cRes.data);
      setSubjects(sRes.data);
    } catch (error) {
      toast.error("Échec de la synchronisation du registre");
      console.log(error)
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      await fetchData()
    };
    loadInitial();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Strapi `time` field requires HH:MM:SS — browser <input type="time"> only gives HH:MM
    const toStrapiTime = (t: string) => (t && t.length === 5 ? `${t}:00` : t);

    const payload = {
      classe: { id: parseInt(values.classId) },
      subject: { id: parseInt(values.subjectId) },
      dayOfWeek: values.dayOfWeek,
      startTime: toStrapiTime(values.startTime),
      endTime: toStrapiTime(values.endTime),
    };

    try {
      if (editingEntry) {
        await api.put(`/admin/timetables/${editingEntry.id}`, payload);
        toast.success("Entrée mise à jour");
      } else {
        await api.post('/admin/timetables', payload);
        toast.success("Entrée ajoutée au planning");
      }
      fetchData();
      setIsDialogOpen(false);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || 'Erreur serveur';
      toast.error(`Échec : ${msg}`);
      console.error('Timetable error — status:', e?.response?.status, '| data:', JSON.stringify(e?.response?.data), '| msg:', e?.message);
    }
  };

  return (
    <div className="md:min-h-screen bg-[#fcfcfd] p-[clamp(0rem,2vw+1rem,2rem)] lg:p-[clamp(0rem,2vw+1rem,2rem)] space-y-[clamp(0rem,2vw+1rem,2rem)]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[clamp(1.2rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter italic">
            Emploi du temps <span className="text-primary">par semaine</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
            Portail Administrateur • Semestre 2 2026
          </p>
        </div>
        <Button
          onClick={() => { setEditingEntry(null); form.reset(); setIsDialogOpen(true); }}
          className="bg-slate-900 hover:bg-blue-600 text-white rounded-2xl px-6 h-12 font-black transition-all shadow-lg shadow-blue-500/10"
        >
          <Plus size={18} className="mr-2" /> AJOUTER UNE ENTRÉE
        </Button>
      </header>

      {/* Day Selector Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-8 py-3 rounded-[clamp(1rem,2vw+1rem,2rem)] font-black text-[11px] tracking-widest transition-all ${selectedDay === day
              ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
              : 'bg-white text-slate-400 hover:text-slate-600'
              }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      <div className="grid gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4"
          >
            {timetable
              .filter(item => item.dayOfWeek === selectedDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((entry) => (
                <Card key={entry.id} className="border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-center">
                      {/* Time Block */}
                      <div className="bg-slate-50 p-6 md:w-48 flex flex-col justify-center items-center border-r border-slate-100">
                        <Clock className="text-primary mb-2" size={18} />
                        <span className="font-black text-slate-900 text-sm tracking-tighter">{entry.startTime}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">to {entry.endTime}</span>
                      </div>

                      {/* Content Block */}
                      <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 uppercase italic tracking-tight">{entry.subject?.name || 'Aucune matière'}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              <Layers size={12} className="text-slate-300" />
                              {entry.classe?.name || 'Aucune classe'}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-blue-50 hover:text-primary"
                            onClick={() => {
                              setEditingEntry(entry);
                              form.reset({
                                classId: entry.classe?.id ? String(entry.classe.id) : '',
                                subjectId: entry.subject?.id ? String(entry.subject.id) : '',
                                dayOfWeek: entry.dayOfWeek || 'LUNDI',
                                startTime: entry.startTime,
                                endTime: entry.endTime,
                              });
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit3 size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-rose-50 hover:text-rose-600"
                            onClick={async () => {
                              await api.delete(`/admin/timetables/${entry.id}`);
                              fetchData();
                              toast.success("Supprimé du planning");
                            }}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {timetable.filter(item => item.dayOfWeek === selectedDay).length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 md:hover:border-primary duration-500 transition-colors rounded-[3rem] text-slate-300">
                <CalendarIcon size={48} className="mb-4 opacity-20" />
                <p className="font-black uppercase text-xs tracking-widest">Aucun cours prévu pour {selectedDay}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dialog remains similar but with updated styling for inputs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter">
              {editingEntry ? 'Modifier' : 'Nouvelle'} <span className="text-primary">Entrée</span>
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Configurer les paramètres de session pour l'emploi du temps.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="classId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold"><SelectValue placeholder="Select class" /></SelectTrigger></FormControl>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)} className="font-bold">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="subjectId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matière</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold"><SelectValue placeholder="Choisir une matière" /></SelectTrigger></FormControl>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {subjects.map(s => <SelectItem key={s.id} value={String(s.id)} className="font-bold">{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jour de la semaine</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold"><SelectValue placeholder="Choisir un jour" /></SelectTrigger></FormControl>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {DAYS.map(day => <SelectItem key={day} value={day} className="font-bold">{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heure de début</FormLabel>
                    <FormControl><Input type="time" {...field} className="rounded-xl border-slate-100 bg-slate-50 font-bold" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heure de fin</FormLabel>
                    <FormControl><Input type="time" {...field} className="rounded-xl border-slate-100 bg-slate-50 font-bold" /></FormControl>
                  </FormItem>
                )} />
              </div>

              <Button type="submit" className="w-full h-14 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition-all uppercase tracking-widest text-xs">
                {editingEntry ? 'Mettre à jour' : 'Confirmer l\'entrée'}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

