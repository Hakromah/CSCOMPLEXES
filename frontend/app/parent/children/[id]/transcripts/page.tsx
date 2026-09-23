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
    const toastId = toast.loading('Génération du relevé de notes PDF...');
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
        status: 'Vérifié par l\'Administration',
        referenceNumber: meta.referenceNumber
      };

      const qrString = `2CS COMPLEXE SCOLAIRE CAMARA SALEMATOU\n` +
        `Référence: ${qrData.referenceNumber}\n` +
        `Élève: ${qrData.name}\n` +
        `Matricule: ${qrData.studentId}\n` +
        `Année scolaire: ${qrData.academicYear}\n` +
        `Statut: ${qrData.status}`;

      const qrCodeUrl = await QRCode.toDataURL(qrString, { margin: 2, scale: 4 });

      // 3. Create PDF Doc
      const doc = new jsPDF() as any;

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
        doc.text((sch.name || '2CS COMPLEXE SCOLAIRE').toUpperCase(), 45, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(200, 220, 245); // light blue-gray
        doc.text(`Relevé de notes officiel • Registries System`, 45, 25);
        doc.text(`Adresse: ${sch.address || ''} | Email: ${sch.email || ''} | Téléphone: ${sch.phone || ''}`, 45, 31);
      } else {
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(20);
        doc.text((sch.name || '2CS COMPLEXE SCOLAIRE').toUpperCase(), 14, 18);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(200, 220, 245); // light blue-gray
        doc.text(`Relevé de notes officiel • Registries System`, 14, 25);
        doc.text(`Adresse: ${sch.address || ''} | Email: ${sch.email || ''} | Téléphone: ${sch.phone || ''}`, 14, 32);
      }

      // Document Title (branded color)
      doc.setTextColor(43, 76, 126);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('RELEVÉ DE NOTES OFFICIEL', 14, 55);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 58, 196, 58);

      // Student Information Grid
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PROFIL DE L\'ÉLÈVE', 14, 66);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nom: ${s.name || 'N/A'}`, 14, 72);
      doc.text(`Matricule: ${s.userId || 'N/A'}`, 14, 78);
      doc.text(`Email: ${s.email || 'N/A'}`, 14, 84);

      const classNames = (s.classes || []).join(', ') || 'N/A';
      doc.text(`Classe: ${classNames}`, 120, 72);
      const bDate = s.birthDate ? new Date(s.birthDate).toLocaleDateString() : 'N/A';
      doc.text(`Date de naissance: ${bDate}`, 120, 78);
      doc.text(`Téléphone: ${s.phoneNumber || 'N/A'}`, 120, 84);

      // Metadata Grid
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, 90, 182, 18, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 90, 182, 18, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('RÉFÉRENCE', 18, 95);
      doc.text('DATE DE DÉLIVRANCE', 70, 95);
      doc.text('SEMESTRES', 110, 95);
      doc.text('TRIMESTRES', 155, 95);

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
      doc.text('RÉSUMÉ DES RÉSULTATS SCOLAIRES (BARÈME SUR 20)', 14, 116);

      const tableBody = (transcriptData.results || []).map((r: any) => {
        const n20 = r.marks != null ? Number(r.marks) : (r.marks20 != null ? Number(r.marks20) : (r.percentage != null ? Number(r.percentage) / 5 : 0));
        return [
          r.subjectName || 'N/A',
          r.className || 'N/A',
          r.examName || '—',
          `${r.semester || 'N/A'} (${r.term || 'N/A'})`,
          `${n20.toFixed(2)} / 20`,
          r.letterGrade || 'N/A',
          r.remarks || r.decision || '—'
        ];
      });

      autoTable(doc, {
        startY: 120,
        head: [['Matière', 'Classe', 'Évaluation', 'Période', 'Note (/20)', 'Mention', 'Observations']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [43, 76, 126] as any, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 15 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 37 }
        }
      });

      let currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 12 : 170;

      if (currentY + 75 > 280) {
        doc.addPage();
        currentY = 20;
      }

      // Summary Card (Royal Blue with Decision box)
      doc.setFillColor(43, 76, 126); // School Royal Blue (#2B4C7E)
      doc.rect(14, currentY, 182, 28, 'F');

      const rawAvg = sum.annualAverage ?? sum.weightedAverageScore ?? sum.averageScore ?? 0;
      const avgVal20 = Number(rawAvg > 20 ? rawAvg / 5 : rawAvg);
      const isAdmis = avgVal20 >= 10.0;
      const statusColor = isAdmis ? [110, 190, 68] : [220, 38, 38];

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.rect(126, currentY + 2, 66, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('MATIÈRES ÉVALUÉES', 20, currentY + 8);
      doc.text('MOYENNE PONDÉRÉE (SUR 20)', 65, currentY + 8);
      doc.text('MENTION & DÉCISION', 130, currentY + 8);

      doc.setFontSize(16);
      doc.text(String(sum.totalSubjectsCount || 0), 20, currentY + 18);
      doc.text(`${avgVal20.toFixed(2)} / 20`, 65, currentY + 18);

      const mentionText = (sum.annualRemark || (avgVal20 >= 16 ? 'Très Bien' : avgVal20 >= 14 ? 'Bien' : avgVal20 >= 12 ? 'Assez Bien' : avgVal20 >= 10 ? 'Passable' : 'Insuffisant')).toUpperCase();
      doc.setFontSize(11);
      doc.text(mentionText, 130, currentY + 16);
      doc.setFontSize(8.5);
      doc.text(sum.annualDecision || (isAdmis ? 'ADMIS(E)' : 'AJOURNÉ(E)'), 130, currentY + 22);

      doc.setFontSize(7);
      doc.setTextColor(200, 220, 245); // light blue-gray
      doc.text('Domaines validés', 20, currentY + 24);
      doc.text('Seuil de réussite: 10.00 / 20', 65, currentY + 24);

      // Signatures
      const sigY = Math.max(235, currentY + 36);
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);

      doc.line(14, sigY + 14, 74, sigY + 14);
      doc.text('BUREAU DU REGISTRAIRE', 14, sigY + 19);

      doc.line(136, sigY + 14, 196, sigY + 14);
      doc.text('SIGNATURE DU DIRECTEUR', 136, sigY + 19);

      // Draw QR Code
      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
        doc.setFontSize(6.5);
        doc.text('Vérifier l\'authenticité', 105, sigY + 26, { align: 'center' });
      }

      const safeName = (s.name || 'eleve').replace(/\s+/g, '_').toLowerCase();
      doc.save(`Releve_de_notes_${safeName}_${meta.referenceNumber || 'GEN'}.pdf`);
      toast.success('Relevé de notes PDF téléchargé avec succès', { id: toastId });
    } catch (err) {
      console.error('PDF export failed', err);
      toast.error('Échec du téléchargement du PDF', { id: toastId });
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
          <Link href="/parent/children" className="hover:text-primary">Enfants</Link>
          <span>/</span>
          <Link href={`/parent/children/${studentId}`} className="hover:text-primary">Profil</Link>
          <span>/</span>
          <span className="text-slate-700">Relevés</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Relevés de Notes Académiques</h1>
        <p className="text-sm text-slate-500 mt-1">{transcripts.length} relevé{transcripts.length !== 1 ? 's' : ''} disponible{transcripts.length !== 1 ? 's' : ''}</p>
      </div>

      {transcripts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
          <FileText className="w-12 h-12 opacity-30" />
          <p className="font-semibold">Aucun relevé disponible</p>
          <p className="text-xs">Les relevés officiels sont publiés par la direction de l'école à la fin de la période.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {transcripts.map((t: any, idx) => {
            const rawAvg = t.annualAverage ?? t.averageScore ?? 0;
            const avgVal20 = Number(rawAvg > 20 ? rawAvg / 5 : rawAvg);
            const isPassing = avgVal20 >= 10.0;
            return (
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
                    Relevé officiel — {t.academicYear?.name || 'Année Académique'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Réf: {t.referenceNumber}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${isPassing ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      Moyenne: {avgVal20.toFixed(2)} / 20
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${isPassing ? 'bg-blue-50 text-[#2B4C7E]' : 'bg-amber-50 text-amber-700'}`}>
                      {avgVal20 >= 16 ? 'Très Bien' : avgVal20 >= 14 ? 'Bien' : avgVal20 >= 12 ? 'Assez Bien' : avgVal20 >= 10 ? 'Passable' : 'Insuffisant'}
                    </span>
                    <span className="text-slate-400">
                      Émis le: {new Date(t.generationDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <button
                  disabled={downloadingId === t.id}
                  onClick={() => handleDownloadPDF(t)}
                  className="shrink-0 flex items-center gap-2 bg-[#2B4C7E] hover:bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 disabled:opacity-50"
                >
                  {downloadingId === t.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Télécharger
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
