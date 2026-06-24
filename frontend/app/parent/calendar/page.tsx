'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import api from '@/lib/api';
import type { SchoolEvent } from '@/types/school';

const EVENT_TYPE_COLORS: Record<string, string> = {
  ACADEMIC: 'bg-blue-100 text-blue-800',
  EXAM: 'bg-red-100 text-red-800',
  HOLIDAY: 'bg-green-100 text-green-800',
  MEETING: 'bg-purple-100 text-purple-800',
  SPORTS: 'bg-orange-100 text-orange-800',
  CULTURAL: 'bg-pink-100 text-pink-800',
  TRIP: 'bg-teal-100 text-teal-800',
  OTHER: 'bg-slate-100 text-slate-800',
};

export default function ParentCalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    setLoading(true);
    api.get(`/calendar/events?month=${month}&year=${year}`)
      .then(r => setEvents(r.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const eventsByDay: Record<number, SchoolEvent[]> = {};
  events.forEach(e => {
    const day = new Date(e.startDate).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.startDate);
    return eventDate.getMonth() + 1 === month && eventDate.getFullYear() === year;
  });

  const prev = () => setCurrentDate(new Date(year, month - 2, 1));
  const next = () => setCurrentDate(new Date(year, month, 1));

  const monthLabel = currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">School</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">School Calendar</h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prev} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <h2 className="text-lg font-black text-slate-900">{monthLabel}</h2>
            <button onClick={next} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <p key={d} className="text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-400 py-1">{d}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvents = eventsByDay[day] || [];
              const isToday = new Date().getDate() === day && new Date().getMonth() + 1 === month && new Date().getFullYear() === year;
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 text-sm font-bold transition-all relative
                    ${isSelected ? 'bg-primary text-white shadow-lg' : isToday ? 'bg-primary/10 text-primary' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((_, idx) => (
                        <span key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">
            {selectedDay ? `Events — ${selectedDay} ${monthLabel}` : `All Events (${todayEvents.length})`}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin border-primary" />
            </div>
          ) : (selectedDay ? selectedEvents : todayEvents).length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
              <Calendar className="w-8 h-8 opacity-30" />
              <p className="text-xs font-medium">No events {selectedDay ? 'this day' : 'this month'}</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(selectedDay ? selectedEvents : todayEvents).map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{event.title}</p>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-bold ${EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS.OTHER}`}>
                      {event.type}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                    <span>
                      {new Date(event.startDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {event.location}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
