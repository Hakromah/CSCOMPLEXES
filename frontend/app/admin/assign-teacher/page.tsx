/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UserPlus,
  ShieldCheck,
  Users,
  Landmark,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
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

const formSchema = z.object({
  teacherId: z.string().min(1, { message: 'Please select an instructor' }),
  classId: z.string().min(1, { message: 'Please select a target class' }),
});

export default function AdvancedAssignTeacherPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { teacherId: '', classId: '' },
  });

  const fetchData = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.get('/admin/users?role=TEACHER'),
        api.get('/admin/classes'),
      ]);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("Échec de la synchronisation des données administratives");
      console.log(error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const tid = toast.loading("En cours de chargement, veuillez patienter ");
    try {
      await api.post('/admin/assign-teacher', {
        teacherId: parseInt(values.teacherId),
        classId: parseInt(values.classId),
      });
      toast.success('Affectation réussie', { id: tid });
      form.reset();
      fetchData(); // Refresh to show updated assignments if your API returns them
    } catch (error: any) {
      toast.error('Affectation échouée', { id: tid, description: error.response?.data?.message });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Chargement du registre...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)]">
      {/* Header */}
      <header className="max-w-6xl mx-auto text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-primary"
        >
          <ShieldCheck size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">L'autorité d'enregistrement</span>
        </motion.div>
        <h1 className="text-[clamp(1.4rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter sm:text-7xl italic uppercase">
          Professeur <span className="text-primary">Attribution.</span>
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest max-w-xl mx-auto leading-loose">
          Établir des liens entre le personnel enseignant et les registres de classes pour autoriser la gestion des examens.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Assignment Form Card */}
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="rounded-[clamp(1rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-[clamp(0rem,2vw+1rem,2rem)] space-y-[clamp(0rem,2vw+1rem,2rem)]">
              <div className="space-y-2">
                <h2 className="text-[clamp(16px,3vw,24px)] font-black text-slate-900 italic tracking-tight uppercase">Nouvelle attribution</h2>
                <div className="h-1 w-12 bg-primary rounded-full" />
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Choisir un membre du corps professoral</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-[clamp(1rem,2vw+1rem,2rem)] bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20">
                              <SelectValue placeholder="Choisir un instructeur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-[clamp(1rem,2vw+1rem,2rem)] border-slate-100 shadow-2xl">
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={String(teacher.id)} className="font-bold p-3">
                                {teacher.username || teacher.name || teacher.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center">
                    <div className="bg-blue-50 p-3 rounded-full">
                      <ArrowRight className="text-primary rotate-90 lg:rotate-0" size={20} />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classe cible</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20">
                              <SelectValue placeholder="Choisir une classe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            {classes.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)} className="font-bold p-3">
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 bg-slate-900 md:hover:bg-primary text-white font-black rounded-3xl transition-all shadow-xl shadow-slate-200 uppercase text-[11px] tracking-[0.3em] group">
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Confirmer l'affectation
                        <UserPlus className="ml-2 group-hover:scale-110 transition-transform" size={18} />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Status / Info Card */}
        <motion.div
          className="lg:col-span-7 space-y-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-white rounded-[clamp(1rem,2vw+1rem,2rem)] p-[clamp(0rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm h-full flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[clamp(16px,3vw,24px)] font-black text-slate-900 italic tracking-tight uppercase">Informations rapides</h2>
                <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[9px] px-3 tracking-widest uppercase">Live Registry</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-4xl border border-slate-100 space-y-2">
                  <Users className="text-primary" size={24} />
                  <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{teachers.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corps professoral actif</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-4xl border border-slate-100 space-y-2">
                  <Landmark className="text-primary" size={24} />
                  <p className="text-3xl font-black text-slate-900 tracking-tighter italic">{classes.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classes disponibles</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Impact de l'attribution</p>
                <ul className="space-y-3">
                  {[
                    "Accorder les autorisations de gestion des examens",
                    "Activer la saisie des résultats pour les classes désignées",
                    "Fournir l'autorité de suivi des présences",
                    "Synchronisation des horaires des étudiants avec l'instructeur"
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-3 p-4 bg-white border border-slate-50 rounded-2xl shadow-sm">
                      <CheckCircle2 className="text-primary shrink-0" size={18} />
                      <span className="text-xs font-bold text-slate-600">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 p-6 bg-primary rounded-4xl text-white flex items-center justify-between shadow-xl shadow-blue-200">
              <div>
                <p className="font-black italic text-lg leading-none">Besoin d'une attribution en masse?</p>
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest mt-1">Contacter l'architecte système</p>
              </div>
              <Briefcase size={32} className="opacity-20" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
