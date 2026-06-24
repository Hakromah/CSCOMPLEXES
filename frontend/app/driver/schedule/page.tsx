'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Bus, MapPin, Clock, Users, UserCheck } from 'lucide-react';
import api from '@/lib/api';

interface StudentInfo {
  id: number;
  name: string;
  username: string;
  userId: string;
}

interface Assignment {
  id: number;
  routeName: string;
  pickupPoint: string;
  dropoffPoint: string;
  pickupTime: string;
  dropoffTime: string;
  vehicleInfo: string;
  notes: string | null;
  student?: StudentInfo;
}

export default function DriverSchedulePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.get('/driver/my-assignments');
        setAssignments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error('Failed to load transit registry');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Route Schedules...</p>
      </div>
    );
  }

  // Group assignments by RouteName to show aggregate view
  const firstRoute = assignments[0];

  return (
    <div className="p-6 md:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-blue-600">
          <Bus size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Transit Operations</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
          My <span className="text-blue-600">Schedule.</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
          View assigned routes, vehicle configuration, and passenger registry logs
        </p>
      </header>

      {assignments.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <Bus className="mx-auto text-slate-200" size={60} />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Routes Assigned</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md mx-auto">
            You do not currently have any active student transport routes assigned to your profile. Contact administration.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Route Overview */}
          <div className="space-y-6">
            <Card className="border border-slate-100 rounded-3xl bg-slate-900 text-white shadow-sm p-6 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Transit Asset Config</span>
                <h3 className="text-2xl font-black tracking-tight">{firstRoute?.routeName || 'Campus Shuttle'}</h3>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold">Vehicle Details:</p>
                  <p className="text-sm font-bold text-blue-400">{firstRoute?.vehicleInfo || 'Standard school transit'}</p>
                </div>
              </div>
              <Bus className="absolute -right-8 -bottom-8 text-white/5" size={160} />
            </Card>

            <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm p-6 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Overview Stats</span>
              <div className="flex gap-6">
                <div className="space-y-0.5">
                  <p className="text-3xl font-black text-slate-900">{assignments.length}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Passengers</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Passenger Registry List */}
          <Card className="lg:col-span-2 border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
            <CardHeader className="px-8 py-5 border-b border-slate-50">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-slate-400" /> Passenger Registry
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="pl-8 py-4 font-black text-[9px] uppercase tracking-widest text-slate-400">Student</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Pickup</TableHead>
                    <TableHead className="font-black text-[9px] uppercase tracking-widest text-slate-400">Dropoff</TableHead>
                    <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-slate-400">Pickup Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                            {item.student ? (item.student.name || item.student.username || 'S')[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 tracking-tight">
                              {item.student ? (item.student.name || item.student.username) : 'Unassigned'}
                            </p>
                            <p className="text-[9px] font-mono text-slate-400">#{item.student?.userId || item.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          {item.pickupPoint}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-rose-400 shrink-0" />
                          {item.dropoffPoint}
                        </div>
                      </TableCell>
                      <TableCell className="pr-8 text-right font-black text-slate-900 text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock size={12} className="text-slate-400 shrink-0" />
                          {item.pickupTime ? item.pickupTime.slice(0, 5) : '—'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
