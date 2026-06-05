'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  User,
  Mail,
  GraduationCap,
  Loader2,
  LayoutGrid,
    Calendar as CalendarIcon,
  List as ListIcon
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Class {
  id: number;
  name: string;
  teachers: Teacher[];
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/student/classes');
        setClasses(response.data);
      } catch (error) {
        toast.error('Connection Lost', {
          description: 'Unable to reach the academy servers.',
        });
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50/50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Synchronizing Registry...</p>
      </div>
    );
  }

  return (
    <div className="md:min-h-screen bg-[#f8fafc] p-6 lg:p-10">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-[clamp(1.3rem,1.5vw+1rem,2rem)] flex flex-col md:flex-row md:items-end justify-between gap-6 max-md:gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
            <GraduationCap size={16} />
            Academic Portal
          </div>
          <h1 className="text-[clamp(1.2rem,2.5vw+1rem,3rem)] font-black text-slate-900 tracking-tighter">
            My <span className="text-primary">Curriculum</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md">
            View your active enrollments and connect with your course instructors.
          </p>
        </div>
         <div className="flex gap-3">
          <Button className="bg-white border border-primary/0 md:hover:border-primary duration-500 hover:bg-slate-50 text-slate-900 rounded-2xl px-6 h-12 font-bold shadow-sm">
            <CalendarIcon size={18} className="mr-1 text-primary" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence>
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c, index) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group border border-slate-100 md:hover:border-primary shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden bg-white">
                    <CardContent className="p-0">
                      {/* Card Top: Visual Accent */}
                      <div className="h-32 bg-slate-900 p-8 flex justify-between items-start relative overflow-hidden">
                        <div className="z-10">
                          <Badge className="bg-primary/20 text-blue-400 border-none mb-3 backdrop-blur-md font-bold">
                            Active Session
                          </Badge>
                          <h3 className="text-white text-xl font-black tracking-tight leading-none uppercase">
                            {c.name}
                          </h3>
                        </div>
                        <BookOpen className="text-white/10 absolute -right-4 -bottom-4" size={120} />
                      </div>

                      {/* Card Bottom: Content */}
                      <div className="p-8 space-y-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructors</p>

                          <div className="space-y-3">
                            {c.teachers && c.teachers.length > 0 ? (
                              c.teachers.map((teacher) => (
                                <div key={teacher.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-primary/20 group-hover:bg-blue-50/50 md:hover:border-primary cursor-pointer duration-500 transition-colors">
                                  <a href="mailto:{teacher.email}" className='flex items-center w-full justify-between'>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                      <User size={18} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-black text-slate-800 tracking-tight">{teacher.name}</p>
                                      <p className="text-[10px] font-medium text-slate-500">{teacher.email}</p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white hover:text-primary">
                                    <Mail size={16} />
                                  </Button>
                                  </a>
                                </div>
                              ))
                            ) : (
                              <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">No Tutor Assigned</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button className="w-full bg-slate-100 md:hover:bg-primary duration-500 hover:text-white text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] h-12 rounded-2xl transition-all border-none">
                          Course Materials
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 md:hover:border-primary duration-500 transition-colors"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LayoutGrid className="text-slate-300" size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No Classes Found</h2>
              <p className="text-slate-500 text-sm mt-2">You have not been assigned to any curriculum yet.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

