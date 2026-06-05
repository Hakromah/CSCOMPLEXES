/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import {
  FileText, Printer, Download,
  RefreshCcw, Loader2, GraduationCap, Building2, Phone, Mail,
  Eye, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function StudentTranscriptsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<any | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Fetch initial transcripts list
  const loadTranscripts = async () => {
    setLoading(true);
    try {
      // 1. Fetch user me info
      const meRes = await api.get('/auth/me');
      setCurrentUser(meRes.data);

      const transcriptsRes = await api.get(`/student/transcripts`);
      setTranscripts(transcriptsRes.data || []);
    } catch (error) {
      toast.error('Failed to retrieve academic transcripts ledger');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTranscripts();
  }, []);

  // Fetch transcript details when one is selected
  useEffect(() => {
    const fetchTranscriptDetails = async () => {
      if (!selectedTranscriptId) {
        setTranscriptData(null);
        return;
      }
      setFetchingDetails(true);
      try {
        const res = await api.get(`/student/transcripts/${selectedTranscriptId}/preview`);
        setTranscriptData(res.data);
      } catch (err) {
        toast.error('Failed to sync official transcript scoreboard');
        console.error(err);
        setSelectedTranscriptId(null);
      } finally {
        setFetchingDetails(false);
      }
    };

    fetchTranscriptDetails();
  }, [selectedTranscriptId]);

  // Generate QR Code URL on transcript data changes
  useEffect(() => {
    if (transcriptData) {
      const qrData = {
        name: transcriptData.student.name,
        studentId: transcriptData.student.userId || String(transcriptData.student.id),
        academicYear: transcriptData.metadata.academicYears.join(', '),
        status: 'Verified by Administration',
        referenceNumber: transcriptData.metadata.referenceNumber
      };
      
      const qrString = `AMF ACADEMY OFFICIAL TRANSCRIPT\n` +
        `Ref: ${qrData.referenceNumber}\n` +
        `Student: ${qrData.name}\n` +
        `Student ID: ${qrData.studentId}\n` +
        `Academic Year: ${qrData.academicYear}\n` +
        `Status: ${qrData.status}`;

      QRCode.toDataURL(qrString, { margin: 2, scale: 4 })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR code generation failed', err));
    } else {
      setQrCodeUrl('');
    }
  }, [transcriptData]);

  // PDF Export logic (exact mirror of admin)
  const handleDownloadPDF = () => {
    if (!transcriptData) return;
    try {
      const doc = new jsPDF() as any;
      const s = transcriptData.student;
      const sch = transcriptData.school;
      const sum = transcriptData.summary;
      const meta = transcriptData.metadata;

      // Header Branding
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text((sch.name || 'School').toUpperCase(), 14, 18);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`Official Academic Transcript • Registries System`, 14, 25);
      doc.text(`Address: ${sch.address || ''} | Email: ${sch.email || ''} | Phone: ${sch.phone || ''}`, 14, 32);

      // Document Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('OFFICIAL STUDENT TRANSCRIPT', 14, 55);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 58, 196, 58);

      // Student Information Grid
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('STUDENT PROFILE', 14, 66);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Name: ${s.name || 'N/A'}`, 14, 72);
      doc.text(`ID: ${s.userId || 'N/A'}`, 14, 78);
      doc.text(`Email: ${s.email || 'N/A'}`, 14, 84);

      const classNames = (s.classes || []).join(', ') || 'N/A';
      doc.text(`Class: ${classNames}`, 120, 72);
      const bDate = s.birthDate ? new Date(s.birthDate).toLocaleDateString() : 'N/A';
      doc.text(`Birth Date: ${bDate}`, 120, 78);
      doc.text(`Phone: ${s.phoneNumber || 'N/A'}`, 120, 84);

      // Metadata Grid (Reference Number, Date of Issue, Semesters, Terms)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 90, 182, 18, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 90, 182, 18, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('REFERENCE NUMBER', 18, 95);
      doc.text('DATE OF ISSUE', 70, 95);
      doc.text('SEMESTERS', 110, 95);
      doc.text('TERMS', 155, 95);

      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(meta.referenceNumber || 'N/A', 18, 101);
      doc.text(meta.generationDate || 'N/A', 70, 101);
      
      const semsText = doc.splitTextToSize((meta.semesters || []).join(', ') || 'N/A', 40);
      const termsText = doc.splitTextToSize((meta.terms || []).join(', ') || 'N/A', 35);
      doc.text(semsText, 110, 101);
      doc.text(termsText, 155, 101);

      // Results Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ACADEMIC PERFORMANCE SUMMARY', 14, 116);

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
        head: [['Subject Name', 'Class', 'Exam', 'Semester (Term)', 'Score', 'Grade', 'Remarks']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] as any, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 42 }
        }
      });

      let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 170;

      // Check if summary + signature block will overflow the page (needs around 75mm)
      if (currentY + 75 > 280) {
        doc.addPage();
        currentY = 20; // reset Y coordinate on the new page
      }

      // Summary Index Card
      doc.setFillColor(15, 23, 42); // slate-900 (dark card like in UI)
      doc.rect(14, currentY, 182, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ROSTER INDEX', 20, currentY + 8);
      doc.text('AVERAGE PERFORMANCE', 70, currentY + 8);
      doc.text('CUMULATIVE GPA', 135, currentY + 8);

      doc.setFontSize(18);
      doc.text(String(sum.totalSubjectsCount || 0), 20, currentY + 18);
      doc.text(`${sum.weightedAverageScore || 0}%`, 70, currentY + 18);
      doc.text(typeof sum.gpa === 'number' ? sum.gpa.toFixed(2) : '0.00', 135, currentY + 18);

      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text('Evaluated Fields', 20, currentY + 24);
      doc.text('Weighted Average Score', 70, currentY + 24);
      doc.text('Out of 4.00 max', 135, currentY + 24);

      // Signatures and QR Code Block
      const sigY = currentY + 42;
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      
      // Draw signature lines
      doc.setDrawColor(226, 232, 240);
      doc.line(14, sigY + 14, 74, sigY + 14);
      doc.text('OFFICE OF THE REGISTRAR', 14, sigY + 19);

      doc.line(136, sigY + 14, 196, sigY + 14);
      doc.text('PRINCIPAL / DEAN SIGNATURE', 136, sigY + 19);

      // Draw QR Code in the middle
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
        doc.setFontSize(6.5);
        doc.text('VERIFY AUTHENTICITY', 105, sigY + 26, { align: 'center' });
      }

      // Save
      const safeName = (s.name || 'student').replace(/\s+/g, '_').toLowerCase();
      doc.save(`transcript_${safeName}.pdf`);
      toast.success('Official PDF Downloaded');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('PDF download failed. Please try again.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center leading-relaxed">
        Synchronizing Registry Logs...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-[clamp(1.2rem,2vw+1rem,2rem)] space-y-[clamp(1rem,2vw+1rem,2rem)] print:p-0 print:bg-white">
      <AnimatePresence mode="wait">
        {!selectedTranscriptId ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-7xl mx-auto space-y-8 print:hidden"
          >
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Official Records Center</span>
                </div>
                <h1 className="text-[clamp(1.4rem,3.5vw,4rem)] font-black text-slate-900 tracking-tighter italic uppercase">
                  My <span className="text-primary">Transcripts.</span>
                </h1>
              </div>
              <Button
                onClick={loadTranscripts}
                variant="outline"
                className="rounded-2xl h-14 px-6 border-slate-200 bg-white hover:bg-slate-50 transition-all font-black text-[10px] tracking-widest uppercase"
              >
                <RefreshCcw size={16} className="mr-2 text-slate-600" /> Refresh Ledger
              </Button>
            </header>

            {/* Transcripts List Table */}
            {transcripts.length > 0 ? (
              <Card className="rounded-[2.5rem] border border-slate-100 bg-white shadow-xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="rounded-2xl border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-900 text-white">
                        <TableRow className="border-none hover:bg-slate-900">
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-6">Reference No.</TableHead>
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Academic Year</TableHead>
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">GPA</TableHead>
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Average Score</TableHead>
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Date of Issue</TableHead>
                          <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-right pr-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transcripts.map((t: any) => {
                          const pubDate = t.generationDate 
                            ? new Date(t.generationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                            : 'N/A';
                          return (
                            <TableRow key={t.id} className="hover:bg-slate-50/50 border-slate-100">
                              <TableCell className="py-4 pl-6 font-mono font-bold text-xs text-slate-800">
                                {t.referenceNumber}
                              </TableCell>
                              <TableCell className="font-semibold text-slate-600 text-xs">
                                {t.academicYear?.name || t.class?.name || 'Official General Record'}
                              </TableCell>
                              <TableCell className="text-center font-black text-slate-900 text-sm">
                                {Number(t.gpa).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center font-bold text-blue-600 text-xs">
                                {t.averageScore}%
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 font-semibold">
                                {pubDate}
                              </TableCell>
                              <TableCell className="text-right pr-6 py-4">
                                <Button
                                  onClick={() => setSelectedTranscriptId(String(t.id))}
                                  className="h-10 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold uppercase text-[9px] tracking-wider transition-all"
                                >
                                  <Eye size={12} className="mr-1.5" /> View Transcript
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/50 p-16 text-center">
                <div className="mx-auto p-5 bg-white border border-slate-100 shadow-xl rounded-3xl mb-6 text-slate-400 w-fit">
                  <FileText size={40} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Transcripts Issued</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center mt-2 max-w-md mx-auto leading-relaxed">
                  The academic registry does not contain any officially generated transcripts for your account yet. Transcripts are calculated and saved by the administration.
                </p>
              </Card>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Top Back/Print Toolbar */}
            <div className="flex justify-between items-center print:hidden">
              <Button
                onClick={() => setSelectedTranscriptId(null)}
                variant="outline"
                className="rounded-2xl h-14 px-6 border-slate-200 bg-white hover:bg-slate-50 font-black text-[10px] tracking-widest uppercase"
              >
                <ArrowLeft size={16} className="mr-2" /> Back to List
              </Button>
              
              <div className="flex gap-3">
                <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-6 border-slate-200 bg-white hover:bg-slate-50 font-black text-[10px] tracking-widest uppercase">
                  <Printer size={16} className="mr-2 text-slate-600" /> Print
                </Button>
                <Button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-slate-900 text-white rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/10">
                  <Download size={16} className="mr-2" /> Download PDF
                </Button>
              </div>
            </div>

            {fetchingDetails || !transcriptData ? (
              <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Official Registry Ledger...</p>
              </div>
            ) : (
              /* Printable Transcript Document (Matches Admin layout perfectly) */
              <Card className="printable-transcript rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
                {/* Premium Brand Header */}
                <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Building2 size={240} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">{transcriptData.school.name}</h2>
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-1">Official Academic Registry</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 mt-4">
                      <span className="flex items-center gap-1"><Building2 size={12} /> {transcriptData.school.address}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {transcriptData.school.phone}</span>
                      <span className="flex items-center gap-1"><Mail size={12} /> {transcriptData.school.email}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-10 space-y-8">
                  {/* Document Title Header */}
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-black text-slate-900 tracking-wider uppercase">Official Student Transcript</h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Cumulated Performance Ledger</p>
                  </div>

                  {/* Student Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Student Profile</p>
                      <div>
                        <p className="text-sm font-black text-slate-800">{transcriptData.student.name}</p>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">ID: {transcriptData.student.userId || 'N/A'}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-500">Email: {transcriptData.student.email}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Enrolled Record</p>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Class: {transcriptData.student.classes.join(', ') || 'N/A'}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          Birth Date: {transcriptData.student.birthDate ? new Date(transcriptData.student.birthDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Phone: {transcriptData.student.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Transcript Metadata & Scope */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50/30 rounded-3xl border border-slate-100/80 text-xs text-slate-600">
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Reference Number</span>
                      <span className="font-mono font-bold text-slate-800 tracking-wide select-all">{transcriptData.metadata.referenceNumber}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Date of Issue</span>
                      <span className="font-bold text-slate-800">{transcriptData.metadata.generationDate}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Target Semesters</span>
                      <span className="font-semibold text-slate-700">{transcriptData.metadata.semesters.join(', ') || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Target Terms</span>
                      <span className="font-semibold text-slate-700">{transcriptData.metadata.terms.join(', ') || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Performance Table */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Academic Scoreboard</h4>
                    <div className="rounded-2xl border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-900 text-white">
                          <TableRow className="border-none hover:bg-slate-900">
                            <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pl-6">Subject / Class</TableHead>
                            <TableHead className="text-white font-black text-[9px] uppercase tracking-wider">Exam / Session</TableHead>
                            <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Score</TableHead>
                            <TableHead className="text-white font-black text-[9px] uppercase tracking-wider text-center">Grade</TableHead>
                            <TableHead className="text-white font-black text-[9px] uppercase tracking-wider py-4 pr-6">Teacher Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transcriptData.results.map((res: any) => (
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
                                {res.marks}%
                              </TableCell>
                              <TableCell className="text-center py-4">
                                <Badge className="bg-slate-900 text-white font-black text-[10px] px-2 py-0.5 rounded-md border-none">
                                  {res.letterGrade}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Roster Index</p>
                      <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary.totalSubjectsCount}</h4>
                      <p className="text-[10px] font-bold opacity-60">Evaluated Fields</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Average Performance</p>
                      <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary.weightedAverageScore}%</h4>
                      <p className="text-[10px] font-bold opacity-60">Weighted Average Score</p>
                    </div>
                    <div className="space-y-1 bg-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-900/10">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">Cumulative GPA</p>
                      <h4 className="text-4xl font-black italic tracking-tighter">{transcriptData.summary.gpa.toFixed(2)}</h4>
                      <p className="text-[10px] font-bold text-blue-100">Out of 4.00 max</p>
                    </div>
                  </div>

                  {/* Footer Authority Signatures & QR Verification */}
                  <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                    <div className="space-y-2">
                      <div className="border-b border-slate-200 h-16"></div>
                      <p className="font-bold text-slate-500">Office of the Registrar</p>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center space-y-1.5 p-2 bg-slate-50 border border-slate-100 rounded-2xl print:bg-white print:border-none">
                      {qrCodeUrl ? (
                        <>
                          <img src={qrCodeUrl} alt="Transcript Verification QR" className="w-20 h-20 object-contain mix-blend-multiply" />
                          <p className="text-[8px] font-black tracking-widest text-slate-500">VERIFY AUTHENTICITY</p>
                          <p className="text-[7px] font-mono text-slate-400 select-all">{transcriptData.metadata.referenceNumber}</p>
                        </>
                      ) : (
                        <div className="w-20 h-20 bg-slate-200 animate-pulse rounded-lg" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="border-b border-slate-200 h-16"></div>
                      <p className="font-bold text-slate-500">Principal / Dean Signature</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
