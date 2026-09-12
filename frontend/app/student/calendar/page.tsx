'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

interface SchoolEvent {
  id: number;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  targetAudience: string;
}

export default function StudentCalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/student/events')
          .catch(() => api.get('/student/calendar'))
          .catch(() => ({ data: [] }));
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to sync event registry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const now = new Date();
  const sorted = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const upcoming = sorted.filter(e => new Date(e.startDate) >= now);
  const past = sorted.filter(e => new Date(e.startDate) < now).reverse();

  const filtered = view === 'upcoming' ? upcoming : past;

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement du Calendrier Scolaire...</p>
      </div>
    );
  }

  const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    ACADEMIC: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Académique' },
    EXAM: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Examen' },
    HOLIDAY: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Vacances / Férié' },
    MEETING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Réunion' },
    SPORTS: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Sport' },
    CULTURAL: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Culturel' },
    TRIP: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Sortie Scolaire' },
    OTHER: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Autre' },
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Calendar size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Événements du Campus</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
            Calendrier <span className="text-primary">Scolaire.</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            Restez informé des réunions, examens, sorties et vacances scolaires
          </p>
        </div>
        <div className="flex gap-2 bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
          <Button
            onClick={() => setView('upcoming')}
            className={`rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9 cursor-pointer transition-all ${
              view === 'upcoming' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            À venir ({upcoming.length})
          </Button>
          <Button
            onClick={() => setView('past')}
            className={`rounded-xl font-black text-[10px] uppercase tracking-widest px-4 h-9 cursor-pointer transition-all ${
              view === 'past' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Passés ({past.length})
          </Button>
        </div>
      </header>

      {/* Events List */}
      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <Calendar className="mx-auto text-slate-200" size={60} />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Aucun Événement Enregistré</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md mx-auto">
            Il n'y a aucun événement {view === 'upcoming' ? 'à venir' : 'passé'} inscrit au calendrier pour votre profil de classe.
          </p>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {filtered.map((event) => {
            const style = TYPE_STYLE[event.type] || TYPE_STYLE['OTHER'];
            const eDate = new Date(event.startDate);
            return (
              <Card key={event.id} className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Date Badge */}
                <div className="flex flex-col items-center justify-center bg-slate-900 text-white w-20 h-20 rounded-2xl flex-shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {eDate.toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className="text-3xl font-black leading-none mt-1">
                    {eDate.getDate()}
                  </span>
                </div>

                {/* Event info details */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className={`uppercase text-[9px] font-black border-none rounded-full px-2.5 py-0.5 ${style.bg} ${style.text}`}>
                      {style.label || event.type}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      {eDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {event.endDate && (
                        <>
                          <ArrowRight size={10} />
                          {new Date(event.endDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">{event.title}</h3>
                  {event.description && (
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-300" /> {event.location}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
