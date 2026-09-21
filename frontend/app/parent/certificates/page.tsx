/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Award, Printer, QrCode, Loader2, ShieldCheck, CheckCircle2, XCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildCertPDF, type CertRecord } from '@/app/admin/certificates/page';

function StatusBadge({ cert }: { cert: CertRecord }) {
  const isRevoked = String(cert.status || cert.certStatus || '').toLowerCase().includes('revoq') || String(cert.status || cert.certStatus || '').toLowerCase().includes('révoq');
  const displayStatus = isRevoked ? 'Révoqué' : 'Valide';
  return (
    <Badge className={`text-[9px] font-black uppercase border-none px-2 py-0.5 ${isRevoked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
      {isRevoked ? <XCircle size={9} className="mr-1 inline" /> : <CheckCircle2 size={9} className="mr-1 inline" />}
      {displayStatus}
    </Badge>
  );
}

export default function ParentCertificatesPage() {
  const [certs, setCerts]   = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') || '' : '';
        const res = await api.get('/my/certificates', { headers: { Authorization: `Bearer ${token}` } });
        setCerts(res.data || []);
      } catch { toast.error('Impossible de charger les certificats'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Group by student
  const byStudent = certs.reduce<Record<string, CertRecord[]>>((acc, c) => {
    const key = c.studentName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  return (
    <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-6 bg-slate-50/50 min-h-screen">
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <h1 className="text-[clamp(1.2rem,2vw+1rem,1.7rem)] font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
          CERTIFICATS DE MES ENFANTS <Award className="text-amber-500" size={22}/>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-0.5">
          Diplômes et attestations officiels de vos enfants — 2CS Complexe Scolaire
        </p>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total', value: certs.length, bg: 'bg-blue-50', color: 'text-blue-600', icon: <Award size={16}/> },
          { label: 'Enfants concernés', value: Object.keys(byStudent).length, bg: 'bg-amber-50', color: 'text-amber-600', icon: <Users size={16}/> },
        ].map(s => (
          <Card key={s.label} className="border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>{s.icon}</div>
              <div>
                <p className="text-xl font-black text-slate-900">{loading ? '…' : s.value}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-slate-300"/></div>
      ) : certs.length === 0 ? (
        <Card className="border border-slate-100 shadow bg-white rounded-3xl overflow-hidden">
          <CardContent className="py-20 text-center">
            <Award size={36} className="text-slate-200 mx-auto mb-3"/>
            <p className="text-xs font-black uppercase text-slate-400">Aucun certificat disponible</p>
            <p className="text-[11px] text-slate-300 mt-1">Les diplômes et attestations de vos enfants apparaîtront ici une fois délivrés</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(byStudent).map(([studentName, studentCerts]) => (
          <motion.div key={studentName} initial={{ y: 20, opacity:0 }} animate={{ y:0, opacity:1 }}>
            <Card className="border border-slate-100 shadow bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-900 text-white py-3 px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2">
                  <Award size={12} className="text-amber-400"/>
                  {studentName} — {studentCerts.length} document{studentCerts.length > 1 ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      {['N° de Série', 'Type', 'Programme', 'Mention', 'Date', 'Statut', 'PDF'].map(h => (
                        <TableHead key={h} className="font-black uppercase text-[9px] tracking-widest text-slate-400">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentCerts.map(cert => (
                      <TableRow key={cert.id} className="hover:bg-slate-50/80 border-slate-50">
                        <TableCell><code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-700">{cert.serialNumber}</code></TableCell>
                        <TableCell><Badge className="text-[9px] font-black uppercase border-none px-2 py-0.5 bg-blue-100 text-blue-700">{cert.certificateType}</Badge></TableCell>
                        <TableCell className="text-[11px] text-slate-600 max-w-[180px] truncate">{cert.programme}</TableCell>
                        <TableCell>
                          {cert.mention ? <span className="text-[11px] font-black text-amber-600">{cert.mention}</span> : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-600">{cert.issueDate}</TableCell>
                        <TableCell>
                          <StatusBadge cert={cert} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => buildCertPDF(cert, []).catch(() => toast.error('Erreur PDF'))}>
                              <Printer size={14}/>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                              onClick={() => toast.info(cert.verificationHash, { description: cert.serialNumber })}>
                              <QrCode size={14}/>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </motion.div>
        ))
      )}

      {certs.length > 0 && (
        <div className="flex items-center gap-1.5 justify-center pb-4">
          <ShieldCheck size={11} className="text-emerald-500"/>
          <p className="text-[10px] text-slate-400 font-bold">Vérification cryptographique — 2cscomplexe.edu.gn</p>
        </div>
      )}
    </div>
  );
}
