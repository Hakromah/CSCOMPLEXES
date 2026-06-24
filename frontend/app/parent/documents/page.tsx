'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Loader2, Landmark, ShieldCheck, UserCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
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
        toast.error('Failed to load children profiles');
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
        console.error('Failed to sync child documents', err);
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
    const toastId = toast.loading('Compiling report card PDF...');
    try {
      const previewRes = await api.get(`/parent/children/${selectedChildId}/transcripts/${t.id}/preview`);
      const data = previewRes.data;

      const s = data.student;
      const sch = data.school;
      const sum = data.summary;
      const meta = data.metadata;

      const qrString = `AMF ACADEMY OFFICIAL TRANSCRIPT\n` +
        `Ref: ${meta.referenceNumber}\n` +
        `Student: ${s.name}\n` +
        `Student ID: ${s.userId || String(s.id)}\n` +
        `Academic Year: ${meta.academicYears.join(', ')}\n` +
        `Status: Verified by Administration`;

      const qrCodeUrl = await QRCode.toDataURL(qrString, { margin: 2, scale: 4 });

      const doc = new jsPDF() as any;

      // Header Branding
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text((sch.name || 'School').toUpperCase(), 14, 18);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text(`Official Academic Transcript • Registries System`, 14, 25);
      doc.text(`Address: ${sch.address || ''} | Email: ${sch.email || ''} | Phone: ${sch.phone || ''}`, 14, 32);

      // Title
      doc.setTextColor(15, 23, 42);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('OFFICIAL STUDENT TRANSCRIPT', 14, 55);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 58, 196, 58);

      // Student Profile
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('STUDENT PROFILE', 14, 66);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`Name: ${s.name || 'N/A'}`, 14, 72);
      doc.text(`ID: ${s.userId || 'N/A'}`, 14, 78);
      doc.text(`Email: ${s.email || 'N/A'}`, 14, 84);
      doc.text(`Class: ${(s.classes || []).join(', ') || 'N/A'}`, 120, 72);
      doc.text(`Birth Date: ${s.birthDate ? new Date(s.birthDate).toLocaleDateString() : 'N/A'}`, 120, 78);
      doc.text(`Phone: ${s.phoneNumber || 'N/A'}`, 120, 84);

      // Meta Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 90, 182, 18, 'F');
      doc.rect(14, 90, 182, 18, 'S');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('REFERENCE NUMBER', 18, 95);
      doc.text('DATE OF ISSUE', 70, 95);
      doc.text('SEMESTERS', 110, 95);
      doc.text('TERMS', 155, 95);
      doc.setTextColor(15, 23, 42);
      doc.text(meta.referenceNumber || 'N/A', 18, 101);
      doc.text(meta.generationDate || 'N/A', 70, 101);
      doc.text((meta.semesters || []).join(', ') || 'N/A', 110, 101);
      doc.text((meta.terms || []).join(', ') || 'N/A', 155, 101);

      // Results Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('ACADEMIC PERFORMANCE SUMMARY', 14, 116);

      const tableBody = (data.results || []).map((r: any) => [
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
        bodyStyles: { fontSize: 8 }
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

      // Signatures & QR
      const sigY = currentY + 42;
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.line(14, sigY + 14, 74, sigY + 14);
      doc.text('OFFICE OF THE REGISTRAR', 14, sigY + 19);
      doc.line(136, sigY + 14, 196, sigY + 14);
      doc.text('PRINCIPAL / DEAN SIGNATURE', 136, sigY + 19);

      if (qrCodeUrl) {
        doc.addImage(qrCodeUrl, 'PNG', 93, sigY - 2, 24, 24);
      }

      const safeName = studentName.replace(/\s+/g, '_').toLowerCase();
      doc.save(`Transcript-${safeName}-${meta.referenceNumber || 'GEN'}.pdf`);
      toast.success('Transcript PDF downloaded successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  // ─── 2. Download Financial Statement ────────────────────────────────────────
  const downloadStatement = async () => {
    if (!financeData) return;
    const docKey = `statement-${selectedChildId}`;
    setDownloadingId(docKey);
    const toastId = toast.loading('Compiling ledger statement...');
    try {
      const doc = new jsPDF();
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('AMFOFANA ACADEMY', 15, 22);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text('STATEMENT OF ACCOUNT', 15, 30);
      doc.text('Conakry, Guinea | billing@amfofana.edu', 15, 37);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 130, 22);

      // Student info
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text('Student Information', 15, 58);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Name: ${studentName}`, 15, 66);
      doc.text(`Student ID: ${selectedChild?.userId || 'N/A'}`, 15, 73);
      doc.text(`Email: ${selectedChild?.email || 'N/A'}`, 15, 80);

      // Summary Card
      doc.setDrawColor(203, 213, 225);
      doc.rect(120, 54, 85, 35);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.text('Account Summary', 125, 62);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Billed: ${Number(financeData.totalCharged || 0).toLocaleString()} GNF`, 125, 70);
      doc.text(`Total Paid:   ${Number(financeData.totalPaid || 0).toLocaleString()} GNF`, 125, 77);
      doc.text(`Outstanding:  ${Number(financeData.outstandingBalance || 0).toLocaleString()} GNF`, 125, 84);

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
      doc.text('Account Activity Ledger (Chronological)', 15, 96);

      autoTable(doc, {
        startY: 100,
        head: [['Date', 'Reference #', 'Type', 'Description', 'Billed (Dr)', 'Paid (Cr)', 'Balance']],
        body: ledgerRows.length > 0 ? ledgerRows : [['—', '—', '—', 'No transactions logged', '—', '—', '—']],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8 }
      });

      const qrContent = `AMFOFANA ACADEMY\nFinancial Statement\nStudent: ${studentName}\nTotal Billed: ${Number(financeData.totalCharged || 0).toLocaleString()} GNF\nOutstanding: ${Number(financeData.outstandingBalance || 0).toLocaleString()} GNF`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);

      const safeName = studentName.replace(/\s+/g, '_').toLowerCase();
      doc.save(`Statement-${safeName}.pdf`);
      toast.success('Account statement downloaded successfully', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate statement', { id: toastId });
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
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('AMFOFANA ACADEMY', 15, 23);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text('ENTERPRISE FINANCIAL LEDGER RECEIPT', 15, 30);
      doc.text('Conakry, Guinea | billing@amfofana.edu', 15, 36);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('PAYMENT RECEIPT', 15, 70);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Receipt Reference: ${pay.paymentNumber}`, 15, 80);
      doc.text(`Invoice Ref: ${pay.invoice?.invoiceNumber || 'N/A'}`, 15, 87);
      doc.text(`Payment Date: ${new Date(pay.paymentDate || pay.createdAt).toLocaleDateString()}`, 15, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text('Billed Student Profile:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name: ${studentName}`, 120, 87);
      doc.text(`Student ID: ${selectedChild?.userId || 'N/A'}`, 120, 94);

      autoTable(doc, {
        startY: 115,
        head: [['Category', 'Method', 'Description', 'Amount Paid']],
        body: [[
          pay.paymentCategory || 'Fee Payment',
          pay.paymentMethod || 'MOBILE_MONEY',
          pay.notes || 'Payment processed successfully',
          `${Number(pay.amount || 0).toLocaleString()} GNF`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFont('Helvetica', 'bold');
      doc.text('Ledger Summary Status: APPROVED', 15, finalY + 20);

      const qrContent = `AMFOFANA ACADEMY RECEIPT\nReceipt: ${pay.paymentNumber}\nStudent: ${studentName}\nAmount: ${Number(pay.amount || 0).toLocaleString()} GNF`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);

      doc.save(`Receipt-${pay.paymentNumber}.pdf`);
      toast.success('Payment receipt PDF downloaded', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate receipt PDF', { id: toastId });
    } finally {
      setDownloadingId(null);
    }
  };

  const approvedPayments = financeData?.payments?.filter((p: any) => p.status === 'APPROVED') || [];

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Documents Library...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 bg-[#f8fafc] min-h-screen max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Repository</p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Documents Center</h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">
            Official academic reports, fee statements and receipts
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
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Children Registered</h2>
          <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-md mx-auto">
            You do not currently have any student profiles linked to your parent account. Contact administration to establish parent-student bindings.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            {[
              { id: 'transcripts', label: 'Report Cards' },
              { id: 'statements', label: 'Ledger Statements' },
              { id: 'receipts', label: 'Payment Receipts' }
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
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading files...</p>
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
                        <p className="font-bold text-sm uppercase">No report cards generated yet</p>
                        <p className="text-xs text-slate-400 mt-1">Transcripts will appear here once published by school administrators.</p>
                      </div>
                    ) : transcripts.map((t) => (
                      <Card key={t.id} className="border border-slate-100 rounded-3xl bg-white shadow-sm hover:border-primary transition-colors p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 truncate">Academic Report Card</h3>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">{t.academicYear?.name || 'Academic Year'}</p>
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
                        <p className="font-bold text-sm uppercase">No financial record found</p>
                      </div>
                    ) : (
                      <Card className="border border-slate-100 rounded-3xl bg-white shadow-sm p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                            <Landmark className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900">Consolidated Account Ledger</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Chronological Statement of Billed Fees & Payments</p>
                            <div className="flex gap-4 mt-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Outstanding: <span className="text-rose-600">{Number(financeData.outstandingBalance || 0).toLocaleString()} GNF</span></span>
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
                        <p className="font-bold text-sm uppercase">No payment receipts available</p>
                        <p className="text-xs text-slate-400 mt-1">Receipts are generated instantly once a payment collection is cleared and approved by school administration.</p>
                      </div>
                    ) : approvedPayments.map((p: any) => (
                      <Card key={p.id} className="border border-slate-100 rounded-3xl bg-white shadow-sm hover:border-primary transition-colors p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-slate-900 truncate">{p.paymentCategory || 'School Fee Receipt'}</h3>
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
