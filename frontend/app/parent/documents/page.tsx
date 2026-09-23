'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, Landmark, ShieldCheck, UserCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { SCHOOL_CONFIG } from '@/lib/school-config';
import { CIRCULAR_LOGO } from '@/lib/logo-base64';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

type TabType = 'transcripts' | 'statements' | 'receipts';

export default function ParentDocumentsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('transcripts');
  const [loading, setLoading] = useState(true);

  // Document states
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [financeData, setFinanceData] = useState<any>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch children list
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await api.get('/parent/children');
        setChildren(res.data || []);
        if (res.data?.length > 0) {
          setSelectedChildId(String(res.data[0].id));
        }
      } catch (err) {
        toast.error('Echec du chargement des profils des enfants');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // Fetch documents when selected child changes
  useEffect(() => {
    if (!selectedChildId) return;

    const fetchChildDocs = async () => {
      setLoadingDocs(true);
      try {
        const [transcriptsRes, financeRes] = await Promise.all([
          api.get(`/parent/children/${selectedChildId}/transcripts`).catch(() => ({ data: [] })),
          api.get(`/parent/finance/${selectedChildId}`).catch(() => ({ data: null })),
        ]);
        setTranscripts(transcriptsRes.data || []);
        setFinanceData(financeRes.data);
      } catch (err) {
        console.error('Echec de la synchronisation des documents de l\'enfant', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchChildDocs();
  }, [selectedChildId]);

  const selectedChild = children.find(c => String(c.id) === selectedChildId);
  const studentName = selectedChild
    ? selectedChild.firstName && selectedChild.lastName
      ? `${selectedChild.firstName} ${selectedChild.lastName}`
      : selectedChild.username
    : '';

  // ─── 1. Download Transcript ────────────────────────────────────────────────
  const downloadTranscript = async (t: any) => {
    const docKey = `transcript-${t.id}`;
    setDownloadingId(docKey);
    const toastId = toast.loading('Compilation du relevé de notes PDF...');
    try {
      const previewRes = await api.get(`/parent/children/${selectedChildId}/transcripts/${t.id}/preview`);
      const data = previewRes.data;

      const s = data.student;
      const sch = data.school;
      const sum = data.summary;
      const meta = data.metadata;

      const qrString = ` 2CSCOMPLEXES RELEVE DES NOTES\n` +
        `Réf: ${meta.referenceNumber}\n` +
        `Élève: ${s.name}\n` +
        `ID Élève: ${s.userId || String(s.id)}\n` +
        `Année scolaire: ${meta.academicYears.join(', ')}\n` +
        `Statut: Vérifié par l'administration`;

      const qrCodeUrl = await QRCode.toDataURL(qrString, { margin: 2, scale: 4 });

      const doc = new jsPDF() as any;

      // Header Branding (Royal Blue)
      doc.setFillColor(43, 76, 126);
      doc.rect(0, 0, 210, 45, 'F');

      // Divider line in school green
      doc.setFillColor(110, 190, 68);
      doc.rect(0, 45, 210, 1.5, 'F');

      // Draw school logo
      try {
        doc.addImage(CIRCULAR_LOGO, 'PNG', 14, 10, 25, 25);
      } catch (e) {
        console.error("Echec de l'ajout du logo au relevé de notes", e);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text((sch.name || '2CSCOMPLEXES').toUpperCase(), 45, 18);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 220, 245); // light blue-gray
      doc.text(`RELEVE DES NOTES • ENREGISTREMENT DES NOTES`, 45, 25);
      doc.text(`Adresse: ${sch.address || ''} | Email: ${sch.email || ''} | Téléphone: ${sch.phone || ''}`, 45, 32);

      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('RELEVE DES NOTES', 14, 55);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 58, 196, 58);

      // Student Profile
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('PROFIL DE L\'ELEVE', 14, 66);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Nom: ${s.name || 'N/A'}`, 14, 72);
      doc.text(`ID: ${s.userId || 'N/A'}`, 14, 78);
      doc.text(`Email: ${s.email || 'N/A'}`, 14, 84);
      doc.text(`Classe: ${(s.classes || []).join(', ') || 'N/A'}`, 120, 72);
      doc.text(`Date de naissance: ${s.birthDate ? new Date(s.birthDate).toLocaleDateString() : 'N/A'}`, 120, 78);
      doc.text(`Téléphone: ${s.phoneNumber || 'N/A'}`, 120, 84);

      // Meta Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 90, 182, 18, 'F');
      doc.rect(14, 90, 182, 18, 'S');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('NUMERO DE REFERENCE', 18, 95);
      doc.text('DATE DE DELIVRANCE', 70, 95);
      doc.text('SEMESTRES', 110, 95);
      doc.text('TERMES', 155, 95);
      doc.setTextColor(15, 23, 42);
      doc.text(meta.referenceNumber || 'N/A', 18, 101);
      doc.text(meta.generationDate || 'N/A', 70, 101);
      doc.text((meta.semesters || []).join(', ') || 'N/A', 110, 101);
      doc.text((meta.terms || []).join(', ') || 'N/A', 155, 101);

      // Results Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('BILAN DES PERFORMANCES SCOLAIRES (BARÈME SUR 20)', 14, 116);

      const tableBody = (data.results || []).map((r: any) => {
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

      // Summary Card
      doc.setFillColor(43, 76, 126);
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
      doc.setTextColor(200, 220, 245);
      doc.text('Domaines validés', 20, currentY + 24);
      doc.text('Seuil de réussite: 10.00 / 20', 65, currentY + 24);

      // Signatures & QR
      const sigY = Math.max(235, currentY + 36);
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.line(14, sigY + 14, 74, sigY + 14);
      doc.text('LE SECRÉTAIRE GÉNÉRAL', 14, sigY + 19);
      doc.line(136, sigY + 14, 196, sigY + 14);
      doc.text('SIGNATURE DU DIRECTEUR GÉNÉRAL', 136, sigY + 19);

      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
      }

      const safeName = studentName.replace(/\s+/g, '_').toLowerCase();
      doc.save(`Transcript-${safeName}-${meta.referenceNumber || 'GEN'}.pdf`);
      toast.success('Relevé téléchargé avec succès', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Échec de la génération du relevé', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  // ─── 2. Download Financial Statement ────────────────────────────────────────
  const downloadStatement = async () => {
    if (!financeData) return;
    const docKey = `statement-${selectedChildId}`;
    setDownloadingId(docKey);
    const toastId = toast.loading('Compilation du relevé des comptes...');
    try {
      const doc = new jsPDF();
      doc.setDrawColor(110, 190, 68); // school green
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      // Header Banner (Royal Blue)
      doc.setFillColor(43, 76, 126);
      doc.rect(5, 5, 200, 45, 'F');

      // Draw school logo
      try {
        doc.addImage(CIRCULAR_LOGO, 'PNG', 15, 12, 30, 30);
      } catch (e) {
        console.error("Échec de l'ajout du logo au relevé", e);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(SCHOOL_CONFIG.name, 52, 22);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(200, 220, 245); // light blue-gray
      doc.text('RELEVÉ DES COMPTES', 52, 30);
      doc.text(`Conakry, Guinée | ${SCHOOL_CONFIG.contact}`, 52, 37);

      doc.setTextColor(255, 255, 255);
      doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 196, 22, { align: 'right' });

      // Student info
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text('Informations sur l\'étudiant', 15, 58);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Nom: ${studentName}`, 15, 66);
      doc.text(`ID de l'étudiant: ${selectedChild?.userId || 'N/A'}`, 15, 73);
      doc.text(`Email: ${selectedChild?.email || 'N/A'}`, 15, 80);

      // Summary Card
      doc.setDrawColor(203, 213, 225);
      doc.rect(120, 54, 85, 35);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.text('Résume du compte', 125, 62);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Facturé: ${Number(financeData.totalCharged || 0).toLocaleString()} GNF`, 125, 70);
      doc.text(`Total Payé:   ${Number(financeData.totalPaid || 0).toLocaleString()} GNF`, 125, 77);
      doc.text(`Solde:  ${Number(financeData.outstandingBalance || 0).toLocaleString()} GNF`, 125, 84);

      // Merge activity
      const activities: any[] = [];
      (financeData.invoices || []).forEach((inv: any) => {
        activities.push({
          date: inv.createdAt,
          ref: inv.invoiceNumber,
          type: 'INVOICE',
          description: `Invoice for ${inv.month} ${inv.year}`,
          billed: Number(inv.subtotal || 0),
          paid: 0
        });
      });

      (financeData.payments || []).forEach((pay: any) => {
        if (pay.status === 'APPROVED') {
          activities.push({
            date: pay.paymentDate || pay.createdAt,
            ref: pay.paymentNumber,
            type: 'PAYMENT',
            description: `${pay.paymentCategory} — ${pay.paymentMethod}`,
            billed: 0,
            paid: Number(pay.amount || 0)
          });
        }
      });

      // Sort by date ascending
      activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let currentBal = 0;
      const ledgerRows = activities.map((act) => {
        if (act.type === 'INVOICE') {
          currentBal += act.billed;
        } else {
          currentBal -= act.paid;
        }
        return [
          new Date(act.date).toLocaleDateString(),
          act.ref,
          act.type,
          act.description,
          act.billed > 0 ? `${act.billed.toLocaleString()} GNF` : '—',
          act.paid > 0 ? `${act.paid.toLocaleString()} GNF` : '—',
          `${currentBal.toLocaleString()} GNF`
        ];
      });

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text('Historique des transactions (Chronologique)', 15, 96);

      autoTable(doc, {
        startY: 100,
        head: [['Date', 'Référence #', 'Type', 'Description', 'Billed (Dr)', 'Paid (Cr)', 'Balance']],
        body: ledgerRows.length > 0 ? ledgerRows : [['—', '—', '—', 'Aucune transaction enregistrée', '—', '—', '—']],
        theme: 'grid',
        headStyles: { fillColor: [43, 76, 126], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8 }
      });

      const qrContent = `2CSCOMPLEXE SCOLAIRE\nRELEVE DE COMPTE\nEleve : ${studentName}\nTotal facturé: ${Number(financeData.totalCharged || 0).toLocaleString()} GNF\nEn souffrance: ${Number(financeData.outstandingBalance || 0).toLocaleString()} GNF`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);

      const safeName = studentName.replace(/\s+/g, '_').toLowerCase();
      doc.save(`Statement-${safeName}.pdf`);
      toast.success('Compte rendu téléchargé avec succès', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Échec de la génération du relevé de compte', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  // ─── 3. Download Payment Receipt ───────────────────────────────────────────
  const downloadReceipt = async (pay: any) => {
    const docKey = `receipt-${pay.id}`;
    setDownloadingId(docKey);
    const toastId = toast.loading('Compiling payment receipt...');
    try {
      const doc = new jsPDF();
      doc.setDrawColor(110, 190, 68); // school green
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      // Header Banner (Royal Blue)
      doc.setFillColor(43, 76, 126);
      doc.rect(5, 5, 200, 45, 'F');

      // Draw school logo
      try {
        doc.addImage(CIRCULAR_LOGO, 'PNG', 15, 12, 30, 30);
      } catch (e) {
        console.error("Failed to add logo to receipt", e);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(SCHOOL_CONFIG.name, 52, 23);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(200, 220, 245); // light blue-gray
      doc.text('2CSCOMPLEXE SCOLAIRE', 52, 30);
      doc.text(`Conakry, Guinea | ${SCHOOL_CONFIG.contact}`, 52, 36);

      doc.setTextColor(43, 76, 126);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('REÇU DE PAIEMENT', 15, 70);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Référence du reçu : ${pay.paymentNumber}`, 15, 80);
      doc.text(`Référence de la facture : ${pay.invoice?.invoiceNumber || 'N/A'}`, 15, 87);
      doc.text(`Date de paiement : ${new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}`, 15, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text('Profil de l\'étudiant facturé :', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Nom : ${studentName}`, 120, 87);
      doc.text(`ID de l'étudiant : ${selectedChild?.userId || 'N/A'}`, 120, 94);

      autoTable(doc, {
        startY: 115,
        head: [['Catégorie', 'Méthode', 'Description', 'Montant payé']],
        body: [[
          pay.paymentCategory || 'Paiement de frais',
          pay.paymentMethod || 'MOBILE_MONEY',
          pay.notes || 'Paiement traité avec succès',
          `${Number(pay.amount || 0).toLocaleString()} GNF`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [43, 76, 126], textColor: [255, 255, 255] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFont('Helvetica', 'bold');
      doc.text('Statut du relevé de compte : APPROUVÉ', 15, finalY + 20);

      const qrContent = `2CSCOMPLEXE SCOLAIRE\nRÉFÉRENCE: ${pay.paymentNumber}\nELÈVE: ${studentName}\nMONTANT: ${Number(pay.amount || 0).toLocaleString()} GNF`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);

      doc.save(`Receipt-${pay.paymentNumber}.pdf`);
      toast.success('Reçu PDF téléchargé avec succès', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Échec de la génération du reçu PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const approvedPayments = financeData?.payments?.filter((p: any) => p.status === 'APPROVED') || [];

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement du Centre de documents...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#f8fafc] min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Documents Center</p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Centre de documents</h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
            Relevés de notes officiels, relevés de frais et reçus
          </p>
        </div>

        {children.length > 0 && (
          <div className="w-full md:w-64 space-y-1 shrink-0">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Child</label>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 shadow-sm font-bold text-slate-800">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((c) => {
                  const name = c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.username;
                  return (
                    <SelectItem key={c.id} value={String(c.id)} className="font-semibold">
                      {name} ({c.userId || c.username})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {children.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center max-w-2xl mx-auto space-y-4">
          <Landmark className="mx-auto text-slate-200" size={60} />
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Aucun élève enregistré</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md mx-auto">
            Vous n'avez actuellement aucun profil d'élève lié à votre compte parent. Contactez l'administration pour établir les liens parent-élève.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            {[
              { id: 'transcripts', label: 'Relevés' },
              { id: 'statements', label: 'Relevés de compte' },
              { id: 'receipts', label: 'Reçus de paiement' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="min-h-[300px]">
            {loadingDocs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-10 h-10 border-4 animate-spin text-primary" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chargement des documents...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === 'transcripts' && (
                  <motion.div
                    key="transcripts"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {transcripts.length === 0 ? (
                      <div className="col-span-full bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
                        <FileText className="w-12 h-12 opacity-30 mx-auto mb-3" />
                        <p className="font-bold text-sm uppercase">Aucun relevé généré pour le moment</p>
                        <p className="text-xs text-slate-400 mt-1">Les relevés apparaîtront ici une fois publiés par les administrateurs de l'école.</p>
                      </div>
                    ) : transcripts.map((t) => (
                      <Card key={t.id} className="border border-slate-100 rounded-3xl bg-white shadow-sm hover:border-primary transition-colors p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 truncate"> Relevés de notes</h3>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">{t.academicYear?.name || 'Année Académique'}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold">Ref: {t.referenceNumber}</p>
                        </div>
                        <button
                          disabled={downloadingId === `transcript-${t.id}`}
                          onClick={() => downloadTranscript(t)}
                          className="shrink-0 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white rounded-xl h-10 w-10 text-slate-600 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === `transcript-${t.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </Card>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'statements' && (
                  <motion.div
                    key="statements"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="max-w-xl"
                  >
                    {!financeData ? (
                      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
                        <Landmark className="w-12 h-12 opacity-30 mx-auto mb-3" />
                        <p className="font-bold text-sm uppercase">Aucun relevé de compte trouvé</p>
                      </div>
                    ) : (
                      <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                            <Landmark className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900">Relevés de compte</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5"> Chronologique des frais facturés et des paiements</p>
                            <div className="flex gap-4 mt-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Restant: <span className="text-rose-600">{Number(financeData.outstandingBalance || 0).toLocaleString()} GNF</span></span>
                            </div>
                          </div>
                        </div>
                        <button
                          disabled={downloadingId === `statement-${selectedChildId}`}
                          onClick={downloadStatement}
                          className="shrink-0 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white rounded-xl h-10 w-10 text-slate-600 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === `statement-${selectedChildId}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </Card>
                    )}
                  </motion.div>
                )}

                {activeTab === 'receipts' && (
                  <motion.div
                    key="receipts"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {approvedPayments.length === 0 ? (
                      <div className="col-span-full bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
                        <ShieldCheck className="w-12 h-12 opacity-30 mx-auto mb-3" />
                        <p className="font-bold text-sm uppercase">Aucun reçu de paiement disponible</p>
                        <p className="text-xs text-slate-400 mt-1">Les reçus sont générés instantanément une fois qu'une collecte de paiement est effacée et approuvée par l'administration de l'école.</p>
                      </div>
                    ) : approvedPayments.map((p: any) => (
                      <Card key={p.id} className="border border-slate-100 rounded-3xl bg-white shadow-sm hover:border-primary transition-colors p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 truncate">{p.paymentCategory || 'Reçu de paiement de frais de scolarité'}</h3>
                          <p className="text-xs font-bold text-emerald-600 mt-0.5">{Number(p.amount).toLocaleString()} GNF</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-bold">Ref: {p.paymentNumber} • {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button
                          disabled={downloadingId === `receipt-${p.id}`}
                          onClick={() => downloadReceipt(p)}
                          className="shrink-0 flex items-center justify-center bg-slate-50 hover:bg-primary hover:text-white rounded-xl h-10 w-10 text-slate-600 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === `receipt-${p.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </Card>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
