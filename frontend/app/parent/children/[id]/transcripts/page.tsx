'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, Download, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import type { Transcript } from '@/types/school';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export default function ChildTranscriptsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = React.use(params);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/parent/children/${studentId}/transcripts`)
      .then(r => setTranscripts(r.data || []))
      .catch(() => setTranscripts([]))
      .finally(() => setLoading(false));
  }, [studentId]);

  const handleDownloadPDF = async (transcript: Transcript) => {
    setDownloadingId(transcript.id);
    const toastId = toast.loading('Compiling report card PDF...');
    try {
      // 1. Fetch transcript preview data from parent endpoint
      const previewRes = await api.get(`/parent/children/${studentId}/transcripts/${transcript.id}/preview`);
      const transcriptData = previewRes.data;

      const s = transcriptData.student;
      const sch = transcriptData.school;
      const sum = transcriptData.summary;
      const meta = transcriptData.metadata;

      // 2. Generate QR Code URL
      const qrData = {
        name: s.name,
        studentId: s.userId || String(s.id),
        academicYear: meta.academicYears.join(', '),
        status: 'Verified by Administration',
        referenceNumber: meta.referenceNumber
      };
      
      const qrString = `AMF ACADEMY OFFICIAL TRANSCRIPT\n` +
        `Ref: ${qrData.referenceNumber}\n` +
        `Student: ${qrData.name}\n` +
        `Student ID: ${qrData.studentId}\n` +
        `Academic Year: ${qrData.academicYear}\n` +
        `Status: ${qrData.status}`;

      const qrCodeUrl = await QRCode.toDataURL(qrString, { margin: 2, scale: 4 });

      // 3. Create PDF Doc
      const doc = new jsPDF() as any;

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

      // Metadata Grid
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

      if (currentY + 75 > 280) {
        doc.addPage();
        currentY = 20;
      }

      // Summary Card
      doc.setFillColor(15, 23, 42);
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

      // Signatures
      const sigY = currentY + 42;
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      
      doc.line(14, sigY + 14, 74, sigY + 14);
      doc.text('OFFICE OF THE REGISTRAR', 14, sigY + 19);

      doc.line(136, sigY + 14, 196, sigY + 14);
      doc.text('PRINCIPAL / DEAN SIGNATURE', 136, sigY + 19);

      // Draw QR Code
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
        doc.setFontSize(6.5);
        doc.text('VERIFY AUTHENTICITY', 105, sigY + 26, { align: 'center' });
      }

      const safeName = (s.name || 'student').replace(/\s+/g, '_').toLowerCase();
      doc.save(`Transcript-${safeName}-${meta.referenceNumber || 'GEN'}.pdf`);
      toast.success('Report Card PDF downloaded successfully', { id: toastId });
    } catch (err) {
      console.error('PDF export failed', err);
      toast.error('Failed to compile report card PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-primary" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
          <Link href="/parent/children" className="hover:text-primary">Children</Link>
          <span>/</span>
          <Link href={`/parent/children/${studentId}`} className="hover:text-primary">Profile</Link>
          <span>/</span>
          <span className="text-slate-700">Transcripts</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Academic Transcripts</h1>
        <p className="text-sm text-slate-500 mt-1">{transcripts.length} transcript{transcripts.length !== 1 ? 's' : ''} on record</p>
      </div>

      {transcripts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
          <FileText className="w-12 h-12 opacity-30" />
          <p className="font-semibold">No transcripts generated yet</p>
          <p className="text-xs">Transcripts are generated by the school administration at end of term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {transcripts.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 hover:border-primary transition-colors duration-300"
            >
              <div className="p-4 bg-primary/10 rounded-2xl shrink-0">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 truncate">
                  Transcript — {t.academicYear?.name || 'Academic Year'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ref: {t.referenceNumber}</p>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  {t.gpa !== undefined && (
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${t.gpa >= 3 ? 'bg-green-100 text-green-700' : t.gpa >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      GPA: {t.gpa.toFixed(2)}
                    </span>
                  )}
                  {t.averageScore !== undefined && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">
                      Avg: {t.averageScore}%
                    </span>
                  )}
                  <span className="text-slate-400">
                    Generated: {new Date(t.generationDate).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
              <button
                disabled={downloadingId === t.id}
                onClick={() => handleDownloadPDF(t)}
                className="shrink-0 flex items-center gap-2 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 disabled:opacity-50"
              >
                {downloadingId === t.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Download
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
