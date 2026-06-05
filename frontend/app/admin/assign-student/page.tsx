/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  UserPlus,
  GraduationCap,
  Landmark,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Users2,
  Info
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
  studentId: z.string().min(1, { message: 'Please select a student for enrollment' }),
  classId: z.string().min(1, { message: 'Please select a target class' }),
});

export default function AdvancedAssignStudentPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { studentId: '', classId: '' },
  });

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/classes'),
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error('Failed to sync student registry');
      console.log(error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const tid = toast.loading('Processing enrollment...');
    try {
      await api.post('/admin/assign-student', {
        studentId: parseInt(values.studentId),
        classId: parseInt(values.classId),
      });
      toast.success('Enrollment Finalized', { id: tid });
      form.reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Enrollment rejected by system.';
      toast.error('Enrollment Failed', {
        id: tid,
        description: <span className="text-rose-500 font-bold">{errorMessage}</span>,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (dataLoading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Academic Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(0rem,2vw+1rem,2rem)] lg:p-[clamp(0rem,2vw+1rem,2rem)] space-y-[clamp(0rem,2vw+1rem,2rem)]">
      {/* Header Section */}
      <header className="max-w-6xl mx-auto text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-primary"
        >
          <ShieldCheck size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Registrar Authority</span>
        </motion.div>
        <h1 className="text-[clamp(1.2rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter italic uppercase">
          Student <span className="text-primary">Enrollment.</span>
        </h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest max-w-2xl mx-auto leading-loose">
          Assign students to their respective academic groups to enable timetable syncing and grade tracking.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-[clamp(1rem,2vw+1rem,2rem)] items-stretch">

        {/* Enrollment Console (Form) */}
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="rounded-[clamp(1rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-2xl overflow-hidden bg-white h-full">
            <CardContent className="p-[clamp(0rem,2vw+1rem,2rem)] space-y-[clamp(0rem,2vw+1rem,2rem)]">
              <div className="space-y-2">
                <h2 className="text-[clamp(1rem,3vw,4rem)]  font-black text-slate-900 italic tracking-tight uppercase">Enrollment Console</h2>
                <div className="h-1.5 w-16 bg-blue-600 rounded-full" />
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identify Student</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20">
                              <SelectValue placeholder="Search student registry..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl max-md:rounded-xl border-slate-100 shadow-2xl">
                            {students.map((student) => (
                              <SelectItem key={student.id} value={String(student.id)} className="font-bold p-3">
                                {student.username || student.name || student.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-dashed border-slate-200" />
                    </div>
                    <div className="relative bg-white px-4">
                      <div className="bg-blue-50 p-3 rounded-full border border-blue-100">
                        <ArrowRight className="text-primary rotate-90 lg:rotate-0" size={20} />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Class Allocation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-16 rounded-2xl max-md:rounded-xl bg-slate-50 border-none font-bold text-slate-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-600/20">
                              <SelectValue placeholder="Identify target group..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl max-md:rounded-xl border-slate-100 shadow-2xl">
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
                    className="w-full h-16 bg-slate-900 md:hover:bg-primary text-white font-black rounded-3xl transition-all shadow-xl shadow-slate-200 uppercase text-[11px] tracking-[0.3em] group"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        COMMIT ENROLLMENT
                        <UserPlus className="ml-2 group-hover:scale-110 transition-transform" size={18} />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enrollment Intelligence (Stats & Info) */}
        <motion.div
          className="lg:col-span-7 flex flex-col gap-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="bg-white rounded-[clamp(1rem,2vw+1rem,2rem)] p-[clamp(0rem,2vw+1rem,2rem)] border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm flex-1 flex flex-col justify-between">
            <div className="space-y-[clamp(0rem,2vw+1rem,2rem)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[clamp(1rem,3vw,4rem)]  font-black text-slate-900 italic tracking-tight uppercase leading-none">Intelligence Hub</h2>
                <Badge className="bg-blue-100 text-primary border-none font-black text-[9px] px-3 tracking-[0.2em] uppercase">System Verified</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-2 group md:hover:bg-primary transition-all duration-500">
                  <GraduationCap className="text-primary group-hover:text-white transition-colors" size={28} />
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic group-hover:text-white transition-colors">{students.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-100 transition-colors">Total Students</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-2 group md:hover:bg-primary transition-all duration-500">
                  <Landmark className="text-primary group-hover:text-white transition-colors" size={28} />
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic group-hover:text-white transition-colors">{classes.length}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-100 transition-colors">Class Groups</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                  <Info size={14} /> Allocation Permissions
                </p>
                <div className="grid gap-3">
                  {[
                    "Automated timetable generation for student",
                    "Exam seat eligibility and hall ticket access",
                    "Parental dashboard data synchronization",
                    "Attendance registry inclusion for professors"
                  ].map((text, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm"
                    >
                      <div className="bg-emerald-50 p-1.5 rounded-lg">
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight italic">{text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <Users2 className="text-blue-400" size={28} />
                </div>
                <div>
                  <p className="font-black italic text-xl leading-none">Security Protocol</p>
                  <p className="text-[9px] opacity-60 font-bold uppercase tracking-[0.2em] mt-1">Authorized personnel only</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
