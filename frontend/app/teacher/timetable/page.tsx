'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  BookOpen,
  MapPin,
  Calendar,
  Info,
  Loader2,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

interface TimetableEntry {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: { name: string };
  classe: { name: string };
}

export default function UserTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // FIXED: Correct TypeScript implementation for uppercase weekday
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    return DAYS.includes(today) ? today : 'MONDAY';
  });

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        // The endpoint should be specific to the role (e.g., /teacher/timetables)
        const response = await api.get('/teacher/timetables');
        setTimetable(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Schedule Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  // Filter and Sort: Ensure classes are ordered by time
  const filteredSchedule = timetable
    .filter(item => item.dayOfWeek === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-slate-50/50">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Schedule...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 space-y-[clamp(1.3rem,1vw+0.5rem,2rem)]">
      {/* Header Section */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-[clamp(1.3rem,1vw+0.5rem,2rem)]">
        <div>
          <Badge className="bg-blue-600/10 text-primary hover:bg-blue-600/10 border-none px-4 py-1 mb-4 rounded-full text-[10px] font-black uppercase tracking-widest">
            Registry Active • 2026
          </Badge>
          <h1 className="text-[clamp(1.3rem,2.5vw+1rem,2rem)] font-black text-slate-900 tracking-tighter sm:text-[clamp(1.3rem,2.5vw+1rem,2rem)]">
            Weekly <span className="text-primary italic">Schedule.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-[clamp(1.3rem,1vw+0.5rem,2rem)] shadow-sm border border-primary/0 lg:hover:border-primary duration-300">
          <div className="w-10 h-10 bg-blue-50 rounded-[clamp(1.3rem,1vw+0.5rem,2rem)] flex items-center justify-center text-primary">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today&apos;s Date</p>
            <p className="font-bold text-slate-700">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      </header>

      {/* Day Navigation */}
      <nav className="max-w-6xl mx-auto">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {DAYS.map((day) => (
            <Button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-8 py-4 rounded-3xl font-black text-[11px] tracking-[0.2em] transition-all whitespace-nowrap border-2  ${activeDay === day
                ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 scale-105'
                : 'bg-white text-slate-400 border-transparent hover:border-slate-100 hover:text-slate-600'
                }`}
            >
              {day}
            </Button>
          ))}
        </div>
      </nav>

      {/* Schedule Body */}
      <main className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {filteredSchedule.length > 0 ? (
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-6"
            >
              {filteredSchedule.map((session) => (
                <Card key={session.id} className="border border-slate-100/50 md:hover:border-primary duration-500 shadow-sm rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-xl transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                      {/* Left: Time Indicator */}
                      <div className="bg-slate-900 text-white p-8 md:w-52 flex flex-col justify-center items-center gap-2 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center italic">
                          <span className="text-2xl font-black tracking-tighter">{session.startTime}</span>
                          <ArrowRight size={16} className="text-blue-500 my-1 rotate-90 md:rotate-0" />
                          <span className="text-lg font-black text-slate-400 tracking-tighter">{session.endTime}</span>
                        </div>
                        <Clock className="absolute -left-4 -bottom-4 text-white/5" size={120} />
                      </div>

                      {/* Right: Content Details */}
                      <div className="p-8 flex-1 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[1.8rem] bg-blue-50 flex items-center justify-center text-primary transition-transform group-hover:scale-110 duration-500">
                            <BookOpen size={28} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-black text-[9px] px-2">LECTURE</Badge>
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Room 404</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic mb-1">
                              {session.subject.name}
                            </h3>
                            <div className="flex items-center gap-4 text-slate-400">
                              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                <GraduationCap size={14} className="text-blue-500" />
                                {session.classe.name}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest">
                                <MapPin size={14} className="text-blue-500" />
                                Main Building
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 cursor-help hover:bg-slate-900 hover:text-white transition-all duration-300">
                            <Info size={20} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 px-10 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 md:hover:border-primary duration-500 transition-colors"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-8">
                <Calendar className="text-slate-200" size={48} />
              </div>
              <h3 className="text-[clamp(1.3rem,2.5vw+1rem,2rem)] font-black text-slate-900 tracking-tight mb-3">SCHEDULE EMPTY</h3>
              <p className="text-slate-400 font-bold max-w-sm text-sm uppercase tracking-widest leading-loose">
                No classes registered for {activeDay.toLowerCase()}.
                Enjoy your academic break.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
