'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus, Check, X, Download, DollarSign, UserCheck, Clock, UserCircle2, Edit, Trash2, CreditCard, Search, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { SCHOOL_CONFIG } from '@/lib/school-config';

// ─── Searchable Staff Combobox ────────────────────────────────────────────────────
function StaffCombobox({ staff, value, onChange }: {
  staff: any[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = staff.find(s => String(s.id) === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return staff
      .filter(s =>
        (s.name || s.username || '').toLowerCase().includes(q) ||
        (s.userId || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [staff, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        className="w-full h-11 flex items-center justify-between gap-2 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected ? `${selected.name}${selected.userId ? ` (${selected.userId})` : ''}` : 'Nom ou ID de l\'employé...'}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-12 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                placeholder="Rechercher par nom ou ID d'employé..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 h-8 text-xs rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Aucun membre du personnel trouvé</p>
            ) : filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(String(s.id)); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${String(s.id) === value ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'}`}
              >
                <UserCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold">{s.name}</span>
                {s.userId && <span className="text-slate-400 text-xs">({s.userId})</span>}
                <Badge variant="secondary" className="text-[10px] ml-auto">{s.schoolRole}</Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffFinance() {
  const [role, setRole] = useState<string>('ACCOUNTANT');
  const [staff, setStaff] = useState<any[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-Select Checkboxes
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  // Dialog States
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Salary Record Form State (Create & Edit)
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [salaryMonth, setSalaryMonth] = useState<string>('June');
  const [salaryYear, setSalaryYear] = useState<number>(2026);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [allowances, setAllowances] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [salaryNotes, setSalaryNotes] = useState<string>('');

  // Payout Disbursement Form State
  const [payoutTargetRecord, setPayoutTargetRecord] = useState<any>(null); // the salary record being paid out
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<string>('BANK');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userRes, allUsersRes, financeRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/admin/users'),
        api.get('/school-finance/data/staff')
      ]);

      const rawRole: string = userRes.data.schoolRole || userRes.data.role || 'ACCOUNTANT';
      setRole(rawRole.replace('ROLE_', ''));

      const staffRoles = ['DRIVER', 'WORKER', 'TEACHER', 'ACCOUNTANT', 'ACCOUNTLEAD'];
      setStaff(
        (allUsersRes.data as any[]).filter((u: any) => staffRoles.includes(u.schoolRole)).map((u: any) => ({
          ...u,
          name: u.username || u.name
        }))
      );

      setSalaryRecords(financeRes.data?.salaryRecords || []);
      setSalaryPayments(financeRes.data?.salaryPayments || []);
    } catch (e: any) {
      toast.error('Échec de la synchronisation du grand livre de paie du personnel');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, []);

  const computedNetSalary = useMemo(() => {
    return Number(baseSalary) + Number(allowances) - Number(deductions);
  }, [baseSalary, allowances, deductions]);

  // ─── Salary Record CRUD ────────────────────────────────────────────────────
  const handleCreateOrEditSalaryRecord = async () => {
    if (!selectedStaffId) { toast.error('Veuillez sélectionner un membre du personnel'); return; }
    if (Number(baseSalary) <= 0) { toast.error('Veuillez spécifier un salaire de base positif'); return; }

    const tid = toast.loading(editingRecord ? 'Enregistrement des modifications...' : 'Génération de l\'enregistrement...');
    try {
      if (editingRecord) {
        await api.put(`/school-finance/salaries/${editingRecord.id}/update`, {
          staffId: Number(selectedStaffId),
          month: salaryMonth,
          year: Number(salaryYear),
          baseSalary: Number(baseSalary),
          allowances: Number(allowances),
          deductions: Number(deductions),
          notes: salaryNotes
        });
        toast.success('Mise à jour réussie de la déclaration de salaire', { id: tid });
      } else {
        await api.post('/school-finance/salaries', {
          staffId: Number(selectedStaffId),
          month: salaryMonth,
          year: Number(salaryYear),
          baseSalary: Number(baseSalary),
          allowances: Number(allowances),
          deductions: Number(deductions),
          notes: salaryNotes
        });
        toast.success('Dossier de salaire généré à l\'état DRAFT', { id: tid });
      }

      setIsSalaryOpen(false);
      resetSalaryForm();
      fetchAllData();
    } catch (e: any) {
      toast.error('Échec de l\'opération de paie', { id: tid });
    }
  };

  const resetSalaryForm = () => {
    setEditingRecord(null);
    setSelectedStaffId('');
    setBaseSalary(0);
    setAllowances(0);
    setDeductions(0);
    setSalaryNotes('');
    setSelectedRecordIds([]);
  };

  const startEditRecord = (rec: any) => {
    setEditingRecord(rec);
    setSelectedStaffId(String(rec.staffId || ''));
    setSalaryMonth(rec.month);
    setSalaryYear(Number(rec.year));
    setBaseSalary(Number(rec.baseSalary));
    setAllowances(Number(rec.allowances));
    setDeductions(Number(rec.deductions));
    setSalaryNotes(rec.notes || '');
    setIsSalaryOpen(true);
  };

  const handleDeleteRecord = async (rec: any) => {
    if (!confirm('Voulez-vous vraiment supprimer ce dossier de salaire ?')) return;
    const tid = toast.loading('Suppression du dossier de salaire...');
    try {
      await api.delete(`/school-finance/salaries/${rec.id}`);
      toast.success('Dossier de salaire supprimé avec succès', { id: tid });
      setSelectedRecordIds(prev => prev.filter(x => x !== rec.id));
      fetchAllData();
    } catch (e) {
      toast.error('Échec de la suppression du dossier de salaire', { id: tid });
    }
  };

  // Submit record(s) — Accountant only
  const handleSubmitRecords = async (recordIds: number[]) => {
    if (recordIds.length === 0) return;
    const tid = toast.loading(`Enregistrement de ${recordIds.length} dossier de salaire...`);
    try {
      await Promise.all(recordIds.map(id =>
        api.put(`/school-finance/salaries/${id}/update`, { status: 'SUBMITTED' })
      ));
      toast.success('Enregistrement réussi des dossiers de salaire', { id: tid });
      setSelectedRecordIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Échec de l\'enregistrement des dossiers sélectionnés', { id: tid });
    }
  };

  // Approve record(s) — AccountLead / Admin
  const handleApproveRecords = async (recordIds: number[]) => {
    if (recordIds.length === 0) return;
    const tid = toast.loading(`Validation de ${recordIds.length} dossier de salaire...`);
    try {
      await Promise.all(recordIds.map(id =>
        api.put(`/school-finance/salaries/${id}/approve`)
      ));
      toast.success('Validation réussie des dossiers de salaire', { id: tid });
      setSelectedRecordIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Échec de la validation des dossiers sélectionnés', { id: tid });
    }
  };

  const handleOpenReject = (id: number) => {
    setSelectedRecordId(id);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason) { toast.error('Veuillez fournir une raison'); return; }
    const tid = toast.loading('Rejet du dossier de salaire...');
    try {
      await api.put(`/school-finance/salaries/${selectedRecordId}/reject`, { reason: rejectionReason });
      toast.success('Dossier de salaire rejeté', { id: tid });
      setIsRejectOpen(false);
      fetchAllData();
    } catch (e: any) {
      toast.error('Échec du rejet', { id: tid });
    }
  };

  // ─── Payout Disbursement ───────────────────────────────────────────────────
  const openPayoutDialog = (rec: any) => {
    setPayoutTargetRecord(rec);
    // For PARTIALLY_PAID records, pre-fill with outstanding balance only
    const recordPayments = salaryPayments.filter(
      (p: any) => p.salaryRecordId === rec.id && p.status === 'APPROVED'
    );
    const totalDisbursed = recordPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const outstanding = Math.max(0, Number(rec.netSalary || 0) - totalDisbursed);
    setPayoutAmount(rec.status === 'PARTIALLY_PAID' ? outstanding : Number(rec.netSalary || 0));
    setPayoutMethod('BANK');
    setPayoutNotes('');
    setIsPayoutOpen(true);
  };

  const handleDisbursePayout = async () => {
    if (!payoutTargetRecord) { toast.error('Veuillez sélectionner un dossier de salaire'); return; }
    if (Number(payoutAmount) <= 0) { toast.error('Veuillez spécifier un montant de paiement positif'); return; }

    const tid = toast.loading('Traitement du décaissement de salaire...');
    try {
      // Step 1: Create the salary payment (returns payment with its ID)
      const createRes = await api.post('/school-finance/salary-payments', {
        salaryRecordId: payoutTargetRecord.id,
        staffId: payoutTargetRecord.staffId,
        amount: Number(payoutAmount),
        paymentMethod: payoutMethod,
        notes: payoutNotes
      });

      // Step 2: Immediately approve it — use the returned ID directly
      const newPaymentId = createRes.data?.id;
      if (newPaymentId) {
        await api.put(`/school-finance/salary-payments/${newPaymentId}/approve`);
      }

      toast.success('Le paiement a été effectué et approuvé avec succès', { id: tid });
      setIsPayoutOpen(false);
      setPayoutTargetRecord(null);
      fetchAllData();
    } catch (e: any) {
      toast.error('Échec du décaissement de salaire', { id: tid });
      console.error(e);
    }
  };

  // ─── PDF Payslip from Salary RECORD ────────────────────────────────────────
  const downloadPayslip = async (rec: any) => {
    const tid = toast.loading('Création du bulletin de paie en PDF...');
    try {
      const staffName = rec.staffName || 'Employé';
      const staffRole = rec.staffRole || 'Personnel';
      const staffEmail = rec.staffEmail || 'N/A';
      const base = Number(rec.baseSalary || 0);
      const allow = Number(rec.allowances || 0);
      const ded = Number(rec.deductions || 0);
      const net = Number(rec.netSalary || 0);

      // Calculate total disbursed for this record
      const recordPayments = salaryPayments.filter((p: any) =>
        p.salaryRecordId === rec.id && p.status === 'APPROVED'
      );
      const totalDisbursed = recordPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const outstanding = Math.max(0, net - totalDisbursed);

      const doc = new jsPDF();

      doc.setDrawColor(...SCHOOL_CONFIG.accentColor);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      // Header banner
      doc.setFillColor(...SCHOOL_CONFIG.primaryColor);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(SCHOOL_CONFIG.name, 15, 23);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${SCHOOL_CONFIG.subtitle} — BULLETIN DE PAIE DU PERSONNEL`, 15, 30);
      doc.text(SCHOOL_CONFIG.contact, 15, 36);
      doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 150, 22);

      // Title
      doc.setTextColor(...SCHOOL_CONFIG.primaryColor);
      doc.setFontSize(20);
      doc.setFont('Helvetica', 'bold');
      doc.text('BULLETIN DE PAIE DU PERSONNEL', 15, 70);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');

      // Record info
      doc.text(`ID dossier: ${rec.recordNumber || 'N/A'}`, 15, 80);
      doc.text(`Période de paie: ${rec.month} ${rec.year}`, 15, 87);
      doc.text(`Statut: ${rec.status}`, 15, 94);
      if (rec.notes) {
        doc.text(`Notes: ${rec.notes}`, 15, 101);
      }

      // Employee info
      doc.setFont('Helvetica', 'bold');
      doc.text('Profil de l\'employé:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Nom: ${staffName}`, 120, 87);
      doc.text(`Rôle: ${staffRole}`, 120, 94);
      doc.text(`Email: ${staffEmail}`, 120, 101);

      // Payroll breakdown
      autoTable(doc, {
        startY: 115,
        head: [['Composant de la paie', 'Montant (GNF)']],
        body: [
          ['Salaire de base', base.toLocaleString()],
          ['Allocations (+)', `+ ${allow.toLocaleString()}`],
          ['Retenues (−)', `− ${ded.toLocaleString()}`],
          ['Solde net dû', net.toLocaleString()],
          ['Total décaissé', totalDisbursed.toLocaleString()],
          ['Solde restant', outstanding.toLocaleString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: SCHOOL_CONFIG.primaryColor },
        bodyStyles: { fontSize: 10 },
        didParseCell: (data: any) => {
          if (data.row.index === 3) data.cell.styles.fontStyle = 'bold';
          if (data.row.index === 5 && outstanding > 0) data.cell.styles.textColor = [220, 38, 38];
        }
      });

      // QR Code — anchored to bottom-right corner
      const qrContent = `${SCHOOL_CONFIG.name}\nBULLETIN DE PAIE DU PERSONNEL\nRecord: ${rec.recordNumber}\nEmployé: ${staffName}\nPériode: ${rec.month} ${rec.year}\nSalaire net: ${net.toLocaleString()} GNF\nStatut: ${rec.status}\nVérifier: ${SCHOOL_CONFIG.verifyUrl}`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      // Fixed bottom-right position
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Scannez pour vérifier le bulletin de paie', 155, 286);

      doc.save(`bulletin-${rec.recordNumber || rec.id}.pdf`);
      toast.success('Le bulletin de paie a été compilé avec succès', { id: tid });
    } catch (e: any) {
      toast.error('La génération du bulletin de paie a échoué', { id: tid });
      console.error(e);
    }
  };

  // ─── Derived Lists ─────────────────────────────────────────────────────────
  const submittedRecords = useMemo(() =>
    salaryRecords.filter((r: any) => r.status === 'SUBMITTED'),
    [salaryRecords]);

  const approvedPendingPayout = useMemo(() =>
    salaryRecords.filter((r: any) => r.status === 'APPROVED'),
    [salaryRecords]);

  const approvedLedger = useMemo(() =>
    salaryRecords.filter((r: any) => ['APPROVED', 'PAID', 'PARTIALLY_PAID'].includes(r.status)),
    [salaryRecords]);

  // ─── Status Badge Helper ───────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const cls =
      status === 'PAID' ? 'bg-emerald-500 hover:bg-emerald-600' :
        status === 'PARTIALLY_PAID' ? 'bg-amber-500 hover:bg-amber-600' :
          status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' :
            status === 'SUBMITTED' ? 'bg-violet-500 hover:bg-violet-600' :
              status === 'REJECTED' ? 'bg-rose-500 hover:bg-rose-600' :
                'bg-slate-300 text-slate-800 hover:bg-slate-400';
    return <Badge className={cls}>{status}</Badge>;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase"> Paie & Finances RH</h1>
          <p className="text-sm text-slate-500 font-medium">Gérer les salaires mensuels et les décaissements pour les enseignants, chauffeurs et travailleurs</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Submit — Accountant only */}
          {role === 'ACCOUNTANT' && selectedRecordIds.length > 0 && (
            <Button
              onClick={() => handleSubmitRecords(selectedRecordIds)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5 duration-300"
            >
              Soumettre la sélection ({selectedRecordIds.length})
            </Button>
          )}

          {/* Bulk Approve — AccountLead / Admin only */}
          {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && selectedRecordIds.length > 0 && (
            <Button
              onClick={() => handleApproveRecords(selectedRecordIds)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5 duration-300"
            >
              Approuver la sélection ({selectedRecordIds.length})
            </Button>
          )}

          <Button
            onClick={() => { resetSalaryForm(); setIsSalaryOpen(true); }}
            className="flex items-center gap-2 px-5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
          >
            <Plus className="w-4 h-4" /> Créer un dossier de salaire
          </Button>
        </div>
      </div>

      {/* ── TABLE 1: Employee Monthly Payroll Accounts ── */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Comptes de paie mensuels du personnel</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="font-bold text-slate-700">ID Dossier</TableHead>
                  <TableHead className="font-bold text-slate-700">Personnel</TableHead>
                  <TableHead className="font-bold text-slate-700">Rôle</TableHead>
                  <TableHead className="font-bold text-slate-700">Période</TableHead>
                  <TableHead className="font-bold text-slate-700">Salaire de base</TableHead>
                  <TableHead className="font-bold text-slate-700">Salaire net</TableHead>
                  <TableHead className="font-bold text-slate-700">Notes</TableHead>
                  <TableHead className="font-bold text-slate-700">Statut</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-slate-400 py-10">Chargement des données de paie...</TableCell></TableRow>
                ) : salaryRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-slate-400 py-10">Aucun dossier de paie trouvé</TableCell></TableRow>
                ) : salaryRecords.map((rec: any) => {
                  const isDraftOrRejected = rec.status === 'DRAFT' || rec.status === 'REJECTED';
                  const isSubmitted = rec.status === 'SUBMITTED';
                  const isApprovedOrPaid = rec.status === 'APPROVED' || rec.status === 'PAID' || rec.status === 'PARTIALLY_PAID';
                  const isLeadOrAdmin = role === 'ACCOUNTLEAD' || role === 'ADMIN';

                  // Checkbox: accountant selects DRAFT/REJECTED to submit; lead/admin selects SUBMITTED to approve
                  const canCheck =
                    (role === 'ACCOUNTANT' && isDraftOrRejected) ||
                    (isLeadOrAdmin && isSubmitted);

                  // Edit: accountant → DRAFT/REJECTED only; lead/admin → anything except PAID
                  const canEdit =
                    (role === 'ACCOUNTANT' && isDraftOrRejected) ||
                    (isLeadOrAdmin && rec.status !== 'PAID');

                  // Delete: accountant → DRAFT/REJECTED; lead/admin → any
                  const canDelete =
                    (role === 'ACCOUNTANT' && isDraftOrRejected) ||
                    isLeadOrAdmin;

                  const canApprove = isLeadOrAdmin && (isSubmitted || isDraftOrRejected);
                  const canReject = isLeadOrAdmin && (isSubmitted || rec.status === 'APPROVED');
                  const canDownload = isApprovedOrPaid;

                  return (
                    <TableRow key={rec.id} className="hover:bg-slate-50/50 duration-200">
                      <TableCell className="w-12">
                        {canCheck && (
                          <input
                            type="checkbox"
                            checked={selectedRecordIds.includes(rec.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedRecordIds(prev => [...prev, rec.id]);
                              else setSelectedRecordIds(prev => prev.filter(id => id !== rec.id));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        )}
                      </TableCell>

                      <TableCell className="font-bold text-slate-900 text-xs">{rec.recordNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{rec.staffName || 'Unknown'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rec.staffUserId || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider">{rec.staffRole || 'N/A'}</Badge></TableCell>
                      <TableCell className="font-medium text-slate-600 text-sm">{rec.month} {rec.year}</TableCell>
                      <TableCell className="font-black text-slate-900">{Number(rec.baseSalary || 0).toLocaleString()} <span className="text-[10px] text-slate-400">GNF</span></TableCell>
                      <TableCell className="font-black text-blue-600">{Number(rec.netSalary || 0).toLocaleString()} <span className="text-[10px] text-blue-300">GNF</span></TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[120px] truncate" title={rec.notes || ''}>
                        {rec.notes ? <span className="italic">{rec.notes}</span> : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell>{statusBadge(rec.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <Button
                              onClick={() => startEditRecord(rec)}
                              size="icon" variant="ghost"
                              className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                              title="Modifier le dossier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              onClick={() => handleDeleteRecord(rec)}
                              size="icon" variant="ghost"
                              className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                              title="Supprimer le dossier"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Accountant: Submit single record */}
                          {role === 'ACCOUNTANT' && isDraftOrRejected && (
                            <Button
                              onClick={() => handleSubmitRecords([rec.id])}
                              size="sm"
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs h-8 px-3 font-bold"
                              title="Soumettre à l'approbation"
                            >
                              Soumettre
                            </Button>
                          )}

                          {/* AccountLead/Admin: Approve */}
                          {canApprove && (
                            <Button
                              onClick={() => handleApproveRecords([rec.id])}
                              size="icon"
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl h-8 w-8"
                              title="Approuver le dossier"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* AccountLead/Admin: Reject */}
                          {canReject && (
                            <Button
                              onClick={() => handleOpenReject(rec.id)}
                              size="icon"
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl h-8 w-8"
                              title="Rejeter le dossier"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {/* Download Payslip — for APPROVED/PAID records — all roles */}
                          {canDownload && (
                            <Button
                              onClick={() => downloadPayslip(rec)}
                              size="icon" variant="ghost"
                              className="rounded-xl border hover:bg-slate-50 h-8 w-8"
                              title="Télécharger le PDF du bulletin de paie"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── TABLE 2: Salary Payouts Pending Disbursement (AccountLead/Admin only) ── */}
      {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && (
        <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-slate-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Versement de salaires en attente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-slate-700">ID Dossier</TableHead>
                  <TableHead className="font-bold text-slate-700">Personnel</TableHead>
                  <TableHead className="font-bold text-slate-700">Rôle</TableHead>
                  <TableHead className="font-bold text-slate-700">Période</TableHead>
                  <TableHead className="font-bold text-slate-700">Salaire net dû</TableHead>
                  <TableHead className="font-bold text-slate-700">Statut</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedPendingPayout.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">Aucun versement de salaire approuvé en attente de décaissement</TableCell></TableRow>
                ) : approvedPendingPayout.map((rec: any) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50/50 duration-200">
                    <TableCell className="font-bold text-slate-900 text-xs">{rec.recordNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-800">{rec.staffName || 'Staff'}</p>
                          <p className="text-[10px] text-slate-400">{rec.staffUserId || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="font-bold text-[10px] uppercase">{rec.staffRole || 'N/A'}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-600">{rec.month} {rec.year}</TableCell>
                    <TableCell className="font-black text-blue-600">{Number(rec.netSalary || 0).toLocaleString()} <span className="text-[10px] text-blue-300">GNF</span></TableCell>
                    <TableCell><Badge className="bg-blue-600 hover:bg-blue-700">APProuvé</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => openPayoutDialog(rec)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Versement
                        </Button>
                        <Button
                          onClick={() => downloadPayslip(rec)}
                          size="icon" variant="ghost"
                          className="rounded-xl border hover:bg-slate-50 h-8 w-8"
                          title="Download Payslip"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── TABLE 3: Approved Payslips & Payout Ledger (all roles) ── */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" /> Bulletins de paie approuvés et grand livre de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-slate-700">ID Dossier</TableHead>
                  <TableHead className="font-bold text-slate-700">Personnel</TableHead>
                  <TableHead className="font-bold text-slate-700">Période</TableHead>
                  <TableHead className="font-bold text-slate-700">Salaire net</TableHead>
                  <TableHead className="font-bold text-slate-700">Versé</TableHead>
                  <TableHead className="font-bold text-slate-700">Restant</TableHead>
                  <TableHead className="font-bold text-slate-700">Statut</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedLedger.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-10">Aucun bulletin de paie approuvé</TableCell></TableRow>
                ) : approvedLedger.map((rec: any) => {
                  const recordPayments = salaryPayments.filter((p: any) =>
                    p.salaryRecordId === rec.id && p.status === 'APPROVED'
                  );
                  const totalDisbursed = recordPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
                  const netSalary = Number(rec.netSalary || 0);
                  const outstanding = Math.max(0, netSalary - totalDisbursed);

                  return (
                    <TableRow key={rec.id} className="hover:bg-slate-50/50 duration-200">
                      <TableCell className="font-bold text-slate-900 text-xs">{rec.recordNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCircle2 className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-800">{rec.staffName || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400">{rec.staffUserId || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{rec.month} {rec.year}</TableCell>
                      <TableCell className="font-black text-slate-900">{netSalary.toLocaleString()} <span className="text-[10px] text-slate-400">GNF</span></TableCell>
                      <TableCell className="font-bold text-emerald-600">{totalDisbursed.toLocaleString()} <span className="text-[10px] text-emerald-300">GNF</span></TableCell>
                      <TableCell className={`font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {outstanding > 0 ? `${outstanding.toLocaleString()} GNF` : '—'}
                      </TableCell>
                      <TableCell>{statusBadge(rec.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Lead/Admin: disburse remaining amount if still outstanding */}
                          {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && (rec.status === 'APPROVED' || rec.status === 'PARTIALLY_PAID') && (
                            <Button
                              onClick={() => openPayoutDialog(rec)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Verser
                            </Button>
                          )}
                          <Button
                            onClick={() => downloadPayslip(rec)}
                            size="sm" variant="outline"
                            className="rounded-xl gap-2 text-xs"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF Bulletin
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create / Edit Salary Record Dialog ── */}
      <Dialog open={isSalaryOpen} onOpenChange={(open) => { setIsSalaryOpen(open); if (!open) resetSalaryForm(); }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingRecord ? 'Modifier le bulletin de paie' : 'Générer le bulletin de paie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Personnel</label>
              <StaffCombobox
                staff={staff}
                value={selectedStaffId}
                onChange={setSelectedStaffId}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Mois</label>
                <Select value={salaryMonth} onValueChange={setSalaryMonth}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Année</label>
                <Input
                  type="number"
                  value={salaryYear}
                  onChange={(e) => setSalaryYear(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Salaire de base (GNF)</label>
              <Input
                type="number"
                value={baseSalary || ''}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                className="h-11 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Indemnités (GNF)</label>
                <Input
                  type="number"
                  value={allowances || ''}
                  onChange={(e) => setAllowances(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Retenues (GNF)</label>
                <Input
                  type="number"
                  value={deductions || ''}
                  onChange={(e) => setDeductions(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 text-rose-600"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border rounded-2xl flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Salaire net à verser</span>
              <span className="text-lg font-black text-blue-600">{computedNetSalary.toLocaleString()} GNF</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Notes de paie</label>
              <Input
                value={salaryNotes}
                onChange={(e) => setSalaryNotes(e.target.value)}
                placeholder="Remarks, tax offsets, details..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateOrEditSalaryRecord}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              {editingRecord ? 'Enregistrer les modifications' : 'Générer le bulletin de paie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Disburse Payout Dialog ── */}
      <Dialog open={isPayoutOpen} onOpenChange={(open) => { setIsPayoutOpen(open); if (!open) setPayoutTargetRecord(null); }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              Verser le salaire
            </DialogTitle>
          </DialogHeader>
          {payoutTargetRecord && (
            <div className="space-y-4 py-4">
              {/* Record summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border space-y-1">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Dossier de paie</p>
                <p className="font-bold text-slate-900">{payoutTargetRecord.recordNumber}</p>
                <p className="text-sm text-slate-600">{payoutTargetRecord.staffName} — {payoutTargetRecord.month} {payoutTargetRecord.year}</p>
                <p className="text-xs text-slate-500">Salaire net dû: <span className="font-black text-blue-600">{Number(payoutTargetRecord.netSalary || 0).toLocaleString()} GNF</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Montant à verser (GNF)</label>
                <Input
                  type="number"
                  value={payoutAmount || ''}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50 font-black text-lg text-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Mode de versement</label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Espèces</SelectItem>
                    <SelectItem value="BANK">Transfert bancaire</SelectItem>
                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    <SelectItem value="CARD">Carte de débit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Notes de versement</label>
                <Input
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Référence, détails de la transaction..."
                  className="h-11 rounded-xl bg-slate-50"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleDisbursePayout}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              <DollarSign className="w-4 h-4 mr-2" /> Confirmer le versement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-sm bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-md font-black uppercase tracking-wide text-rose-600">Rejet de dossier de paie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Motif du rejet</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Spécifier le motif du rejet..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRejectSubmit}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs duration-300"
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
