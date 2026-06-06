/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import ResultForm from '@/components/forms/ResultForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';
import { BadgeCheck, Download, Edit3, FileSpreadsheet, LayoutGrid, ListFilter, Lock, Save, Search, Send, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const calculateLetterGrade = (marks: number | string): string => {
  const score = typeof marks === 'string' ? parseFloat(marks) : marks;
  if (isNaN(score)) return '-';
  if (score >= 90) return 'AA';
  if (score >= 85) return 'BA';
  if (score >= 80) return 'BB';
  if (score >= 75) return 'CB';
  if (score >= 70) return 'CC';
  if (score >= 60) return 'DC';
  if (score >= 50) return 'DD';
  return 'FF';
};

// ── A4 Landscape Gradebook PDF export ────────────────────────────────────────
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
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Dark header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(schoolName.toUpperCase(), 14, 11);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Rapport officiel de notes  •  Système de gestion des résultats', 14, 17);
    doc.text(`Généré le : ${date}`, 14, 22);

    // Class badge (right side)
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(pageW - 60, 6, 46, 16, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`CLASS: ${className}`, pageW - 37, 16, { align: 'center' });

    // Section title
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('MATRICE DES PERFORMANCES ACADÉMIQUES', 14, 38);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Nombre total d'élèves: ${reportData.length}   |   Nombre total d'évaluations: ${exams.length}`, 14, 44);

    // Table columns
    const head = [[
      '#', 'Nom de l\'étudiant', 'Identifiant de l\'étudiant',
      ...exams.map((e: any) => `${e?.name || '?'}\n(${e?.weight ?? 0}%)`),
      'Moyenne pondérée', 'Note',
    ]];

    const body = reportData.map((student: any, idx: number) => {
      const scores = exams.map((e: any) => {
        const cell = student.marks[e.id];
        return cell?.val ?? null;
      });
      const validScores = scores.filter((s: any) => s !== null) as number[];
      const avg = validScores.length > 0
        ? (validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length)
        : null;
      return [
        String(idx + 1),
        student.name || 'Unknown',
        student.userId || 'N/A',
        ...scores.map((s: any) => (s !== null ? String(s) : '-')),
        avg !== null ? `${avg.toFixed(1)}%` : '-',
        avg !== null ? calculateLetterGrade(avg) : '-',
      ];
    });

    autoTable(doc, {
      startY: 48,
      head,
      body,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42] as any,
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
        2: { cellWidth: 28, fontSize: 7 },
        [exams.length + 3]: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: [37, 99, 235] as any },
        [exams.length + 4]: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const colIdx = data.column.index;
          if (colIdx >= 3 && colIdx < exams.length + 3) {
            const raw = parseFloat(data.cell.raw as string);
            if (!isNaN(raw)) {
              if (raw < 50) { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
              else if (raw >= 80) { data.cell.styles.textColor = [5, 150, 105]; }
              data.cell.styles.halign = 'center';
            }
          }
          if (colIdx === exams.length + 4) {
            const grade = data.cell.raw as string;
            if (grade === 'FF' || grade === 'DD') data.cell.styles.textColor = [220, 38, 38];
            else if (grade === 'AA' || grade === 'BA') data.cell.styles.textColor = [5, 150, 105];
            data.cell.styles.halign = 'center';
          }
        }
      },
    });

    // Footer
    const finalY = doc.lastAutoTable?.finalY ?? 180;
    const footerY = Math.max(finalY + 12, 185);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, footerY, pageW - 14, footerY);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      `${schoolName}  |  Rapport officiel de notes pour ${className}  |  ${date}  |  Confidentiel`,
      pageW / 2, footerY + 5, { align: 'center' }
    );

    doc.save(`GradeReport_${className.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
    toast.success('Rapport de notes PDF exporté avec succès!');
  } catch (err) {
    console.error('La génération du PDF a échoué:', err);
    toast.error('Échec de l\'exportation. Veuillez réessayer.');
  }
};


export default function TeacherResultsPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [results, setResults] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [exams, setExams] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<any | null>(null);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/teacher/classes');
      setClasses(response.data);
    } catch (error) { toast.error('Échec de la récupération des classes'); console.log(error) }
  };

  const fetchResultsList = useCallback(async () => {
    const params = new URLSearchParams();
    if (selectedClassId !== 'all') params.append('classId', selectedClassId);
    // Do NOT send studentId to backend — we filter client-side to support userId string search
    try {
      const response = await api.get(`/teacher/results/filter?${params.toString()}`);
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setResults([]);
      console.log(error);
    }
  }, [selectedClassId]);

  const fetchGradebookData = useCallback(async () => {
    if (selectedClassId === 'all') return;
    try {
      const [resultsRes, examsRes] = await Promise.all([
        api.get(`/teacher/classes/${selectedClassId}/gradebook`),
        api.get('/teacher/exams'),
      ]);

      const classExams = examsRes.data?.filter((e: any) => e?.classe?.id && String(e.classe.id) === selectedClassId) || [];
      setExams(classExams);

      const studentMap: any = {};
      // resultsRes.data?.forEach((r: any) => {
      // const sId = r.student.userId;
      // if (!studentMap[sId]) {
      // studentMap[sId] = { id: r?.student?.id || '--', name: r?.student?.name || '--', userId: sId, marks: {} };
      // }
      //  studentMap[sId].marks[r.exam.id] = { val: r?.marks || '--', resultId: r.id, isLocked: r?.exam?.locked || 'N/A' };
      //  });

      // 2. Safe loop with fallbacks for missing student or exam profiles
      resultsRes.data?.forEach((r: any) => {
        // Safe extraction or fallback to a unique string placeholder if empty
        const sId = r?.student?.userId || r?.student?.id || `unknown-${r?.id}`;
        const studentName = r.student?.username || r.student?.name || 'Unknown Student';
        const studentId = r?.student?.id || null;
        const examId = r?.exam?.id;

        if (!examId) return; // Skip if there's no valid associated exam

        if (!studentMap[sId]) {
          studentMap[sId] = {
            id: studentId,
            name: studentName,

            userId: sId,
            marks: {}
          };
        }

        studentMap[sId].marks[examId] = {
          val: r?.marks || 0,
          resultId: r?.id,
          isLocked: r?.exam?.locked || false
        };
      });

      setReportData(Object.values(studentMap));
    } catch (error) { toast.error('Échec du chargement du cahier de notes'); console.log(error) }
  }, [selectedClassId]);

  useEffect(() => {

    const loadData = async () => {
      await fetchClasses();
    };

    loadData();
  }, []);

  // Effect to handle search and class filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResultsList();
      if (selectedClassId !== 'all') fetchGradebookData();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedClassId, fetchResultsList, fetchGradebookData]); // filterStudentId removed — filtered client-side

  // ── Client-side filter: match userId string OR student name ─────────────────
  const displayedResults = filterStudentId.trim()
    ? results.filter(r => {
      const q = filterStudentId.trim().toLowerCase();
      const idMatch = (r?.student?.userId || '').toLowerCase().includes(q);
      const nameMatch = (r?.student?.username || r?.student?.name || '').toLowerCase().includes(q);
      return idMatch || nameMatch;
    })
    : results;
  const handleSubmitResults = async () => {
    const draftResultIds = results.filter(r => r.status === 'DRAFT' && r?.exam && !r.exam.locked).map(r => r.id);
    if (draftResultIds.length === 0) {
      toast.info('Aucun résultat brouillon éditable à soumettre.');
      return;
    }
    const toastId = toast.loading('Publication des résultats...');
    try {
      await api.post('/teacher/results/submit', draftResultIds);
      toast.success('Résultats publiés!', { id: toastId });
      fetchResultsList();
      fetchGradebookData();
    } catch (error) { toast.error('Échec de la soumission', { id: toastId }); console.log(error) }
  };

  const saveBulk = async () => {
    // 1. Prepare the payload from pendingChanges
    const payload = Object.entries(pendingChanges).map(([key, val]) => {
      const [studentId, examId] = key.split('-');
      return {
        student: { id: parseInt(studentId) },
        exam: { id: parseInt(examId) },
        marks: parseFloat(val as string)
      };
    });

    if (payload.length === 0) {
      setIsEditMode(false);
      return;
    }

    // 2. Start the loading state
    const tid = toast.loading("Mise à jour de la base de données...");

    try {
      // 3. Make the API call
      // Note: Ensure the URL matches your backend @PostMapping ("/results/bulk")
      const response = await api.post('/teacher/results/bulk', payload);

      // 4. Destructure the summary map returned by the Java Map<String, Object>
      const { created, updated } = response.data;

      // 5. Show the specific success message
      toast.success(
        `Carnet de notes mis à jour : ${created} nouvelles entrées, ${updated} modifications enregistrées.`,
        { id: tid }
      );

      // 6. Reset UI states
      setIsEditMode(false);
      setPendingChanges({});

      // 7. Refresh data to show new Letter Grades and Statuses
      fetchResultsList();
      fetchGradebookData();

    } catch (error) {
      toast.error("Échec de la saisie groupée. Veuillez vérifier les autorisations.", { id: tid });
      console.error("Bulk save error:", error);
    }
  };

  const getChartData = (student: any) => {
    return exams.map((exam) => {
      const allScores = reportData.map((s) => s.marks[exam.id]?.val).filter(v => v != null);
      const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
      return {
        name: exam.name,
        studentScore: student.marks[exam.id]?.val || 0,
        classAverage: parseFloat(avg.toFixed(1)),
      };
    });
  };

  const hasDrafts = results.some(r => r.status === 'DRAFT' && !r?.exam?.locked) || false;

  return (
    <div className="p-[clamp(1.3rem,1vw+0.5rem,2rem)] space-y-[clamp(1.3rem,1vw+0.5rem,2rem)]">
      <div className="flex justify-between items-start flex-wrap gap-5">
        <div>
          <h1 className="text-[clamp(1.3rem,1vw+0.5rem,2rem)] font-bold">Carnet de notes</h1>
          <p className="text-muted-foreground font-medium">Gérer les notes d'évaluation et l'agrégation semestrielle.</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-48 border-border hover:border-primary transition-colors duration-300"><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
            <SelectContent className="border-border hover:border-primary transition-colors duration-300">
              <SelectItem value="all">Toutes les classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c?.name || 'N/A'}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingResult(null); setIsDialogOpen(true) }}>Ajouter une entrée</Button>
          {hasDrafts && (
            <Button variant="secondary" onClick={handleSubmitResults} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
              <Send className="w-4 h-4 mr-2" /> Publier les brouillons
            </Button>
          )}
        </div>
      </div>

      {selectedStudentForChart && (
        <Card className="border border-primary bg-primary/5 hover:border-blue-700 duration-500 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center flex-wrap justify-between pb-2">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Analyse : {selectedStudentForChart?.name || 'N/A'}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedStudentForChart(null)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData(selectedStudentForChart)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line name="Score" type="monotone" dataKey="studentScore" stroke="#2563eb" strokeWidth={3} />
                <Line name="Class Avg" type="monotone" dataKey="classAverage" stroke="#94a3b8" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="list" className="gap-2 hover:text-primary hover:bg-white/50 transition-all duration-300"><ListFilter className="w-4 h-4" /> Liste</TabsTrigger>
          <TabsTrigger value="gradebook" className="gap-2 hover:text-primary hover:bg-white/50 transition-all duration-300"><LayoutGrid className="w-4 h-4" /> Carnet de notes</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2 hover:text-primary hover:bg-white/50 transition-all duration-300"><FileSpreadsheet className="w-4 h-4" /> Saisie groupée</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par ID étudiant..."
              className="pl-9"
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
            />
          </div>
          <div className="rounded-md border shadow-sm">
            {/* Sticky header + 10-row scrollable body */}
            <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Classe</TableHead>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Évaluation (Terme)</TableHead>
                    <TableHead className="text-center">Poids</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Note</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedResults.length > 0 ? displayedResults.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.exam?.classe?.name ?? '—'}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{r.student?.username || r.student?.name || 'Unknown Student'}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{r?.student?.userId || 'N/A'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r?.exam?.name || 'N/A'}</div>
                        <div className="text-[10px] font-bold uppercase text-blue-700">
                          <span className="bg-blue-100">{r?.exam?.term || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-500">{r.exam?.weight ?? 0}%</TableCell>
                      <TableCell className="text-center font-bold text-base">{r.marks}</TableCell>
                      <TableCell className="text-center">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-black">{calculateLetterGrade(r.marks)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-center w-fit ${r.status === 'DRAFT' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {r.status}
                          </span>
                          {r?.exam?.locked && <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400"><Lock className="w-2.5 h-2.5" /> VERROUILLÉ</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {r?.exam?.locked ? <BadgeCheck className="w-5 h-5 ml-auto text-slate-300" /> :
                          <Button variant="ghost" size="sm" onClick={() => { setEditingResult(r); setIsDialogOpen(true) }}>Modifier</Button>}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground italic">
                      {filterStudentId.trim() ? `Aucun résultat ne correspond à "${filterStudentId}".` : 'Aucun résultat trouvé.'}
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Row count footer */}
            {displayedResults.length > 0 && (
              <div className="border-t px-4 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                <span>Affichage de {displayedResults.length} résultat{displayedResults.length !== 1 ? 's' : ''}{filterStudentId.trim() ? ` correspondant à "${filterStudentId}"` : ''}</span>
                {filterStudentId.trim() && results.length !== displayedResults.length && (
                  <span>{results.length - displayedResults.length} caché{results.length - displayedResults.length !== 1 ? 's' : ''} par le filtre</span>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gradebook">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Matrice de Performance</CardTitle></div>
              {selectedClassId !== 'all' && reportData.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const selectedClass = classes.find((c: any) => String(c.id) === selectedClassId);
                    exportGradebookPDF(reportData, exams, selectedClass?.name || selectedClassId);
                  }}
                >
                  <Download className="w-4 h-4" /> Export
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {selectedClassId === 'all' ? <p className="text-center py-20 text-muted-foreground italic">Sélectionnez une classe pour afficher la matrice.</p> : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Étudiant</TableHead>
                        {exams.map(e => <TableHead key={e.id} className="text-center">{e?.name || 'N/A'} ({e.weight}%)</TableHead>)}
                        <TableHead className="text-right font-black">Moyenne Pondérée</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map(s => {
                        const total = Object.values(s.marks).reduce((acc: number, curr: any) => acc + (curr.val || 0), 0);
                        const avg = exams.length > 0 ? (total / exams.length).toFixed(1) : '0';
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedStudentForChart(s)}>
                              <div className="font-bold">{s?.name || 'N/A'}</div>
                              <div className="text-[10px] text-muted-foreground">{s?.userId || 'N/A'}</div>
                            </TableCell>
                            {exams.map(e => (
                              <TableCell key={e.id} className="text-center">
                                <div className={s.marks[e.id]?.val < 50 ? 'text-red-500 font-bold' : ''}>{s.marks[e.id]?.val ?? '-'}</div>
                                <div className="text-[9px] text-muted-foreground">{calculateLetterGrade(s.marks[e.id]?.val)}</div>
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-black text-primary">{avg}%</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle> Saisie groupée</CardTitle>
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button variant="ghost" onClick={() => { setIsEditMode(false); setPendingChanges({}); }}><X className="w-4 h-4 mr-2" /> Annuler</Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={saveBulk}><Save className="w-4 h-4 mr-2" /> Sauvegarder les brouillons</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditMode(true)} disabled={selectedClassId === 'all'}><Edit3 className="w-4 h-4 mr-2" /> Démarrer l'édition</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedClassId === 'all' ? <p className="text-center py-20 text-muted-foreground italic">Sélectionnez une classe pour activer la saisie groupée.</p> : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Étudiant</TableHead>
                        {exams.map(e => <TableHead key={e.id} className="text-center">{e?.name || 'N/A'}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s?.name || 'N/A'}</TableCell>
                          {exams.map(e => (
                            <TableCell key={e.id} className="text-center">
                              {isEditMode && !e.locked ? (
                                <Input
                                  type="number"
                                  className="w-20 mx-auto h-8 text-center"
                                  defaultValue={s.marks[e.id]?.val}
                                  onChange={(el) => setPendingChanges((prev: any) => ({ ...prev, [`${s.id}-${e.id}`]: el.target.value }))}
                                />
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  {s.marks[e.id]?.val ?? '-'}
                                  {e.locked && <Lock className="w-3 h-3 text-slate-300" />}
                                </div>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingResult ? 'Modifier l\'évaluation' : 'Nouvelle entrée de notes'}</DialogTitle></DialogHeader>
          <ResultForm
            result={editingResult}
            existingResults={results}
            onFinished={() => {
              setIsDialogOpen(false);
              fetchResultsList();
              fetchGradebookData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

