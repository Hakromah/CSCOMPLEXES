/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Search, GraduationCap, Loader2, Lock, CheckCircle2, AlertCircle,
  LayoutGrid, ListFilter, Download, UserCircle, BookOpen, RefreshCcw, TrendingUp, X,
} from 'lucide-react';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

// ── Grade helpers ─────────────────────────────────────────────────────────────
const calculateLetterGrade = (marks: number | string): string => {
  const score = typeof marks === 'string' ? parseFloat(marks) : marks;
  if (isNaN(score)) return '-';
  const val = score > 20 ? score / 5 : score;
  if (val >= 18) return 'A+';
  if (val >= 16) return 'A';
  if (val >= 14) return 'B';
  if (val >= 12) return 'C';
  if (val >= 10) return 'D';
  if (val >= 8) return 'E';
  return 'F';
};

const gradeColor = (score: number) => {
  const val = score > 20 ? score / 5 : score;
  if (val >= 14) return 'text-emerald-600';
  if (val >= 10) return 'text-amber-600';
  return 'text-red-500';
};

// ── A4 Landscape Gradebook PDF ────────────────────────────────────────────────
const exportGradebookPDF = (
  reportData: any[],
  exams: any[],
  className: string,
  schoolName = '2CS COMPLEXE SCOLAIRE CAMARA SALEMATOU',
) => {
  if (reportData.length === 0) {
    toast.error('Aucune donnée du carnet de notes à exporter.');
    return;
  }

  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as any;
    const pageW = doc.internal.pageSize.getWidth();
    const date = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Dark header bar ──
    doc.setFillColor(43, 76, 126);
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(schoolName.toUpperCase(), 14, 11);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 245);
    doc.text('Carnet de notes officiel (Barème sur 20)  •  Système de gestion des résultats', 14, 17);
    doc.text(`Généré le : ${date}`, 14, 22);

    // Class badge (right side)
    doc.setFillColor(110, 190, 68);
    doc.roundedRect(pageW - 60, 6, 46, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CLASSE: ${className}`, pageW - 37, 16, { align: 'center' });

    // ── Section title ──
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MATRICE DE PERFORMANCE ACADÉMIQUE (SUR 20)', 14, 38);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total des élèves : ${reportData.length}   |   Total des évaluations : ${exams.length}`, 14, 44);

    // ── Table columns ──
    const head = [
      ['#', 'Nom et prénom de l\'élève', 'Matricule',
        ...exams.map((e: any) => `${e?.name || '?'}\n(Coef: ${e?.weight ?? 1})`),
        'Moyenne (/20)', 'Mention',
      ],
    ];

    const body = reportData.map((student: any, idx: number) => {
      const scores = exams.map((e: any) => {
        const cell = student.marks[e.id];
        return cell?.val ?? null;
      });
      const validScores = scores.filter((s: any) => s !== null) as number[];
      const avg = validScores.length > 0
        ? (validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length)
        : null;
      const avgVal20 = avg !== null ? (avg > 20 ? avg / 5 : avg) : null;
      const avgStr = avgVal20 !== null ? `${avgVal20.toFixed(2)} / 20` : '-';
      const grade = avgVal20 !== null ? calculateLetterGrade(avgVal20) : '-';

      return [
        String(idx + 1),
        student.name || 'Inconnu',
        student.userId || 'N/A',
        ...scores.map((s: any) => {
          if (s === null) return '-';
          const sVal20 = s > 20 ? s / 5 : s;
          return `${Number(sVal20).toFixed(2)}`;
        }),
        avgStr,
        grade,
      ];
    });

    autoTable(doc, {
      startY: 48,
      head,
      body,
      theme: 'grid',
      headStyles: {
        fillColor: [43, 76, 126] as any,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
        valign: 'middle',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] as any },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 38, fontStyle: 'bold' },
        2: { cellWidth: 28, font: 'courier', fontSize: 7 },
        // exam columns: auto width
        [exams.length + 3]: { halign: 'center', cellWidth: 22, fontStyle: 'bold', textColor: [43, 76, 126] as any },
        [exams.length + 4]: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          // Score columns (after #, name, id)
          const colIdx = data.column.index;
          if (colIdx >= 3 && colIdx < exams.length + 3) {
            const raw = parseFloat(data.cell.raw as string);
            if (!isNaN(raw)) {
              if (raw < 10) {
                data.cell.styles.textColor = [220, 38, 38]; // red
                data.cell.styles.fontStyle = 'bold';
              } else if (raw >= 14) {
                data.cell.styles.textColor = [5, 150, 105]; // green
              }
              data.cell.styles.halign = 'center';
            }
          }
          // Grade column
          if (colIdx === exams.length + 4) {
            const grade = data.cell.raw as string;
            if (grade === 'F' || grade === 'E') data.cell.styles.textColor = [220, 38, 38];
            else if (grade === 'A+' || grade === 'A' || grade === 'B') data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.halign = 'center';
          }
        }
      },
    });

    // ── Footer ──
    const finalY = doc.lastAutoTable?.finalY ?? 180;
    const footerY = Math.max(finalY + 12, 185);

    doc.setDrawColor(226, 232, 240);
    doc.line(14, footerY, pageW - 14, footerY);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      `${schoolName}  |  Rapport de notes officiel pour ${className}  |  ${date}  |  Confidentiel – Usage interne uniquement`,
      pageW / 2, footerY + 5, { align: 'center' }
    );

    doc.save(`Rapport de notes_${className.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
    toast.success('Rapport de notes PDF exporté avec succès !');
  } catch (err) {
    console.error('Génération du PDF échouée :', err);
    toast.error('Export échoué. Veuillez réessayer.');
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminResultsPage() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // List View
  const [results, setResults] = useState<any[]>([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Gradebook
  const [exams, setExams] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [gradebookLoading, setGradebookLoading] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const uniqueSemesters = useMemo(() => {
    const sems = results.map(r => r.exam?.semester).filter(Boolean);
    return Array.from(new Set(sems));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (selectedSemester === 'all') return results;
    return results.filter(r => r.exam?.semester === selectedSemester);
  }, [results, selectedSemester]);

  const selectedClassName = useMemo(() =>
    classes.find(c => String(c.id) === selectedClassId)?.name || selectedClassId,
    [classes, selectedClassId]
  );

  // ── API ──────────────────────────────────────────────────────────────────────
  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (studentQuery.trim()) params.append('studentQuery', studentQuery.trim());
    if (selectedClassId && selectedClassId !== 'all') params.append('classId', selectedClassId);
    try {
      const res = await api.get(`/admin/results/filter?${params.toString()}`);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error('Échec de la récupération des résultats.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentQuery, selectedClassId]);

  const fetchGradebook = useCallback(async () => {
    if (selectedClassId === 'all') {
      setExams([]); setReportData([]);
      return;
    }
    setGradebookLoading(true);
    try {
      const [resultsRes, examsRes] = await Promise.all([
        api.get(`/admin/results/filter?classId=${selectedClassId}`),
        api.get(`/admin/exams?classId=${selectedClassId}`),
      ]);

      const classExams: any[] = Array.isArray(examsRes.data) ? examsRes.data : [];
      setExams(classExams);

      const studentMap: any = {};
      (Array.isArray(resultsRes.data) ? resultsRes.data : []).forEach((r: any) => {
        const sId = r?.student?.userId || r?.student?.id || `unknown-${r?.id}`;
        const studentName = r.student?.username || r.student?.name || 'Élève Inconnu';
        const studentId = r?.student?.id || null;
        const examId = r?.exam?.id;
        if (!examId) return;
        if (!studentMap[sId]) {
          studentMap[sId] = { id: studentId, name: studentName, userId: sId, marks: {} };
        }
        studentMap[sId].marks[examId] = { val: r?.marks ?? 0, resultId: r?.id, isLocked: r?.exam?.locked || false };
      });

      setReportData(Object.values(studentMap));
    } catch (err) {
      toast.error('Échec du chargement des données du cahier de notes.');
      console.error(err);
    } finally {
      setGradebookLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    api.get('/admin/classes').then(res => setClasses(res.data || [])).catch(() => { });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchResults();
      fetchGradebook();
    }, 300);
    return () => clearTimeout(t);
  }, [fetchResults, fetchGradebook]);

  // ── Selected student for chart popup ────────────────────────────────────────
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<any | null>(null);

  const getChartData = (student: any) =>
    exams.map((exam: any) => {
      const allScores = reportData
        .map((s: any) => {
          const raw = s.marks[exam.id]?.val;
          if (raw == null) return null;
          return raw > 20 ? raw / 5 : raw;
        })
        .filter((v: any) => v != null) as number[];
      const avg = allScores.length > 0
        ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length
        : 0;
      const rawStudent = student.marks[exam.id]?.val;
      const studentScore20 = rawStudent != null ? (rawStudent > 20 ? rawStudent / 5 : rawStudent) : 0;
      return {
        name: exam.name,
        studentScore: parseFloat(studentScore20.toFixed(2)),
        classAverage: parseFloat(avg.toFixed(2)),
      };
    });

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-[clamp(1rem,2vw+1rem,2rem)] space-y-[clamp(1rem,1.5vw+0.5rem,2rem)] max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <GraduationCap size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestion des résultats</span>
          </div>
          <h1 className="text-[clamp(1.5rem,3vw,3.5rem)] font-black tracking-tight text-slate-900 italic uppercase">
            Gestion des résultats
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">
            Surveillez tous les résultats publiés et les matrices de performance.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Class selector */}
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-44 rounded-xl border-slate-200 bg-white font-bold h-12">
              <SelectValue placeholder="Sélectionner la classe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="rounded-xl h-12 w-12 p-0 border-slate-200"
            onClick={() => { fetchResults(); fetchGradebook(); }}
          >
            <RefreshCcw size={16} className="text-slate-600" />
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid grid-cols-2 sm:max-w-xs rounded-2xl bg-slate-100 max-sm:w-full p-1">
          <TabsTrigger value="list" className="rounded-xl gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
            <ListFilter size={14} className='max-sm:hidden' /> Afficher les résultats
          </TabsTrigger>
          <TabsTrigger value="gradebook" className="rounded-xl gap-2 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
            <LayoutGrid size={14} className='max-sm:hidden' /> Cahier de notes
          </TabsTrigger>
        </TabsList>

        {/* ════ LIST VIEW ════════════════════════════════════════════════════════ */}
        <TabsContent value="list" className="space-y-4 mt-4">
          {/* Filters bar */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm">
            <CardContent className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <Search size={10} /> Recherche d'étudiant
                </label>
                <Input
                  placeholder="Nom ou identifiant..."
                  className="rounded-xl border-slate-100 bg-slate-50 font-bold h-11"
                  value={studentQuery}
                  onChange={e => setStudentQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchResults()}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Semestre</label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold h-11">
                    <SelectValue placeholder="Tout" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl">
                    <SelectItem value="all">Tous les semestres</SelectItem>
                    {uniqueSemesters.map(sem => <SelectItem key={sem} value={sem}>{sem}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={fetchResults} disabled={loading} className="h-11 rounded-xl font-black text-xs uppercase tracking-widest bg-slate-900 hover:bg-primary">
                {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : <Search size={14} className="mr-2" />}
                Filtrer
              </Button>
            </CardContent>
          </Card>

          {/* Results table — 5 rows scrollable */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-slate-900 hover:bg-slate-900 border-none">
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-6">ETUDIANT</TableHead>
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">CLASSE</TableHead>
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">ÉVALUATION</TableHead>
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">POIDS</TableHead>
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">NOTE</TableHead>
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">MENTION</TableHead>
                    <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-right pr-6">STATUT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : filteredResults.length > 0 ? filteredResults.map(r => {
                    const marks20 = r.marks != null ? (r.marks > 20 ? r.marks / 5 : r.marks) : 0;
                    const isPassing = marks20 >= 10.0;
                    return (
                      <TableRow key={r.id} className="hover:bg-slate-50/70 border-slate-100">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                              <UserCircle size={20} className="text-slate-400" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{r.student?.username || r.student?.name || 'Unknown'}</div>
                              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{r.student?.userId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-600 text-sm">{r.exam?.classe?.name ?? '—'}</TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-800 text-sm">{r.exam?.name}</div>
                          <div className="flex gap-1.5 mt-0.5">
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">{r.exam?.term}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{r.exam?.semester}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-500">Coef: {r.exam?.weight ?? 1}</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-base font-black ${gradeColor(marks20)}`}>{Number(marks20).toFixed(2)} / 20</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-xl bg-slate-100 font-black text-xs border border-slate-200 text-slate-700">
                            {r.grade || calculateLetterGrade(marks20)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex flex-col items-end gap-1">
                            {isPassing ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-black text-[9px] rounded-md px-2 py-0.5">
                                <CheckCircle2 size={10} className="mr-1" /> ADMIS
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-50 text-rose-600 border border-rose-100 font-black text-[9px] rounded-md px-2 py-0.5">
                                <AlertCircle size={10} className="mr-1" /> AJOURNÉ
                              </Badge>
                            )}
                            <Badge variant="outline" className={`font-black text-[9px] rounded-md px-2 py-0.5 ${r.status === 'DRAFT' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-700 border-green-100'
                              }`}>
                              {r.status}
                            </Badge>
                            {r.exam?.locked && (
                              <span className="flex items-center gap-1 text-[9px] text-slate-300 font-bold">
                                <Lock size={10} /> Verrouillé
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-slate-400 italic text-sm">
                        Aucun résultat trouvé correspondant à vos filtres.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredResults.length > 0 && (
              <div className="border-t px-6 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filteredResults.length} résultat{filteredResults.length !== 1 ? 's' : ''} trouvé{filteredResults.length !== 1 ? 's' : ''}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ════ GRADEBOOK ════════════════════════════════════════════════════════ */}
        <TabsContent value="gradebook" className="mt-4 space-y-4">

          {/* ── Student chart popup ── */}
          {selectedStudentForChart && (
            <Card className="border border-primary bg-primary/5 hover:border-blue-700 duration-300 transition-colors shadow-sm">
              <CardHeader className="flex flex-row items-center flex-wrap justify-between pb-2 px-6 pt-5">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-black text-slate-900 text-sm uppercase tracking-wide">
                    Statistique: {selectedStudentForChart?.name || 'N/A'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudentForChart(null)}
                  className="rounded-xl hover:bg-rose-50 hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="h-[280px] px-6 pb-5">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(selectedStudentForChart)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
                      formatter={(value: any, name?: string) => [`${value} / 20`, name === 'studentScore' ? 'Note' : 'Moyenne']}
                    />
                    <Legend formatter={(value) => value === 'studentScore' ? 'Note (/20)' : 'Moyenne de classe (/20)'} />
                    <Line name="studentScore" type="monotone" dataKey="studentScore" stroke="#2563eb" strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }} />
                    <Line name="classAverage" type="monotone" dataKey="classAverage" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* ── Gradebook matrix ── */}
          <Card className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-8 py-5 border-b border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Matrice des performances (Barème sur 20)</h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {selectedClassId === 'all'
                    ? 'Sélectionnez une classe pour afficher le carnet de notes'
                    : `Affichage: ${selectedClassName} — Cliquez sur une ligne d'élève pour afficher son graphique`}
                </p>
              </div>
              {selectedClassId !== 'all' && reportData.length > 0 && (
                <Button
                  onClick={() => exportGradebookPDF(reportData, exams, selectedClassName)}
                  className="bg-slate-900 hover:bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest h-11 px-5 gap-2"
                >
                  <Download size={14} /> Exporter le PDF
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {selectedClassId === 'all' ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                  <LayoutGrid size={40} className="opacity-30" />
                  <p className="text-sm font-bold italic">Sélectionnez une classe dans le menu déroulant supérieur droit pour charger le carnet de notes.</p>
                </div>
              ) : gradebookLoading ? (
                <div className="flex justify-center py-24">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                  <BookOpen size={40} className="opacity-30" />
                  <p className="text-sm font-bold italic">Aucune donnée de résultat trouvée pour cette classe.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Scrollable 5-row gradebook */}
                  <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                    <Table>
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="bg-slate-900 hover:bg-slate-900 border-none">
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-8 w-64">Élève</TableHead>
                          {exams.map(e => (
                            <TableHead key={e.id} className="text-white font-black text-[9px] uppercase tracking-wider text-center">
                              <div>{e?.name || '—'}</div>
                              <div className="text-blue-400 font-bold normal-case">Coef: {e?.weight ?? 1}</div>
                            </TableHead>
                          ))}
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-right pr-8">
                            Moyenne (/20)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map(student => {
                          const scores = exams.map((e: any) => {
                            const raw = student.marks[e.id]?.val ?? null;
                            if (raw === null) return null;
                            return raw > 20 ? raw / 5 : raw;
                          });
                          const valid = scores.filter((s: any) => s !== null) as number[];
                          const avg = valid.length > 0
                            ? valid.reduce((a, b) => a + b, 0) / valid.length
                            : null;
                          const isSelected = selectedStudentForChart?.id === student.id;

                          return (
                            <TableRow
                              key={student.id}
                              className={`border-slate-100 cursor-pointer transition-colors ${isSelected
                                ? 'bg-blue-50 hover:bg-blue-100'
                                : 'hover:bg-slate-50/80'
                                }`}
                              onClick={() => setSelectedStudentForChart(isSelected ? null : student)}
                              title="Cliquez pour afficher le graphique des performances"
                            >
                              <TableCell className="pl-8 py-4">
                                <div className="flex items-center gap-2">
                                  {isSelected && <TrendingUp size={13} className="text-primary shrink-0" />}
                                  <div>
                                    <div className={`font-bold text-sm ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                                      {student.name}
                                    </div>
                                    <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">{student.userId}</div>
                                  </div>
                                </div>
                              </TableCell>
                              {exams.map((e: any) => {
                                const raw = student.marks[e.id]?.val ?? null;
                                const val = raw !== null ? (raw > 20 ? raw / 5 : raw) : null;
                                return (
                                  <TableCell key={e.id} className="text-center py-4">
                                    {val !== null ? (
                                      <>
                                        <div className={`text-base font-black ${val < 10 ? 'text-red-500' : val >= 14 ? 'text-emerald-600' : 'text-slate-900'
                                          }`}>{val.toFixed(2)}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">{calculateLetterGrade(val)}</div>
                                      </>
                                    ) : (
                                      <span className="text-slate-300 font-bold text-sm">—</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-right pr-8 py-4">
                                {avg !== null ? (
                                  <div>
                                    <span className={`text-base font-black ${gradeColor(avg)}`}>{avg.toFixed(2)} / 20</span>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">{calculateLetterGrade(avg)}</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-300 font-bold">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="border-t px-8 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {reportData.length} élève{reportData.length !== 1 ? 's' : ''} — cliquez sur n'importe quelle ligne pour afficher le graphique des performances
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
