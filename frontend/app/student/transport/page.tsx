'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Bus, MapPin, Clock, Phone, User } from 'lucide-react';
import api from '@/lib/api';

interface TransportAssignment {
  id: number;
  routeName: string;
  pickupPoint: string;
  dropoffPoint: string;
  pickupTime: string;
  dropoffTime: string;
  vehicleInfo: string;
  transportFee: number;
  notes: string | null;
  driver?: {
    id: number;
    name: string;
    username: string;
    phoneNumber?: string;
  };
}

export default function StudentTransportPage() {
  const [assignment, setAssignment] = useState<TransportAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        const res = await api.get('/student/transport');
        setAssignment(res.data);
      } catch (err) {
        toast.error('Failed to sync transport schedule');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransport();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Transit Grid...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen space-y-8 bg-[#f8fafc]">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <Bus size={18} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Transit Registry</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
          Transport <span className="text-primary">Details.</span>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
          Your active transport route, timings, driver details and vehicle info
        </p>
      </header>

      {assignment ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Route Details */}
          <Card className="lg:col-span-2 border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Route</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{assignment.routeName}</h2>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-black px-4 py-1 uppercase text-[9px] tracking-widest">
                Active Assignment
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pickup location & time */}
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-primary">
                  <MapPin size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pickup Segment</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{assignment.pickupPoint}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <Clock size={12} /> Approx: {assignment.pickupTime ? assignment.pickupTime.slice(0, 5) : '—'}
                  </p>
                </div>
              </div>

              {/* Dropoff location & time */}
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-rose-500">
                  <MapPin size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dropoff Segment</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{assignment.dropoffPoint}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <Clock size={12} /> Approx: {assignment.dropoffTime ? assignment.dropoffTime.slice(0, 5) : '—'}
                  </p>
                </div>
              </div>
            </div>

            {assignment.notes && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 block mb-1">Route Coordinator Instructions</span>
                <p className="text-xs text-slate-600 font-bold">{assignment.notes}</p>
              </div>
            )}
          </Card>

          {/* Driver & Vehicle info */}
          <div className="space-y-6">
            {/* Driver Contact card */}
            <Card className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-900 text-white shadow-sm p-8 space-y-6 relative group">
              <div className="relative z-10 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned Driver</h3>
                {assignment.driver ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-base font-black tracking-tight">{assignment.driver.name || assignment.driver.username}</p>
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mt-0.5">Faculty Driver</p>
                      </div>
                    </div>

                    {assignment.driver.phoneNumber && (
                      <a
                        href={`tel:${assignment.driver.phoneNumber}`}
                        className="flex items-center justify-center gap-2 w-full bg-white text-slate-900 md:hover:bg-primary md:hover:text-white rounded-2xl h-12 font-black uppercase text-[10px] tracking-widest transition-all duration-500"
                      >
                        <Phone size={14} /> Call Driver
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold">No driver details logged for this transit assignment.</p>
                )}
              </div>
              <Bus className="absolute -right-8 -bottom-8 text-white/5" size={180} />
            </Card>

            {/* Vehicle Card */}
            <Card className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm p-6 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Vehicle Information</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                  <Bus size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{assignment.vehicleInfo || 'Standard School Shuttle'}</p>
                  <p className="text-[10px] font-bold text-slate-400">Authorized school transit asset</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <Bus className="mx-auto text-slate-200" size={60} />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Route Registered</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md mx-auto">
            You are not currently assigned to any active school transport route. Contact administration to register for transit services.
          </p>
        </Card>
      )}
    </div>
  );
}
