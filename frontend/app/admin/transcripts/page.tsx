/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FileText, Search, Printer, Download,
  RefreshCcw, Loader2, BookOpen,
  Award, GraduationCap, CheckSquare, Square,
  Building2, Phone, Mail, UserCheck, Eye, ArrowLeft, Plus,
  Sparkles, Calculator, Users, TrendingUp, CheckCircle2,
  AlertCircle, Layers, Check, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const loadLogo = (): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.src = '/logo/2cslogo.jpeg';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 200;
      canvas.height = img.naturalHeight || img.height || 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        const r = canvas.width / 2;
        ctx.arc(r, r, r, 0, 2 * Math.PI);
        ctx.clip();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      const roundedImg = new window.Image();
      roundedImg.src = canvas.toDataURL('image/png');
      roundedImg.onload = () => resolve(roundedImg);
      roundedImg.onerror = (err) => reject(err);
    };
    img.onerror = (err) => reject(err);
  });
};

export default function AdminTranscriptsPage() {
  // --- STATE ---
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('all');
  const [selectedSemesterIds, setSelectedSemesterIds] = useState<number[]>([]);
  const [selectedTermIds, setSelectedTermIds] = useState<number[]>([]);

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalculatingClass, setRecalculatingClass] = useState(false);

  // Automated Engine Live State
  const [autoEngineData, setAutoEngineData] = useState<any | null>(null);
  const [loadingEngine, setLoadingEngine] = useState(false);

  // Active Transcript Data for Preview & Export
  const [transcriptData, setTranscriptData] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Transcripts Registry Ledger
  const [issuedTranscripts, setIssuedTranscripts] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Active Tab: 'auto' is primary default
  const [activeTab, setActiveTab] = useState<'auto' | 'ledger' | 'compile' | 'preview'>('auto');

  // --- INITIAL DATA SYNC ---
  const loadFilterData = async () => {
    setLoading(true);
    try {
      const [usersRes, classesRes, yearsRes, semestersRes, termsRes] = await Promise.all([
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/classes'),
        api.get('/academic-years?pagination[pageSize]=100'),
        api.get('/semesters?pagination[pageSize]=100&populate=academicYear'),
        api.get('/terms?pagination[pageSize]=100&populate=semester')
      ]);

      const loadedStudents = usersRes.data || [];
      const loadedClasses = classesRes.data || [];
      const loadedYears = yearsRes.data?.data || [];
      const loadedSemesters = semestersRes.data?.data || [];
      const loadedTerms = termsRes.data?.data || [];

      setStudents(loadedStudents);
      setClasses(loadedClasses);
      setAcademicYears(loadedYears);
      setSemesters(loadedSemesters);
      setTerms(loadedTerms);

      // Auto-select active or first academic year
      if (loadedYears.length > 0 && selectedYearId === 'all') {
        const activeYear = loadedYears.find((y: any) => y.isActive || y.isCurrent) || loadedYears[0];
        setSelectedYearId(String(activeYear.id));
      }
    } catch (error) {
      toast.error('Échec de la synchronisation des bases de données du registre');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  // --- LOAD TRANSCRIPTS LEDGER ---
  const loadIssuedTranscripts = useCallback(async (studentId: string) => {
    if (!studentId) {
      setIssuedTranscripts([]);
      return;
    }
    setLoadingLedger(true);
    try {
      const res = await api.get(`/admin/transcripts/student/${studentId}`);
      setIssuedTranscripts(res.data || []);
    } catch (err) {
      toast.error('Échec du chargement du registre des relevés de notes');
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  // --- LOAD LIVE AUTOMATED ENGINE CALCULATION ---
  const fetchAutoEngineData = useCallback(async (studentId: string, yearId: string) => {
    if (!studentId || !yearId || yearId === 'all') {
      setAutoEngineData(null);
      return;
    }
    setLoadingEngine(true);
    try {
      const res = await api.get(`/admin/transcripts/auto?studentId=${studentId}&academicYearId=${yearId}`);
      setAutoEngineData(res.data);
    } catch (err: any) {
      console.error('Erreur lors du calcul automatique:', err);
      // If no calculation exists yet, keep state empty without blocking UI
      setAutoEngineData(null);
    } finally {
      setLoadingEngine(false);
    }
  }, []);

  // Sync on student or year selection change
  useEffect(() => {
    if (selectedStudentId) {
      loadIssuedTranscripts(selectedStudentId);
      if (selectedYearId && selectedYearId !== 'all') {
        fetchAutoEngineData(selectedStudentId, selectedYearId);
      }
      if (activeTab === 'preview') {
        setActiveTab('auto');
      }
    } else {
      setIssuedTranscripts([]);
      setAutoEngineData(null);
      setTranscriptData(null);
      setActiveTab('auto');
    }
  }, [selectedStudentId, selectedYearId, loadIssuedTranscripts, fetchAutoEngineData]);

  // --- FILTERED ARRAYS ---
  const classFilteredStudents = useMemo(() => {
    if (selectedClassId === 'all') return students;
    const selectedClass = classes.find(c => String(c.id) === selectedClassId);
    if (!selectedClass || !selectedClass.students) return [];
    const studentIdsInClass = selectedClass.students.map((s: any) => s.id);
    return students.filter(s => studentIdsInClass.includes(s.id));
  }, [students, classes, selectedClassId]);

  const searchedStudents = useMemo(() => {
    const query = studentSearchQuery.toLowerCase().trim();
    if (!query) return classFilteredStudents;
    return classFilteredStudents.filter(s =>
      s.username?.toLowerCase().includes(query) ||
      s.email?.toLowerCase().includes(query) ||
      s.userId?.toLowerCase().includes(query)
    );
  }, [classFilteredStudents, studentSearchQuery]);

  const filteredSemesters = useMemo(() => {
    if (selectedYearId === 'all') return semesters;
    return semesters.filter(s => String(s.academicYear?.id) === selectedYearId);
  }, [semesters, selectedYearId]);

  const filteredTerms = useMemo(() => {
    if (selectedSemesterIds.length === 0) return terms;
    return terms.filter(t => selectedSemesterIds.includes(t.semester?.id));
  }, [terms, selectedSemesterIds]);

  // --- TOGGLE HANDLERS ---
  const toggleSemester = (id: number) => {
    setSelectedSemesterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleTerm = (id: number) => {
    setSelectedTermIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSelectedClassId('all');
    setSelectedStudentId('');
    if (academicYears.length > 0) {
      setSelectedYearId(String(academicYears[0].id));
    } else {
      setSelectedYearId('all');
    }
    setSelectedSemesterIds([]);
    setSelectedTermIds([]);
    setStudentSearchQuery('');
    setTranscriptData(null);
    setAutoEngineData(null);
    setIssuedTranscripts([]);
    setActiveTab('auto');
    toast.success('Les filtres ont été réinitialisés avec succès');
  };

  // --- AUTOMATED ENGINE ACTIONS ---

  // 1. Recalculate Student with Centralized Calculation Engine
  const handleRecalculateStudent = async () => {
    if (!selectedStudentId) {
      toast.error('Veuillez sélectionner un étudiant');
      return;
    }
    const yearId = selectedYearId !== 'all' ? selectedYearId : (academicYears[0]?.id ? String(academicYears[0].id) : null);
    if (!yearId) {
      toast.error('Veuillez sélectionner une année scolaire valide');
      return;
    }

    setRecalculating(true);
    try {
      const res = await api.post(`/admin/recalculate/student/${selectedStudentId}?academicYearId=${yearId}`);
      toast.success(`Notes recalculées avec succès (${res.data?.updated || 0} évaluations synchronisées)`);
      await fetchAutoEngineData(selectedStudentId, yearId);
      await loadIssuedTranscripts(selectedStudentId);
    } catch (err: any) {
      toast.error('Échec du recalcul: ' + (err?.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  // 2. Batch Recalculate Whole Class
  const handleRecalculateClass = async () => {
    if (selectedClassId === 'all') {
      toast.error('Veuillez sélectionner une classe spécifique');
      return;
    }
    const yearId = selectedYearId !== 'all' ? selectedYearId : (academicYears[0]?.id ? String(academicYears[0].id) : null);
    if (!yearId) {
      toast.error('Veuillez sélectionner une année scolaire');
      return;
    }

    setRecalculatingClass(true);
    try {
      const res = await api.post(`/admin/recalculate/class/${selectedClassId}?academicYearId=${yearId}`);
      toast.success(`Recalcul de classe réussi: ${res.data?.studentsProcessed || 0} étudiants traités (${res.data?.totalUpdated || 0} notes)`);
      if (selectedStudentId) {
        await fetchAutoEngineData(selectedStudentId, yearId);
        await loadIssuedTranscripts(selectedStudentId);
      }
    } catch (err: any) {
      toast.error('Échec du recalcul par lot: ' + (err?.response?.data?.error || err.message));
      console.error(err);
    } finally {
      setRecalculatingClass(false);
    }
  };

  // 3. Automated Transcript Generation (Instant Delivery & Registry Logging)
  const handleGenerateAuto = async () => {
    if (!selectedStudentId) {
      toast.error('Veuillez sélectionner un étudiant en premier');
      return;
    }
    const yearId = selectedYearId !== 'all' ? selectedYearId : (academicYears[0]?.id ? String(academicYears[0].id) : null);
    if (!yearId) {
      toast.error('Veuillez sélectionner une année scolaire');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.get(`/admin/transcripts/auto?studentId=${selectedStudentId}&academicYearId=${yearId}&save=true`);
      const data = response.data;
      setTranscriptData(data);
      setAutoEngineData(data);
      toast.success('Relevé de notes officiel généré et enregistré au registre avec succès');
      await loadIssuedTranscripts(selectedStudentId);
      setActiveTab('preview');
    } catch (error: any) {
      toast.error('Échec de la génération automatisée: ' + (error?.response?.data?.error || error.message));
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // 4. Custom Manual Compilation (Legacy / Custom terms picker)
  const handleGenerateCustom = async () => {
    if (!selectedStudentId) {
      toast.error('Veuillez sélectionner un étudiant en premier');
      return;
    }
    setGenerating(true);
    try {
      const params = new URLSearchParams();
      params.append('studentId', selectedStudentId);
      if (selectedYearId !== 'all') params.append('academicYearId', selectedYearId);
      if (selectedClassId !== 'all') params.append('classId', selectedClassId);
      if (selectedSemesterIds.length > 0) params.append('semesterIds', selectedSemesterIds.join(','));
      if (selectedTermIds.length > 0) params.append('termIds', selectedTermIds.join(','));
      params.append('save', 'true');

      const response = await api.get(`/admin/transcripts/generate?${params.toString()}`);
      setTranscriptData(response.data);
      toast.success('Le relevé personnalisé a été compilé et enregistré avec succès');
      await loadIssuedTranscripts(selectedStudentId);
      setActiveTab('preview');
    } catch (error) {
      toast.error('Échec de la compilation manuelle');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // View existing transcript from ledger (read-only, no save param)
  const handleViewTranscript = async (t: any) => {
    setGenerating(true);
    try {
      if (t.referenceNumber?.startsWith('TR-AUTO-') && t.academicYear?.id) {
        const response = await api.get(`/admin/transcripts/auto?studentId=${selectedStudentId}&academicYearId=${t.academicYear.id}`);
        setTranscriptData(response.data);
        setActiveTab('preview');
        return;
      }

      const semesterIdsParam = t.semesters?.map((s: any) => s.id).join(',');
      const termIdsParam = t.terms?.map((tm: any) => tm.id).join(',');

      const params = new URLSearchParams();
      params.append('studentId', selectedStudentId);
      if (t.academicYear?.id) params.append('academicYearId', String(t.academicYear.id));
      if (t.class?.id) params.append('classId', String(t.class.id));
      if (semesterIdsParam) params.append('semesterIds', semesterIdsParam);
      if (termIdsParam) params.append('termIds', termIdsParam);

      const response = await api.get(`/admin/transcripts/generate?${params.toString()}`);
      setTranscriptData(response.data);
      setActiveTab('preview');
    } catch (err) {
      toast.error('Erreur lors du rendu du relevé de notes');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Delete transcript from registry
  const handleDeleteTranscript = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce relevé de notes du registre officiel ?')) {
      return;
    }
    try {
      try {
        await api.delete(`/admin/transcripts/${id}`);
      } catch (adminErr) {
        await api.delete(`/transcripts/${id}`);
      }
      toast.success('Relevé de notes supprimé du registre avec succès');
      if (selectedStudentId) {
        await loadIssuedTranscripts(selectedStudentId);
      }
    } catch (err: any) {
      toast.error('Erreur lors de la suppression: ' + (err?.response?.data?.error || err.message));
      console.error(err);
    }
  };

  // --- QR CODE GENERATOR ---
  useEffect(() => {
    if (transcriptData) {
      const qrData = {
        name: transcriptData.student?.name,
        studentId: transcriptData.student?.userId || String(transcriptData.student?.id),
        academicYear: (transcriptData.metadata?.academicYears || []).join(', ') || transcriptData.academicYear?.name || 'N/A',
        status: 'Validé par l\'administration',
        referenceNumber: transcriptData.metadata?.referenceNumber || transcriptData.referenceNumber || 'N/A'
      };

      const qrString = `RELEVE DE NOTES OFFICIEL DE 2CSCOMPLEXE SCOLAIRE\n` +
        `Ref: ${qrData.referenceNumber}\n` +
        `Nom et prénoms: ${qrData.name}\n` +
        `Matricule: ${qrData.studentId}\n` +
        `Année scolaire: ${qrData.academicYear}\n` +
        `Statut: ${qrData.status}`;

      QRCode.toDataURL(qrString, { margin: 2, scale: 4 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Erreur lors de la génération du QR code', err));
    } else {
      setQrCodeUrl('');
    }
  }, [transcriptData]);

  // --- PDF EXPORT ---
  const handleDownloadPDF = async () => {
    if (!transcriptData) return;
    try {
      const doc = new jsPDF() as any;
      const s = transcriptData.student || {};
      const sch = transcriptData.school || { name: '2CSCOMPLEXE SCOLAIRE', address: '', email: '', phone: '' };
      const sum = transcriptData.summary || { totalSubjectsCount: 0, weightedAverageScore: 0, gpa: 0 };
      const meta = transcriptData.metadata || { referenceNumber: 'N/A', generationDate: 'N/A', semesters: [], terms: [] };

      // Load school logo
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadLogo();
      } catch (e) {
        console.error("Failed to load school logo", e);
      }

      // Header Branding (School Royal Blue: #2B4C7E)
      doc.setFillColor(43, 76, 126);
      doc.rect(0, 0, 210, 45, 'F');

      if (logoImg) {
        doc.addImage(logoImg, 'JPEG', 14, 10, 25, 25);
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(18);
        doc.text((sch.name || '2CSCOMPLEXE SCOLAIRE').toUpperCase(), 45, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(200, 220, 245);
        doc.text(`Relevé de notes officiel • Système de Registre Académique`, 45, 25);
        doc.text(`Adresse: ${sch.address || ''} | Email: ${sch.email || ''} | Téléphone: ${sch.phone || ''}`, 45, 31);
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(20);
        doc.text((sch.name || '2CSCOMPLEXE SCOLAIRE').toUpperCase(), 14, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 220, 245);
        doc.text(`Relevé de notes officiel • Système de Registre Académique`, 14, 25);
        doc.text(`Adresse: ${sch.address || ''} | Email: ${sch.email || ''} | Téléphone: ${sch.phone || ''}`, 14, 32);
      }

      // Document Title
      doc.setTextColor(43, 76, 126);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('RELEVE DE NOTES OFFICIEL', 14, 55);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 58, 196, 58);

      // Student Information Grid
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PROFIL DE L\'ÉTUDIANT', 14, 66);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nom: ${s.name || 'N/A'}`, 14, 72);
      doc.text(`ID: ${s.userId || 'N/A'}`, 14, 78);
      doc.text(`Email: ${s.email || 'N/A'}`, 14, 84);

      const classNames = (s.classes || []).join(', ') || 'N/A';
      doc.text(`Classe: ${classNames}`, 120, 72);
      const bDate = s.birthDate ? new Date(s.birthDate).toLocaleDateString('fr-FR') : 'N/A';
      doc.text(`Date de naissance: ${bDate}`, 120, 78);
      doc.text(`Téléphone: ${s.phoneNumber || 'N/A'}`, 120, 84);

      // Metadata Grid
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 90, 182, 19, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 90, 182, 19, 'S');

      // Subtle vertical dividers
      doc.setDrawColor(235, 240, 245);
      doc.line(90, 92, 90, 107);
      doc.line(135, 92, 135, 107);
      doc.line(168, 92, 168, 107);

      // Col 1: Reference Number
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('NUMÉRO DE RÉFÉRENCE', 18, 95);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const refText = doc.splitTextToSize(meta.referenceNumber || 'N/A', 70);
      doc.text(refText, 18, 101);

      // Col 2: Date of Issue
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('DATE D\'ÉMISSION', 94, 95);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const dateText = doc.splitTextToSize(meta.generationDate || 'N/A', 38);
      doc.text(dateText, 94, 101);

      // Col 3: Semesters
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('SEMESTRES', 139, 95);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const semsText = doc.splitTextToSize((meta.semesters || []).join(', ') || 'Tous les semestres', 27);
      doc.text(semsText, 139, 101);

      // Col 4: Terms
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TRIMESTRES', 172, 95);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      const termsText = doc.splitTextToSize((meta.terms || []).length > 0 ? (meta.terms || []).join(', ') : 'Tous les trimestres', 22);
      doc.text(termsText, 172, 101);

      // Results Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('RÉSUMÉ DES PERFORMANCES ACADÉMIQUES', 14, 116);

      const tableBody = (transcriptData.results || []).map((r: any) => [
        r.subjectName || 'N/A',
        r.className || 'N/A',
        r.examName || '—',
        `${r.semester || 'N/A'} (${r.term || 'N/A'})`,
        `${r.marks != null ? r.marks : '—'}%`,
        r.letterGrade || 'N/A',
        r.remarks || '—'
      ]);

      autoTable(doc, {
        startY: 120,
        head: [['Nom de la matière', 'Classe', 'Évaluation', 'Période', 'Note %', 'Mention', 'Observations']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [43, 76, 126] as any, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 42 }
        }
      });

      let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 170;

      if (currentY + 75 > 280) {
        doc.addPage();
        currentY = 20;
      }

      // Summary Index Card
      doc.setFillColor(43, 76, 126);
      doc.rect(14, currentY, 182, 28, 'F');

      doc.setFillColor(110, 190, 68);
      doc.rect(132, currentY + 2, 60, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('MATIÈRES ÉVALUÉES', 20, currentY + 8);
      doc.text('MOYENNE PONDÉRÉE', 70, currentY + 8);
      doc.text('GPA CUMULATIF (4.00)', 136, currentY + 8);

      doc.setFontSize(18);
      doc.text(String(sum.totalSubjectsCount || 0), 20, currentY + 18);
      doc.text(`${sum.weightedAverageScore || 0}%`, 70, currentY + 18);
      doc.text(typeof sum.gpa === 'number' ? sum.gpa.toFixed(2) : '0.00', 136, currentY + 18);

      doc.setFontSize(7.5);
      doc.setTextColor(200, 220, 245);
      doc.text('Domaines évalués', 20, currentY + 24);
      doc.text('Note globale calculée', 70, currentY + 24);
      doc.setTextColor(240, 253, 244);
      doc.text('Barème 4.00 standard', 136, currentY + 24);

      // Signatures and QR Code Block
      const sigY = Math.max(235, currentY + 36);
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, sigY + 14, 74, sigY + 14);
      doc.text('BUREAU DU REGISTRAIRE', 14, sigY + 19);

      doc.line(136, sigY + 14, 196, sigY + 14);
      doc.text('SIGNATURE DE LA DIRECTION', 136, sigY + 19);

      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
        doc.setFontSize(6.5);
        doc.text('VÉRIFICATION OFFICIELLE', 105, sigY + 26, { align: 'center' });
      }

      const safeName = (s.name || 'etudiant').replace(/\s+/g, '_').toLowerCase();
      doc.save(`releve_notes_${safeName}.pdf`);
      toast.success('Le relevé de notes officiel a été téléchargé avec succès');
    } catch (err) {
      console.error('La génération du PDF a échoué:', err);
      toast.error('La génération du PDF a échoué. Veuillez réessayer.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center leading-relaxed">
        Synchronisation des bases de données du registre...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-6 print:p-0 print:bg-white">
      {/* Header Section */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:hidden">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <GraduationCap size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Centre des Dossiers & Moteur d'Évaluation</span>
          </div>
          <h1 className="text-[clamp(1.4rem,3vw,3.2rem)] font-black text-slate-900 tracking-tighter uppercase italic">
            Relevés de notes <span className="text-primary">Automatisés.</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={loadFilterData}
            variant="outline"
            className="rounded-2xl h-12 w-12 p-0 border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCcw size={18} className="text-slate-600" />
          </Button>
          <Button
            onClick={resetFilters}
            variant="outline"
            className="rounded-2xl h-12 px-6 border-slate-200 bg-white hover:bg-slate-50 transition-all font-black text-[10px] tracking-widest uppercase shadow-sm"
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Filters Panel (Left 4 cols) */}
        <section className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6 print:hidden">
          <div className="space-y-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-primary" /> Filtres & Sélection
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ciblez la classe, l'année et l'étudiant</p>
          </div>

          <div className="space-y-4">
            {/* Academic Year Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Année scolaire</label>
              <Select value={selectedYearId} onValueChange={setSelectedYearId}>
                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold h-12">
                  <SelectValue placeholder="Sélectionner l'année scolaire" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={String(y.id)} className="font-bold">
                      {y.name} {y.isActive ? '• (En cours)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Classe</label>
              <Select value={selectedClassId} onValueChange={(val) => { setSelectedClassId(val); setSelectedStudentId(''); }}>
                <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 font-bold h-12">
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="all" className="font-bold">Toutes les classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={String(c.id)} className="font-bold">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Student Search & List */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sélectionner un étudiant</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <Input
                  placeholder="Rechercher par nom ou matricule..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="h-12 pl-11 rounded-xl bg-slate-50 border-none font-bold placeholder-slate-300"
                />
              </div>
              <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl mt-2 p-1.5 space-y-1 bg-slate-50/50">
                {searchedStudents.length > 0 ? (
                  searchedStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudentId(String(student.id))}
                      className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        selectedStudentId === String(student.id)
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-950/10'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{student.username || student.name}</div>
                        <div className={`text-[9px] uppercase mt-0.5 ${
                          selectedStudentId === String(student.id) ? 'text-blue-300' : 'text-slate-400'
                        }`}>
                          Matricule: {student.userId || 'Aucun ID'}
                        </div>
                      </div>
                      {selectedStudentId === String(student.id) && <UserCheck size={16} className="text-blue-400 animate-pulse" />}
                    </button>
                  ))
                ) : (
                  <p className="text-center py-6 text-slate-400 font-medium italic text-[11px]">Aucun étudiant trouvé</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Batch Action */}
          {selectedClassId !== 'all' && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Opérations par lot</label>
              <Button
                onClick={handleRecalculateClass}
                disabled={recalculatingClass}
                variant="outline"
                className="w-full h-11 rounded-xl border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 font-bold text-[10px] uppercase tracking-wider transition-all"
              >
                {recalculatingClass ? <Loader2 className="animate-spin mr-2" size={14} /> : <Users className="mr-2" size={14} />}
                Recalculer Toute la Classe
              </Button>
            </div>
          )}
        </section>

        {/* Right Main Panel */}
        <section className="lg:col-span-8 space-y-6">
          {!selectedStudentId ? (
            <Card className="sm:h-[480px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white p-10 print:hidden">
              <div className="p-6 bg-[#F8FAFC] border border-slate-100 shadow-xl rounded-3xl mb-6 text-slate-400">
                <FileText size={44} className="animate-bounce text-primary" />
              </div>
              <h3 className="text-xl text-center font-black text-slate-900 uppercase tracking-tight">Aucun étudiant sélectionné</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center mt-2 max-w-sm">
                Sélectionnez un étudiant dans la liste pour activer le moteur d'évaluation automatisé et générer son relevé officiel.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Navigation Tabs Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 print:hidden shadow-sm">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setActiveTab('auto')}
                    variant={activeTab === 'auto' ? 'default' : 'outline'}
                    className={`rounded-xl font-black text-xs uppercase tracking-wider px-4 h-11 ${
                      activeTab === 'auto' ? 'bg-primary text-white shadow-md' : 'bg-white'
                    }`}
                  >
                    <Sparkles size={14} className="mr-1.5 text-amber-300" /> Moteur Automatisé
                  </Button>
                  <Button
                    onClick={() => setActiveTab('ledger')}
                    variant={activeTab === 'ledger' ? 'default' : 'outline'}
                    className={`rounded-xl font-bold text-xs uppercase tracking-wider px-4 h-11 ${
                      activeTab === 'ledger' ? 'bg-slate-900 text-white shadow-md' : 'bg-white'
                    }`}
                  >
                    Registre Officiel ({issuedTranscripts.length})
                  </Button>
                  <Button
                    onClick={() => setActiveTab('compile')}
                    variant={activeTab === 'compile' ? 'default' : 'outline'}
                    className={`rounded-xl font-bold text-xs uppercase tracking-wider px-4 h-11 ${
                      activeTab === 'compile' ? 'bg-slate-900 text-white shadow-md' : 'bg-white'
                    }`}
                  >
                    <Plus size={14} className="mr-1" /> Compilation Manuelle
                  </Button>
                </div>

                {activeTab === 'preview' && (
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveTab('auto')} variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-wider h-11">
                      <ArrowLeft size={14} className="mr-1" /> Retour au Moteur
                    </Button>
                    <Button onClick={handlePrint} variant="outline" className="rounded-xl font-bold text-xs uppercase tracking-wider h-11">
                      <Printer size={14} className="mr-1 text-slate-600" /> Imprimer
                    </Button>
                    <Button onClick={handleDownloadPDF} className="bg-primary hover:bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider h-11">
                      <Download size={14} className="mr-1" /> Télécharger PDF
                    </Button>
                  </div>
                )}
              </div>

              {/* Tab Content Views */}
              <AnimatePresence mode="wait">
                {/* 1. PRIMARY AUTOMATED ENGINE HUB */}
                {activeTab === 'auto' && (
                  <motion.div
                    key="auto-engine"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Hero Engine Card */}
                    <Card className="rounded-[2.5rem] border border-blue-100 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <GraduationCap size={200} />
                      </div>
                      <CardContent className="p-8 space-y-6 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-[#6EBE44] text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 border-none">
                                Moteur V2.0 Actif
                              </Badge>
                              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 font-bold text-[9px] uppercase">
                                Calcul Pondéré Automatique
                              </Badge>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mt-1">
                              Moteur d'Évaluation & Relevés Automatisés
                            </h2>
                            <p className="text-xs text-blue-200/80 font-medium">
                              Calcul en temps réel basé sur les barèmes académiques, coefficients et catégories d'évaluation.
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={handleRecalculateStudent}
                              disabled={recalculating || loadingEngine}
                              variant="outline"
                              className="rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white font-black text-[10px] uppercase tracking-wider h-12 px-4 backdrop-blur-sm"
                            >
                              {recalculating ? <Loader2 className="animate-spin mr-1.5" size={15} /> : <Calculator className="mr-1.5 text-blue-300" size={15} />}
                              Recalculer les Notes
                            </Button>
                            <Button
                              onClick={handleGenerateAuto}
                              disabled={generating || loadingEngine}
                              className="rounded-xl bg-[#6EBE44] hover:bg-green-600 text-white font-black text-[10px] uppercase tracking-wider h-12 px-6 shadow-lg shadow-green-900/30"
                            >
                              {generating ? <Loader2 className="animate-spin mr-1.5" size={15} /> : <Sparkles className="mr-1.5" size={15} />}
                              Générer & Délivrer le Relevé
                            </Button>
                          </div>
                        </div>

                        {/* Live KPI Cards */}
                        {loadingEngine ? (
                          <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="animate-spin text-blue-400" size={32} />
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Calcul des performances en cours...</p>
                          </div>
                        ) : autoEngineData?.annualResult ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Moyenne Annuelle</p>
                              <p className="text-3xl font-black text-white mt-1">
                                {autoEngineData.annualResult.annualAverage}%
                              </p>
                              <p className="text-[10px] font-bold text-blue-200/70 mt-1">Sur 100% pondéré</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#6EBE44]">GPA Cumulatif</p>
                              <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-3xl font-black text-white">
                                  {Number(autoEngineData.annualResult.annualGPA || 0).toFixed(2)}
                                </p>
                                <Badge className="bg-[#2B4C7E] text-white font-black text-[10px] px-1.5 py-0">
                                  {autoEngineData.annualResult.annualGrade || 'N/A'}
                                </Badge>
                              </div>
                              <p className="text-[10px] font-bold text-blue-200/70 mt-1">Échelle 4.00 standard</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                              <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Matières Évaluées</p>
                              <p className="text-3xl font-black text-white mt-1">
                                {autoEngineData.annualResult.totalSubjects || 0}
                              </p>
                              <p className="text-[10px] font-bold text-blue-200/70 mt-1">Matières complétées</p>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                              <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">Périodes Analysées</p>
                              <p className="text-3xl font-black text-white mt-1">
                                {autoEngineData.annualResult.periodsWithData || autoEngineData.annualResult.totalPeriods || 0}
                              </p>
                              <p className="text-[10px] font-bold text-blue-200/70 mt-1">Semestres avec notes</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-blue-200 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider">Aucun calcul préliminaire trouvé pour cette année</p>
                            <p className="text-[11px] text-blue-300/70 max-w-md mx-auto">
                              Cliquez sur &quot;Recalculer les Notes&quot; pour compiler immédiatement toutes les évaluations, devoirs et examens de l'étudiant.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Detailed Live Breakdown by Periods & Subjects */}
                    {autoEngineData?.annualResult?.periodResults && autoEngineData.annualResult.periodResults.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <TrendingUp size={16} className="text-primary" /> Matrice des Résultats par Période
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Année: {autoEngineData.academicYear?.name}
                          </span>
                        </div>

                        {autoEngineData.annualResult.periodResults.map((period: any, pIdx: number) => (
                          <Card key={period.semesterId || pIdx} className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 p-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                                  P{pIdx + 1}
                                </span>
                                <div>
                                  <h4 className="font-black text-slate-800 text-sm">{period.semesterName || `Période ${pIdx + 1}`}</h4>
                                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                                    {period.subjectCount || (period.subjectResults || []).length} matière(s) évaluée(s)
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-[8px] font-black uppercase text-slate-400">Moyenne Période</p>
                                  <p className="text-sm font-black text-slate-900">{period.periodAverage || 0}%</p>
                                </div>
                                <div className="text-right pl-4 border-l border-slate-200">
                                  <p className="text-[8px] font-black uppercase text-slate-400">GPA Période</p>
                                  <p className="text-sm font-black text-blue-600">{Number(period.periodGPA || 0).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-0">
                              {period.subjectResults && period.subjectResults.length > 0 ? (
                                <Table>
                                  <TableHeader className="bg-white">
                                    <TableRow className="border-slate-100">
                                      <TableHead className="font-black text-[9px] uppercase tracking-wider text-slate-400 pl-6">Matière</TableHead>
                                      <TableHead className="font-black text-[9px] uppercase tracking-wider text-slate-400">Détail des Évaluations</TableHead>
                                      <TableHead className="font-black text-[9px] uppercase tracking-wider text-slate-400 text-center">Score Pondéré</TableHead>
                                      <TableHead className="font-black text-[9px] uppercase tracking-wider text-slate-400 text-center">Mention</TableHead>
                                      <TableHead className="font-black text-[9px] uppercase tracking-wider text-slate-400 text-right pr-6">Statut</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {period.subjectResults.map((subj: any, sIdx: number) => (
                                      <TableRow key={subj.subjectId || sIdx} className="hover:bg-slate-50/50 border-slate-100">
                                        <TableCell className="pl-6 font-bold text-slate-800 text-xs py-3.5">
                                          <div>{subj.subjectName || 'Matière'}</div>
                                          <div className="text-[9px] font-mono text-slate-400 uppercase">{subj.subjectCode || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-600 py-3.5 max-w-[240px]">
                                          {subj.scoreBreakdown && subj.scoreBreakdown.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                              {subj.scoreBreakdown.map((sb: any, bIdx: number) => (
                                                <span key={bIdx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600">
                                                  {sb.category || sb.categoryCode}: {sb.avgScore != null ? sb.avgScore : (sb.rawScore != null ? sb.rawScore : '—')}/{sb.maxScore}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-slate-300 italic text-[10px]">Aucun détail</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-900 text-xs py-3.5">
                                          {subj.percentage != null ? `${subj.percentage}%` : '—'}
                                        </TableCell>
                                        <TableCell className="text-center py-3.5">
                                          <Badge className="bg-slate-900 text-white font-black text-[9px] px-2 py-0.5 rounded-md border-none">
                                            {subj.letterGrade || 'N/A'} ({Number(subj.gradePoint || 0).toFixed(1)})
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 py-3.5">
                                          {subj.hasScores ? (
                                            <span className="inline-flex items-center text-[10px] font-bold text-green-600 gap-1">
                                              <CheckCircle2 size={12} /> Validé
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold text-slate-400 italic">En attente</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="p-6 text-center text-xs text-slate-400 italic">
                                  Aucune note enregistrée pour cette période.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                )}

                {/* 2. OFFICIAL TRANSCRIPTS REGISTRY LEDGER */}
                {activeTab === 'ledger' && (
                  <motion.div
                    key="ledger"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
                      <CardContent className="p-8">
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Registre Officiel des Relevés</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historique des documents officiels émis et vérifiés par QR Code</p>
                          </div>
                          <Button
                            onClick={handleGenerateAuto}
                            disabled={generating}
                            className="bg-primary hover:bg-slate-900 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider h-10 px-4"
                          >
                            <Plus size={14} className="mr-1" /> Générer un nouveau
                          </Button>
                        </div>

                        {loadingLedger ? (
                          <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
                        ) : issuedTranscripts.length > 0 ? (
                          <div className="rounded-2xl border border-slate-100 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-900 text-white">
                                <TableRow className="border-none hover:bg-slate-900">
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-6">N° Référence</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Année Académique</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">GPA (4.00)</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Moyenne</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Date d'émission</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-right pr-6">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {issuedTranscripts.map((t: any) => {
                                  const pubDate = t.generationDate
                                    ? new Date(t.generationDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : 'N/A';
                                  return (
                                    <TableRow key={t.id} className="hover:bg-slate-50/50 border-slate-100">
                                      <TableCell className="py-4 pl-6 font-mono font-bold text-xs text-slate-800">
                                        {t.referenceNumber}
                                      </TableCell>
                                      <TableCell className="font-semibold text-slate-600 text-xs">
                                        {t.academicYear?.name || t.class?.name || 'Registre Général'}
                                      </TableCell>
                                      <TableCell className="text-center font-black text-slate-900 text-sm">
                                        {Number(t.gpa || 0).toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-center font-bold text-blue-600 text-xs">
                                        {t.averageScore}%
                                      </TableCell>
                                      <TableCell className="text-xs text-slate-500 font-semibold">
                                        {pubDate}
                                      </TableCell>
                                      <TableCell className="text-right pr-6 py-4 flex items-center justify-end gap-2">
                                        <Button
                                          onClick={() => handleViewTranscript(t)}
                                          className="h-10 bg-slate-900 hover:bg-primary text-white rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all"
                                        >
                                          <Eye size={12} className="mr-1.5" /> Afficher
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteTranscript(t.id)}
                                          className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                                          title="Supprimer du registre"
                                        >
                                          <Trash2 size={14} />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20 text-slate-400 italic text-xs font-semibold space-y-3">
                            <p>Aucun relevé de notes n'a encore été officiellement émis pour cet étudiant.</p>
                            <Button
                              onClick={handleGenerateAuto}
                              className="bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-wider px-4 h-10"
                            >
                              Générer maintenant avec le moteur
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* 3. CUSTOM / MANUAL COMPILATION TAB */}
                {activeTab === 'compile' && (
                  <motion.div
                    key="compile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="rounded-[2rem] border border-slate-100 bg-white shadow-sm p-8 space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Compilation Manuelle & Personnalisée</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Sélectionnez manuellement des semestres ou trimestres spécifiques pour un relevé partiel
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Semesters Selection */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Semestres cibles</label>
                          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-1">
                            {filteredSemesters.map(sem => {
                              const isChecked = selectedSemesterIds.includes(sem.id);
                              return (
                                <button
                                  key={sem.id}
                                  onClick={() => toggleSemester(sem.id)}
                                  className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 text-left transition-all"
                                >
                                  {isChecked ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-slate-300" />}
                                  <span>{sem.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Terms Selection */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trimestres cibles</label>
                          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-1">
                            {filteredTerms.map(term => {
                              const isChecked = selectedTermIds.includes(term.id);
                              return (
                                <button
                                  key={term.id}
                                  onClick={() => toggleTerm(term.id)}
                                  className="w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 text-left transition-all"
                                >
                                  {isChecked ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-slate-300" />}
                                  <span>{term.name} ({term.semester?.name})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <Button
                          onClick={handleGenerateAuto}
                          disabled={generating}
                          className="h-14 bg-primary hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] shadow-lg shadow-blue-500/20 transition-all"
                        >
                          {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                          Génération Automatisée (Recommandée)
                        </Button>
                        <Button
                          onClick={handleGenerateCustom}
                          disabled={generating}
                          variant="outline"
                          className="h-14 border-slate-200 hover:bg-slate-50 text-slate-800 rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] transition-all"
                        >
                          {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <FileText className="mr-2" size={16} />}
                          Compiler Sélection Manuelle
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* 4. OFFICIAL DOCUMENT PREVIEW & PDF TAB */}
                {activeTab === 'preview' && transcriptData && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Printable Transcript Document */}
                    <Card className="printable-transcript rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
                      {/* Premium Brand Header */}
                      <div className="bg-[#2B4C7E] p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                          <Building2 size={240} />
                        </div>
                        <div className="flex items-center gap-6 z-10">
                          <img
                            src="/logo/2cslogo.jpeg"
                            alt="Logo"
                            className="w-20 h-20 rounded-full border-2 border-white bg-white object-contain shadow-lg print:w-16 print:h-16"
                          />
                          <div>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase">{transcriptData.school?.name || '2CS COMPLEXE SCOLAIRE'}</h2>
                            <p className="text-[10px] text-[#6EBE44] font-bold uppercase tracking-[0.3em] mt-1">Registre Académique Officiel</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-blue-100 mt-4">
                              <span className="flex items-center gap-1"><Building2 size={12} /> {transcriptData.school?.address || 'Guinée'}</span>
                              <span className="flex items-center gap-1"><Phone size={12} /> {transcriptData.school?.phone || '+224 000 000 000'}</span>
                              <span className="flex items-center gap-1"><Mail size={12} /> {transcriptData.school?.email || 'contact@2cs.edu'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-10 space-y-8">
                        {/* Document Title Header */}
                        <div className="text-center md:text-left">
                          <h3 className="text-lg font-black text-slate-900 tracking-wider uppercase">Relevé de Notes Officiel de l'Étudiant</h3>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Registre des Performances Cumulées</p>
                        </div>

                        {/* Student Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Profil de l'étudiant</p>
                            <div>
                              <p className="text-sm font-black text-slate-800">{transcriptData.student?.name}</p>
                              <p className="text-[10px] text-[#2B4C7E] font-bold uppercase tracking-wider mt-0.5">Matricule: {transcriptData.student?.userId || 'N/A'}</p>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">Email: {transcriptData.student?.email || 'N/A'}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dossier d'Inscription</p>
                            <div>
                              <p className="text-xs font-bold text-slate-700">Classe: {(transcriptData.student?.classes || []).join(', ') || 'N/A'}</p>
                              <p className="text-xs font-semibold text-slate-500 mt-1">
                                Date de naissance: {transcriptData.student?.birthDate ? new Date(transcriptData.student.birthDate).toLocaleDateString('fr-FR') : 'N/A'}
                              </p>
                              <p className="text-xs font-semibold text-slate-500 mt-0.5">Téléphone: {transcriptData.student?.phoneNumber || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Transcript Metadata & Scope */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50/30 rounded-3xl border border-slate-100/80 text-xs text-slate-600">
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Numéro de Référence</span>
                            <span className="font-mono font-bold text-slate-800 tracking-wide select-all">{transcriptData.metadata?.referenceNumber || transcriptData.referenceNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Date d'émission</span>
                            <span className="font-bold text-slate-800">{transcriptData.metadata?.generationDate || new Date().toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Année / Période</span>
                            <span className="font-semibold text-slate-700">{(transcriptData.metadata?.academicYears || []).join(', ') || transcriptData.academicYear?.name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Semestres Visés</span>
                            <span className="font-semibold text-slate-700">{(transcriptData.metadata?.semesters || []).join(', ') || 'Tous les semestres'}</span>
                          </div>
                        </div>

                        {/* Performance Table */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tableau des Résultats Académiques</h4>
                          <div className="rounded-2xl border overflow-hidden">
                            <Table>
                              <TableHeader className="bg-[#2B4C7E] text-white">
                                <TableRow className="border-none hover:bg-[#2B4C7E]">
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-6">Matière / Classe</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Évaluation / Session</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Note</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Mention</TableHead>
                                  <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pr-6">Observations</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(transcriptData.results || []).map((res: any) => (
                                  <TableRow key={res.id} className="hover:bg-slate-50/50 border-slate-100">
                                    <TableCell className="py-4 pl-6 font-bold text-slate-900">
                                      <div>{res.subjectName}</div>
                                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{res.className}</div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-slate-600 text-xs">
                                      <div className="font-bold text-slate-800">{res.examName}</div>
                                      <div className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-0.5">{res.semester} • {res.term}</div>
                                    </TableCell>
                                    <TableCell className="text-center font-black text-slate-900 text-sm py-4">
                                      {res.marks != null ? `${res.marks}%` : '—'}
                                    </TableCell>
                                    <TableCell className="text-center py-4">
                                      <Badge className="bg-[#2B4C7E] text-white font-black text-[10px] px-2 py-0.5 rounded-md border-none">
                                        {res.letterGrade || 'N/A'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 pr-6 text-xs text-slate-500 font-semibold max-w-[200px] truncate" title={res.remarks}>
                                      {res.remarks || <span className="text-slate-300 italic">—</span>}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        {/* Summary Metric Card */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#2B4C7E] rounded-[2rem] p-8 text-white relative overflow-hidden">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6EBE44]">Matières Évaluées</p>
                            <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary?.totalSubjectsCount || 0}</h4>
                            <p className="text-[10px] font-bold opacity-60">Domaines validés</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#6EBE44]">Performance Moyenne</p>
                            <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary?.weightedAverageScore || 0}%</h4>
                            <p className="text-[10px] font-bold opacity-60">Note Pondérée Moyenne</p>
                          </div>
                          <div className="space-y-1 bg-[#6EBE44] rounded-2xl p-6 shadow-lg shadow-green-900/10">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-100">GPA Cumulatif (Sur 4.00)</p>
                            <h4 className="text-4xl font-black italic tracking-tighter">{Number(transcriptData.summary?.gpa || 0).toFixed(2)}</h4>
                            <p className="text-[10px] font-bold text-green-100">Standard Académique</p>
                          </div>
                        </div>

                        {/* Footer Authority Signatures & QR Verification */}
                        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                          <div className="space-y-2">
                            <div className="border-b border-slate-200 h-16"></div>
                            <p className="font-bold text-slate-500">Bureau des Registraires</p>
                          </div>

                          <div className="flex flex-col items-center justify-center space-y-1.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl print:bg-white print:border-none">
                            {qrCodeUrl ? (
                              <>
                                <img src={qrCodeUrl} alt="Transcript Verification QR" className="w-20 h-20 object-contain mix-blend-multiply" />
                                <p className="text-[8px] font-black tracking-widest text-slate-500">VÉRIFIER L'AUTHENTICITÉ</p>
                                <p className="text-[7px] font-mono text-slate-400 select-all">{transcriptData.metadata?.referenceNumber || transcriptData.referenceNumber}</p>
                              </>
                            ) : (
                              <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-lg" />
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="border-b border-slate-200 h-16"></div>
                            <p className="font-bold text-slate-500">Signature de la Direction</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
