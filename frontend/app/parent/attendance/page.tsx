/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users } from 'lucide-react';
import api from '@/lib/api';

export default function ParentAttendanceIndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/parent/children')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length > 0) {
          router.replace(`/parent/children/${list[0].id}/attendance`);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
          Chargement du registre de présence...
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center h-[70vh] text-center">
      <Users className="w-12 h-12 text-slate-300 mb-3" />
      <h2 className="text-lg font-black text-slate-800">Aucun enfant rattaché</h2>
      <p className="text-xs font-medium text-slate-400 mt-1">
        Veuillez contacter l&apos;administration pour associer le profil de votre enfant à votre compte famille.
      </p>
    </div>
  );
}
