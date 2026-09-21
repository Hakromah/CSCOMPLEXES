/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { Award, Printer, QrCode, Loader2, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
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

export default function TeacherCertificatesPage() {
  const [certs, setCerts] = useState<CertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') || sessionStorage.getItem('token') || '' : '';
        const res = await api.get('/my/certificates', { headers: { Authorization: `Bearer ${token}` } });
        setCerts(res.data || []);
      } catch { toast.error('Impossible de charger vos certificats'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const validCount = certs.filter(c => !String(c.status || c.certStatus || '').toLowerCase().includes('revoq') && !String(c.status || c.certStatus || '').toLowerCase().includes('révoq')).length;

  return (
    <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-6 bg-slate-50/50 min-h-screen">
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <h1 className="text-[clamp(1.2rem,2vw+1rem,1.7rem)] font-black text-slate-900 tracking-tighter flex items-center gap-3 italic">
          MES CERTIFICATS <Award className="text-amber-500" size={22}/>
        </h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-0.5">
          Attestations et lettres officielles délivrées par 2CS Complexe Scolaire
        </p>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total', value: certs.length, bg: 'bg-blue-50', color: 'text-blue-600', icon: <Award size={16}/> },
          { label: 'Valides', value: validCount, bg: 'bg-emerald-50', color: 'text-emerald-600', icon: <CheckCircle2 size={16}/> },
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

      <Card className="border border-slate-100 shadow bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-900 text-white py-4 px-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <Award size={13} className="text-amber-400"/> Mes documents officiels
          </CardTitle>
        </CardHeader>
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0">
              <TableRow className="border-slate-100 hover:bg-transparent">
                {['N° de Série', 'Type', 'Programme', 'Date', 'Statut', 'PDF'].map(h => (
                  <TableHead key={h} className="font-black uppercase text-[9px] tracking-widest text-slate-400">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {loading ? (
                  <TableRow key="loading"><TableCell colSpan={6} className="text-center py-16"><Loader2 size={24} className="animate-spin text-slate-300 mx-auto"/></TableCell></TableRow>
                ) : certs.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={6} className="text-center py-16">
                      <Award size={36} className="text-slate-200 mx-auto mb-2"/>
                      <p className="text-xs font-black uppercase text-slate-400">Aucun certificat disponible</p>
                      <p className="text-[11px] text-slate-300 mt-1">Vos documents officiels apparaîtront ici une fois délivrés</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  certs.map(cert => (
                    <motion.tr key={cert.id} initial={{ opacity:0 }} animate={{ opacity:1 }} className="hover:bg-slate-50/80 border-slate-50">
                      <TableCell><code className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-700">{cert.serialNumber}</code></TableCell>
                      <TableCell>
                        <Badge className="text-[9px] font-black uppercase border-none px-2 py-0.5 bg-blue-100 text-blue-700">{cert.certificateType}</Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-600 max-w-[200px] truncate">{cert.programme}</TableCell>
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
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
        {certs.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center gap-1.5">
            <ShieldCheck size={10} className="text-emerald-500"/>
            <p className="text-[10px] text-slate-400 font-bold">Vérification cryptographique — 2cscomplexe.edu.gn</p>
          </div>
        )}
      </Card>
    </div>
  );
}
