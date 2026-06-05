'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search, Plus, Check, X, FileText, Download, Edit, Trash2,
  DollarSign, Clock, UserCircle2, ChevronDown
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

// ─── Searchable Student Combobox ───────────────────────────────────────────────
function StudentCombobox({ students, value, onChange, placeholder = 'Search student name or ID...' }: {
  students: any[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = students.find(s => String(s.id) === value);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students
      .filter(s =>
        (s.username || '').toLowerCase().includes(q) ||
        (s.userId || '').toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [students, query]);

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
          {selected ? `${selected.username}${selected.userId ? ` (${selected.userId})` : ''}` : placeholder}
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
                placeholder="Search by name or student ID..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-8 pr-3 h-8 text-xs rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No students found</p>
            ) : filtered.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { onChange(String(s.id)); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${String(s.id) === value ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'}`}
              >
                <UserCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold">{s.username}</span>
                {s.userId && <span className="text-slate-400 text-xs">({s.userId})</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FlatInvoice {
  id: number;
  documentId: string;
  invoiceNumber: string;
  month: string;
  year: number;
  status: string;
  subtotal: number;
  totalPaid: number;
  remainingBalance: number;
  notes: string;
  items: any[];
  dueDate: string;
  rejectionReason?: string;
  // Flat student fields embedded by backend
  studentId: number | null;
  studentDocumentId: string | null;
  studentName: string | null;
  studentUserId: string | null;
  studentEmail: string | null;
}

interface FlatPayment {
  id: number;
  documentId: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentCategory: string;
  status: string;
  notes: string;
  rejectionReason?: string;
  // Flat invoice fields
  invoiceId: number | null;
  invoiceDocumentId: string | null;
  invoiceNumber: string | null;
  invoiceRemainingBalance: number;
  // Flat student fields
  studentId: number | null;
  studentName: string | null;
  studentUserId: string | null;
  studentEmail: string | null;
}

interface StudentUser {
  id: number;
  username: string;
  userId: string;
  email: string;
}

export default function StudentFinance() {
  const [role, setRole] = useState<string>('ACCOUNTANT');
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [invoices, setInvoices] = useState<FlatInvoice[]>([]);
  const [payments, setPayments] = useState<FlatPayment[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Multi-Select Checkboxes
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<number[]>([]);

  // Dialog States
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectType, setRejectType] = useState<'INVOICE' | 'PAYMENT'>('INVOICE');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Invoice Form State (Create & Edit)
  const [editingInvoice, setEditingInvoice] = useState<FlatInvoice | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [invoiceClassId, setInvoiceClassId] = useState<string>('NONE');
  const [invoiceMonth, setInvoiceMonth] = useState<string>('June');
  const [invoiceYear, setInvoiceYear] = useState<number>(new Date().getFullYear());
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [chargeItems, setChargeItems] = useState<any[]>([
    { description: 'Tuition Fee', amount: 500000, category: 'TUITION' }
  ]);

  // Payment Form State (Receive & Edit)
  const [editingPayment, setEditingPayment] = useState<FlatPayment | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentClassId, setPaymentClassId] = useState<string>('NONE');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('MOBILE_MONEY');
  const [paymentCategory, setPaymentCategory] = useState<string>('TUITION');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [userRes, studentRes, classRes, financeRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/admin/users?role=STUDENT'),
        api.get('/admin/classes'),
        api.get('/school-finance/data/students')  // Custom flat endpoint — no populate issues
      ]);

      const rawRole: string = userRes.data.schoolRole || userRes.data.role || 'ACCOUNTANT';
      setRole(rawRole.replace('ROLE_', ''));

      setStudents(
        (studentRes.data as any[]).map((s: any) => ({
          id: s.id,
          username: s.username || s.name || '',
          userId: s.userId || '',
          email: s.email || ''
        }))
      );
      setClasses(classRes.data || []);
      setInvoices(financeRes.data?.invoices || []);
      setPayments(financeRes.data?.payments || []);
    } catch (e: any) {
      toast.error('Failed to sync finance ledger');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ─── Filtered Lists ────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const nameMatch = (inv.studentName || '').toLowerCase().includes(search.toLowerCase());
      const numMatch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter === 'ALL' || inv.status === statusFilter;
      const classMatch = classFilter === 'ALL' || (
        inv.studentId !== null &&
        classes.some((cls: any) => {
          if (String(cls.id) !== classFilter) return false;
          return (cls.students || cls.users || []).some((s: any) => s.id === inv.studentId);
        })
      );
      return (nameMatch || numMatch) && statusMatch && classMatch;
    });
  }, [invoices, search, statusFilter, classFilter, classes]);

  // ─── Invoice CRUD ──────────────────────────────────────────────────────────
  const handleCreateOrEditInvoice = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    const subtotal = chargeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    if (subtotal <= 0) {
      toast.error('Breakdown amounts must be greater than 0');
      return;
    }

    const tid = toast.loading(editingInvoice ? 'Saving changes...' : 'Generating invoice...');
    try {
      if (editingInvoice) {
        await api.put(`/school-finance/invoices/${editingInvoice.id}/update`, {
          studentId: Number(selectedStudentId),
          month: invoiceMonth,
          year: Number(invoiceYear),
          notes: invoiceNotes,
          items: chargeItems,
        });
        toast.success('Invoice updated successfully', { id: tid });
      } else {
        await api.post('/school-finance/invoices', {
          studentId: Number(selectedStudentId),
          month: invoiceMonth,
          year: Number(invoiceYear),
          notes: invoiceNotes,
          items: chargeItems,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]
        });
        toast.success('Invoice drafted successfully', { id: tid });
      }

      setIsInvoiceOpen(false);
      setEditingInvoice(null);
      setSelectedStudentId('');
      setInvoiceNotes('');
      setChargeItems([{ description: 'Tuition Fee', amount: 500000, category: 'TUITION' }]);
      setSelectedInvoiceIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Invoice operation failed', { id: tid });
    }
  };

  const startEditInvoice = (inv: FlatInvoice) => {
    setEditingInvoice(inv);
    // Pre-populate student dropdown with the student's numeric ID
    setSelectedStudentId(String(inv.studentId || ''));
    setInvoiceMonth(inv.month);
    setInvoiceYear(Number(inv.year));
    setInvoiceNotes(inv.notes || '');
    setChargeItems(inv.items?.length ? inv.items : [{ description: 'Tuition Fee', amount: 500000, category: 'TUITION' }]);
    setIsInvoiceOpen(true);
  };

  const handleDeleteInvoice = async (inv: FlatInvoice) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const tid = toast.loading('Deleting invoice...');
    try {
      await api.delete(`/school-finance/invoices/${inv.id}`);
      toast.success('Invoice deleted', { id: tid });
      setSelectedInvoiceIds(selectedInvoiceIds.filter(x => x !== inv.id));
      setInvoices(prev => prev.filter(i => i.id !== inv.id));
    } catch (e) {
      toast.error('Failed to delete invoice', { id: tid });
    }
  };

  const handleSubmitSelectedInvoices = async () => {
    const tid = toast.loading(`Submitting ${selectedInvoiceIds.length} invoices...`);
    try {
      await Promise.all(selectedInvoiceIds.map(id => {
        return api.put(`/school-finance/invoices/${id}/update`, { status: 'SUBMITTED' });
      }));
      toast.success('Invoices submitted to Account Lead', { id: tid });
      setSelectedInvoiceIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to submit selected invoices', { id: tid });
    }
  };

  // ─── Payment CRUD ──────────────────────────────────────────────────────────
  const handleCreateOrEditPayment = async () => {
    if (!selectedInvoiceId) {
      toast.error('Please select an invoice');
      return;
    }
    if (Number(paymentAmount) <= 0) {
      toast.error('Please specify a positive payment amount');
      return;
    }

    const inv = invoices.find(i => String(i.id) === selectedInvoiceId);

    const tid = toast.loading(editingPayment ? 'Saving changes...' : 'Logging payment...');
    try {
      if (editingPayment) {
        await api.put(`/school-finance/payments/${editingPayment.id}/update`, {
          invoiceId: Number(selectedInvoiceId),
          studentId: inv?.studentId,
          amount: Number(paymentAmount),
          paymentMethod,
          paymentCategory,
          notes: paymentNotes
        });
        toast.success('Payment log updated', { id: tid });
      } else {
        await api.post('/school-finance/payments', {
          invoiceId: Number(selectedInvoiceId),
          studentId: inv?.studentId,
          amount: Number(paymentAmount),
          paymentMethod,
          paymentCategory,
          notes: paymentNotes
        });
        toast.success('Payment logged as DRAFT', { id: tid });
      }

      setIsPaymentOpen(false);
      setEditingPayment(null);
      setPaymentAmount(0);
      setPaymentNotes('');
      setSelectedInvoiceId('');
      setSelectedPaymentIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error('Collection log failed', { id: tid });
    }
  };

  const startEditPayment = (pay: FlatPayment) => {
    setEditingPayment(pay);
    setSelectedInvoiceId(String(pay.invoiceId || ''));
    setPaymentAmount(pay.amount);
    setPaymentMethod(pay.paymentMethod);
    setPaymentCategory(pay.paymentCategory);
    setPaymentNotes(pay.notes || '');
    setIsPaymentOpen(true);
  };

  const handleDeletePayment = async (pay: FlatPayment) => {
    if (!confirm('Are you sure you want to delete this payment log?')) return;
    const tid = toast.loading('Deleting payment...');
    try {
      await api.delete(`/school-finance/payments/${pay.id}`);
      toast.success('Payment log deleted', { id: tid });
      setSelectedPaymentIds(selectedPaymentIds.filter(x => x !== pay.id));
      setPayments(prev => prev.filter(p => p.id !== pay.id));
    } catch (e) {
      toast.error('Failed to delete payment log', { id: tid });
    }
  };

  const handleSubmitSelectedPayments = async () => {
    const tid = toast.loading(`Submitting ${selectedPaymentIds.length} payments...`);
    try {
      await Promise.all(selectedPaymentIds.map(id => {
        return api.put(`/school-finance/payments/${id}/update`, { status: 'SUBMITTED' });
      }));
      toast.success('Payments submitted for approval', { id: tid });
      setSelectedPaymentIds([]);
      fetchAllData();
    } catch (e) {
      toast.error('Failed to submit selected payments', { id: tid });
    }
  };

  // ─── Approval Workflow ─────────────────────────────────────────────────────
  const handleApprove = async (id: number, type: 'INVOICE' | 'PAYMENT') => {
    const endpoint = type === 'INVOICE'
      ? `/school-finance/invoices/${id}/approve`
      : `/school-finance/payments/${id}/approve`;
    const tid = toast.loading(`Approving ${type.toLowerCase()}...`);
    try {
      await api.put(endpoint);
      toast.success(`${type} approved successfully`, { id: tid });
      fetchAllData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Approval failed', { id: tid });
    }
  };

  const handleOpenReject = (id: number, type: 'INVOICE' | 'PAYMENT') => {
    setSelectedRecordId(id);
    setRejectType(type);
    setRejectionReason('');
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    const endpoint = rejectType === 'INVOICE'
      ? `/school-finance/invoices/${selectedRecordId}/reject`
      : `/school-finance/payments/${selectedRecordId}/reject`;
    const tid = toast.loading('Submitting rejection...');
    try {
      await api.put(endpoint, { reason: rejectionReason });
      toast.success(`${rejectType} rejected`, { id: tid });
      setIsRejectOpen(false);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Rejection failed', { id: tid });
    }
  };

  const handleBulkApproveInvoices = async () => {
    if (selectedInvoiceIds.length === 0) return;
    const tid = toast.loading(`Approving ${selectedInvoiceIds.length} invoices...`);
    try {
      await Promise.all(selectedInvoiceIds.map(id =>
        api.put(`/school-finance/invoices/${id}/approve`)
      ));
      toast.success('Invoices approved successfully', { id: tid });
      setSelectedInvoiceIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Failed to approve selected invoices', { id: tid });
    }
  };

  const handleBulkApprovePayments = async () => {
    if (selectedPaymentIds.length === 0) return;
    const tid = toast.loading(`Approving ${selectedPaymentIds.length} payments...`);
    try {
      await Promise.all(selectedPaymentIds.map(id =>
        api.put(`/school-finance/payments/${id}/approve`)
      ));
      toast.success('Payments approved successfully', { id: tid });
      setSelectedPaymentIds([]);
      fetchAllData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Failed to approve selected payments', { id: tid });
    }
  };

  // ─── PDF Downloads ─────────────────────────────────────────────────────────
  const downloadReceipt = async (paymentDocId: string, paymentId: number) => {
    const tid = toast.loading('Compiling receipt...');
    try {
      // Use flat payment from state — avoids Strapi v5 populate REST failures
      const pay = payments.find(p => p.id === paymentId) || payments.find(p => p.documentId === paymentDocId);
      if (!pay) {
        toast.error('Payment record not found', { id: tid });
        return;
      }

      const studentName = pay.studentName || 'Student';
      const studentUserId = pay.studentUserId || 'N/A';
      const studentEmail = pay.studentEmail || 'N/A';
      const invoiceNumber = pay.invoiceNumber || 'N/A';
      const remainingBalance = pay.invoiceRemainingBalance ?? 0;

      // Try to fetch receipt number — gracefully fall back if not found
      let receiptNumber = `REC-TEMP-${paymentId}`;
      let qrContent = `AMFOFANA ACADEMY\nInvoice: ${invoiceNumber}\nStudent: ${studentName}\nID: ${studentUserId}\nAmount: ${Number(pay.amount).toLocaleString()} GNF`;
      try {
        const rcRes = await api.get(`/receipts?filters[studentPayment][id][$eq]=${paymentId}&fields[0]=receiptNumber&fields[1]=qrCode`);
        const receiptArr = rcRes.data?.data || rcRes.data || [];
        const receiptRaw = Array.isArray(receiptArr) ? receiptArr[0] : receiptArr;
        const receiptAttrs = receiptRaw?.attributes || receiptRaw || {};
        if (receiptAttrs.receiptNumber) {
          receiptNumber = receiptAttrs.receiptNumber;
        }
        if (receiptAttrs.qrCode) {
          qrContent = receiptAttrs.qrCode;
        }
      } catch (_) {
        // receipt lookup failed — use fallback values
      }

      const doc = new jsPDF();
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

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

      doc.text(`Receipt Number: ${receiptNumber}`, 15, 80);
      doc.text(`Invoice Ref: ${invoiceNumber}`, 15, 87);
      doc.text(`Payment Date: ${new Date(pay.paymentDate || new Date()).toLocaleDateString()}`, 15, 94);

      doc.setFont('Helvetica', 'bold');
      doc.text('Billed Student Profile:', 120, 80);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Name: ${studentName}`, 120, 87);
      doc.text(`ID: ${studentUserId}`, 120, 94);
      doc.text(`Email: ${studentEmail}`, 120, 101);

      autoTable(doc, {
        startY: 115,
        head: [['Category', 'Method', 'Description', 'Amount Paid']],
        body: [[
          pay.paymentCategory || 'Fee',
          pay.paymentMethod || 'Cash',
          pay.notes || 'Payment received',
          `${Number(pay.amount || 0).toLocaleString()} GNF`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 10 }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 140;
      doc.setFont('Helvetica', 'bold');
      doc.text('Ledger Status:', 15, finalY + 20);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Amount Collected: ${Number(pay.amount || 0).toLocaleString()} GNF`, 15, finalY + 28);
      doc.text(`Remaining Invoice Balance: ${Number(remainingBalance).toLocaleString()} GNF`, 15, finalY + 35);

      // Generate QR code — anchored to bottom-right corner of the page
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Scan to verify receipt', 155, 286);

      doc.save(`Receipt-${pay.paymentNumber || 'GEN'}.pdf`);
      toast.success('PDF compiled successfully', { id: tid });
    } catch (e: any) {
      console.error('Receipt error:', e);
      toast.error('Receipt PDF generation failed', { id: tid });
    }
  };

  const downloadStatement = async (studentId: number | null) => {
    if (!studentId) {
      toast.error('Ledger export failed: Student ID was invalid');
      return;
    }
    const tid = toast.loading('Compiling ledger statement...');
    try {
      const res = await api.get(`/school-finance/statements/${studentId}`);
      const data = res.data;

      const studentName = data.studentProfile?.name || 'N/A';
      const studentUserId = data.studentProfile?.userId || 'N/A';
      const studentEmail = data.studentProfile?.email || 'N/A';

      const doc = new jsPDF();
      // Border
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);

      // Header banner
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
      doc.text(`Student ID: ${studentUserId}`, 15, 73);
      doc.text(`Email: ${studentEmail}`, 15, 80);

      // Summary box
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.rect(120, 54, 85, 35);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.text('Account Summary', 125, 62);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Billed: ${Number(data.totalInvoiced || 0).toLocaleString()} GNF`, 125, 70);
      doc.text(`Total Paid:   ${Number(data.totalPaid || 0).toLocaleString()} GNF`, 125, 77);
      doc.text(`Outstanding:  ${Number(data.outstandingBalance || 0).toLocaleString()} GNF`, 125, 84);

      // Merge and sort activities chronologically
      const activities: any[] = [];
      
      (data.invoices || []).forEach((inv: any) => {
        // Build a category summary from items if available
        const cats = Array.isArray(inv.items) && inv.items.length
          ? [...new Set(inv.items.map((it: any) => it.category || 'FEE'))].join(', ')
          : 'FEE';
        activities.push({
          date: inv.createdAt,
          ref: inv.invoiceNumber,
          type: 'INVOICE',
          description: `Invoice — ${cats} (${inv.month} ${inv.year})`,
          billed: Number(inv.subtotal || 0),
          paid: 0
        });
      });

      (data.payments || []).forEach((pay: any) => {
        activities.push({
          date: pay.paymentDate || pay.createdAt,
          ref: pay.paymentNumber,
          type: 'PAYMENT',
          description: `${pay.paymentCategory || 'Fee'} — ${pay.paymentMethod || 'N/A'}`,
          billed: 0,
          paid: Number(pay.amount || 0)
        });
      });

      // Sort by date ascending
      activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate running balance
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
        body: ledgerRows.length > 0 ? ledgerRows : [['—', '—', '—', 'No transactions found', '—', '—', '—']],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 8 },
        columnStyles: {
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right', fontStyle: 'bold' }
        }
      });

      // Add QR code — always anchored to bottom-right corner of the page
      const qrContent = `AMFOFANA ACADEMY\nStatement of Account\nStudent: ${studentName}\nID: ${studentUserId}\nTotal Billed: ${Number(data.totalInvoiced || 0).toLocaleString()} GNF\nTotal Paid: ${Number(data.totalPaid || 0).toLocaleString()} GNF\nOutstanding: ${Number(data.outstandingBalance || 0).toLocaleString()} GNF`;
      const qrDataUrl = await QRCode.toDataURL(qrContent);
      doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Scan to verify statement', 155, 286);

      doc.save(`Statement-${studentUserId || studentId}.pdf`);
      toast.success('Statement generated successfully', { id: tid });
    } catch (e: any) {
      toast.error('Ledger export failed', { id: tid });
      console.error(e);
    }
  };

  // ─── Render Helpers ────────────────────────────────────────────────────────
  const statusBadgeClass = (status: string) => {
    if (status === 'PAID') return 'bg-emerald-500 hover:bg-emerald-600';
    if (status === 'PARTIALLY_PAID') return 'bg-amber-500 hover:bg-amber-600';
    if (status === 'APPROVED') return 'bg-blue-600 hover:bg-blue-700';
    if (status === 'REJECTED') return 'bg-rose-500 hover:bg-rose-600';
    if (status === 'DRAFT') return 'bg-slate-300 text-slate-800 hover:bg-slate-400';
    return 'bg-slate-500 hover:bg-slate-600';
  };

  // Accountant: edit/delete DRAFT or REJECTED
  // AccountLead: edit/delete anything (DRAFT, REJECTED, SUBMITTED, APPROVED)
  const canEditDelete = (status: string) => {
    if (role === 'ACCOUNTANT') return status === 'DRAFT' || status === 'REJECTED';
    if (role === 'ACCOUNTLEAD' || role === 'ADMIN') return true; // full access
    return false;
  };

  // Checkbox eligibility
  const canCheckInvoice = (inv: FlatInvoice) => {
    if (role === 'ACCOUNTANT') return inv.status === 'DRAFT' || inv.status === 'REJECTED';
    if (role === 'ACCOUNTLEAD' || role === 'ADMIN') return inv.status !== 'PAID'; // can select any non-paid
    return false;
  };

  const canCheckPayment = (pay: FlatPayment) => {
    if (role === 'ACCOUNTANT') return pay.status === 'DRAFT' || pay.status === 'REJECTED';
    if (role === 'ACCOUNTLEAD' || role === 'ADMIN') return pay.status !== 'APPROVED'; // can select non-approved
    return false;
  };
  return (
    <div className="p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 italic uppercase">Student Finance Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">Manage student invoicing billing categories and approval workflows</p>
        </div>

        <div className="flex items-center gap-3">
          {role === 'ACCOUNTANT' && selectedInvoiceIds.length > 0 && (
            <Button
              onClick={handleSubmitSelectedInvoices}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5"
            >
              Submit Selected ({selectedInvoiceIds.length})
            </Button>
          )}

          {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && selectedInvoiceIds.length > 0 && (
            <Button
              onClick={handleBulkApproveInvoices}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs px-5"
            >
              Approve Selected ({selectedInvoiceIds.length})
            </Button>
          )}

          <Button
            onClick={() => { setEditingInvoice(null); setSelectedStudentId(''); setIsInvoiceOpen(true); }}
            className="flex items-center gap-2 px-5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </Button>

          <Button
            onClick={() => { setEditingPayment(null); setSelectedInvoiceId(''); setIsPaymentOpen(true); }}
            className="flex items-center gap-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
          >
            <DollarSign className="w-4 h-4" /> Receive Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg shadow-slate-100 bg-white rounded-3xl p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search Student name or Invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-100"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted / Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-100">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((cls: any) => (
                <SelectItem key={cls.id} value={String(cls.id)}>
                  {cls.name || cls.className || `Class ${cls.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 px-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs font-bold uppercase tracking-wide">
            <Clock className="w-4 h-4" /> Session Role: <Badge variant="secondary" className="font-extrabold">{role}</Badge>
          </div>
        </div>
      </Card>

      {/* ─── Invoice Ledger Table ───────────────────────────────────────────── */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Student Billing Ledger Sheets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD' || role === 'ADMIN') && <TableHead className="w-12"></TableHead>}
                <TableHead className="font-bold text-slate-700">Invoice Number</TableHead>
                <TableHead className="font-bold text-slate-700">Student</TableHead>
                <TableHead className="font-bold text-slate-700">Billing Period</TableHead>
                <TableHead className="font-bold text-slate-700">Total Billed</TableHead>
                <TableHead className="font-bold text-slate-700">Paid</TableHead>
                <TableHead className="font-bold text-slate-700">Balance</TableHead>
                <TableHead className="font-bold text-slate-700">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-400">Loading ledger data...</TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-slate-400 font-bold uppercase text-[10px]">No invoices found</TableCell>
                </TableRow>
              ) : filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50/50 duration-200">
                  {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD' || role === 'ADMIN') && (
                    <TableCell className="w-12">
                      {canCheckInvoice(inv) && (
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.includes(inv.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceIds([...selectedInvoiceIds, inv.id]);
                            } else {
                              setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                    </TableCell>
                  )}

                  <TableCell className="font-bold tracking-tight text-slate-900">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCircle2 className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-800">{inv.studentName || <span className="text-slate-400 italic text-xs">Unknown</span>}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.studentUserId || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-600">{inv.month} {inv.year}</TableCell>
                  <TableCell className="font-black text-slate-900">{Number(inv.subtotal || 0).toLocaleString()} GNF</TableCell>
                  <TableCell className="font-semibold text-emerald-600">{Number(inv.totalPaid || 0).toLocaleString()} GNF</TableCell>
                  <TableCell className="font-semibold text-rose-600">{Number(inv.remainingBalance || 0).toLocaleString()} GNF</TableCell>
                  <TableCell>
                    <Badge className={statusBadgeClass(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit & Delete — based on role privilege */}
                      {canEditDelete(inv.status) && (
                        <>
                          <Button
                            onClick={() => startEditInvoice(inv)}
                            size="icon"
                            variant="ghost"
                            className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                            title="Edit Invoice"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteInvoice(inv)}
                            size="icon"
                            variant="ghost"
                            className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* AccountLead: Approve/Reject buttons for SUBMITTED items */}
                      {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && (inv.status === 'SUBMITTED' || inv.status === 'DRAFT') && (
                        <>
                          <Button
                            onClick={() => handleApprove(inv.id, 'INVOICE')}
                            size="icon"
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl h-8 w-8"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenReject(inv.id, 'INVOICE')}
                            size="icon"
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl h-8 w-8"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Accountant: Submit single invoice */}
                      {role === 'ACCOUNTANT' && (inv.status === 'DRAFT' || inv.status === 'REJECTED') && (
                        <Button
                          onClick={() => {
                            const tid = toast.loading('Submitting invoice...');
                            api.put(`/school-finance/invoices/${inv.id}/update`, { status: 'SUBMITTED' })
                              .then(() => { toast.success('Invoice submitted', { id: tid }); fetchAllData(); })
                              .catch(() => toast.error('Submit failed', { id: tid }));
                          }}
                          size="sm"
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold px-3 h-8"
                          title="Submit to AccountLead"
                        >
                          Submit
                        </Button>
                      )}

                      {/* Download Statement */}
                      <Button
                        onClick={() => downloadStatement(inv.studentId)}
                        size="icon"
                        variant="ghost"
                        className="rounded-xl border hover:bg-slate-50"
                        title="Download Statement"
                      >
                        <FileText className="w-4 h-4 text-slate-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Payments Pending Review (AccountLead/Admin view) ──────────────────────── */}
      {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && (
        <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-slate-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Payment Collections Pending Review / Revision
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt Ref</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.filter(p => p.status === 'SUBMITTED' || p.status === 'REJECTED').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center p-6 text-slate-400 font-bold uppercase text-[10px]">No pending reviewer collections found</TableCell>
                  </TableRow>
                ) : payments.filter(p => p.status === 'SUBMITTED' || p.status === 'REJECTED').map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.paymentNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{p.studentName || <span className="text-slate-400 italic text-xs">Unknown</span>}</p>
                        <p className="text-[10px] text-slate-400">{p.studentUserId || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{p.paymentMethod}</TableCell>
                    <TableCell><Badge variant="secondary">{p.paymentCategory}</Badge></TableCell>
                    <TableCell className="font-black">{Number(p.amount).toLocaleString()} GNF</TableCell>
                    <TableCell>
                      <Badge className={p.status === 'REJECTED' ? 'bg-rose-500' : 'bg-amber-500'}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {p.status === 'SUBMITTED' && (
                        <>
                          <Button
                            onClick={() => handleApprove(p.id, 'PAYMENT')}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleOpenReject(p.id, 'PAYMENT')}
                            size="sm"
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {p.status === 'REJECTED' && (
                        <span className="text-[10px] text-rose-500 font-extrabold uppercase bg-rose-50 px-2.5 py-1 rounded-xl">
                          Waiting Revision
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── Payments & Receipts Ledger ──────────────────────────────────────── */}
      <Card className="border-0 shadow-xl shadow-slate-100/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-500">Payments & Receipts Ledger</CardTitle>
          <div className="flex gap-2">
            {role === 'ACCOUNTANT' && selectedPaymentIds.length > 0 && (
              <Button
                onClick={handleSubmitSelectedPayments}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-8 px-4"
              >
                Submit Selected ({selectedPaymentIds.length})
              </Button>
            )}
            {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && selectedPaymentIds.length > 0 && (
              <Button
                onClick={handleBulkApprovePayments}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] h-8 px-4"
              >
                Approve Selected ({selectedPaymentIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
          <Table>
            <TableHeader>
              <TableRow>
                {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD' || role === 'ADMIN') && <TableHead className="w-12"></TableHead>}
                <TableHead>Payment Reference</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  {(role === 'ACCOUNTANT' || role === 'ACCOUNTLEAD' || role === 'ADMIN') && (
                    <TableCell className="w-12">
                      {canCheckPayment(p) && (
                        <input
                          type="checkbox"
                          checked={selectedPaymentIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPaymentIds([...selectedPaymentIds, p.id]);
                            } else {
                              setSelectedPaymentIds(selectedPaymentIds.filter(id => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      )}
                    </TableCell>
                  )}

                  <TableCell className="font-bold">{p.paymentNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{p.studentName || <span className="text-slate-400 italic text-xs">Unknown</span>}</p>
                      <p className="text-[10px] text-slate-400">{p.studentUserId || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell><Badge variant="secondary">{p.paymentCategory}</Badge></TableCell>
                  <TableCell className="font-black">{Number(p.amount).toLocaleString()} GNF</TableCell>
                  <TableCell className="text-xs text-slate-500 max-w-[100px] truncate" title={p.notes || ''}>
                    {p.notes ? <span className="italic">{p.notes}</span> : <span className="text-slate-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      p.status === 'APPROVED' ? 'bg-emerald-500' :
                      p.status === 'REJECTED' ? 'bg-rose-500' :
                      p.status === 'DRAFT' ? 'bg-slate-300 text-slate-800' :
                      'bg-amber-500'
                    }>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEditDelete(p.status) && (
                        <>
                          <Button
                            onClick={() => startEditPayment(p)}
                            size="icon"
                            variant="ghost"
                            className="rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100 text-amber-700 h-8 w-8"
                            title="Edit Log"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDeletePayment(p)}
                            size="icon"
                            variant="ghost"
                            className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 h-8 w-8"
                            title="Delete Log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      {/* AccountLead can approve/reject DRAFT payments directly */}
                      {(role === 'ACCOUNTLEAD' || role === 'ADMIN') && (p.status === 'DRAFT' || p.status === 'SUBMITTED') && (
                        <>
                          <Button
                            onClick={() => handleApprove(p.id, 'PAYMENT')}
                            size="icon"
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl h-8 w-8"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleOpenReject(p.id, 'PAYMENT')}
                            size="icon"
                            className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl h-8 w-8"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Accountant: Submit single payment */}
                      {role === 'ACCOUNTANT' && (p.status === 'DRAFT' || p.status === 'REJECTED') && (
                        <Button
                          onClick={() => {
                            const tid = toast.loading('Submitting payment...');
                            api.put(`/school-finance/payments/${p.id}/update`, { status: 'SUBMITTED' })
                              .then(() => { toast.success('Payment submitted', { id: tid }); fetchAllData(); })
                              .catch(() => toast.error('Submit failed', { id: tid }));
                          }}
                          size="sm"
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold px-3 h-8"
                        >
                          Submit
                        </Button>
                      )}

                      {p.status === 'APPROVED' && (
                        <Button
                          onClick={() => downloadReceipt(p.documentId || String(p.id), p.id)}
                          size="sm"
                          variant="outline"
                          className="rounded-lg gap-2 text-xs"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create / Edit Invoice Dialog ────────────────────────────────────── */}
      <Dialog open={isInvoiceOpen} onOpenChange={(open) => { setIsInvoiceOpen(open); if (!open) { setEditingInvoice(null); setSelectedStudentId(''); setInvoiceClassId('NONE'); } }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingInvoice ? 'Edit Student Billing Invoice' : 'Generate Student Billing Invoice'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Select Student</label>
              <StudentCombobox
                students={students}
                value={selectedStudentId}
                onChange={setSelectedStudentId}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Student Class (optional)</label>
              <Select value={invoiceClassId} onValueChange={setInvoiceClassId}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Select class..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Class</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.name || cls.className || `Class ${cls.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Billing Month</label>
                <Select value={invoiceMonth} onValueChange={setInvoiceMonth}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Billing Year</label>
                <Input
                  type="number"
                  value={invoiceYear}
                  onChange={(e) => setInvoiceYear(Number(e.target.value))}
                  className="h-11 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black uppercase text-slate-400">Fee Breakdown Items</label>
                <Button
                  onClick={() => setChargeItems([...chargeItems, { description: '', amount: 0, category: 'OTHER' }])}
                  className="h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider"
                >
                  Add Custom Item
                </Button>
              </div>

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                {chargeItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                    <Input
                      placeholder="e.g. Tuition Fee"
                      value={item.description}
                      onChange={(e) => {
                        const next = [...chargeItems];
                        next[idx].description = e.target.value;
                        setChargeItems(next);
                      }}
                      className="col-span-4 h-9 rounded-lg bg-slate-50 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount || ''}
                      onChange={(e) => {
                        const next = [...chargeItems];
                        next[idx].amount = Number(e.target.value);
                        setChargeItems(next);
                      }}
                      className="col-span-3 h-9 rounded-lg bg-slate-50 text-xs"
                    />
                    <Select
                      value={item.category || 'TUITION'}
                      onValueChange={(val) => {
                        const next = [...chargeItems];
                        next[idx].category = val;
                        setChargeItems(next);
                      }}
                    >
                      <SelectTrigger className="col-span-4 h-9 rounded-lg bg-slate-50 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TUITION">Tuition</SelectItem>
                        <SelectItem value="TRANSPORT">Transport</SelectItem>
                        <SelectItem value="TSHIRT">T-Shirt / Uniform</SelectItem>
                        <SelectItem value="REGISTRATION">Registration</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => setChargeItems(chargeItems.filter((_, i) => i !== idx))}
                      className="col-span-1 h-9 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg px-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Additional Ledger Notes</label>
              <Input
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Terms, bank guidelines, custom notes..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateOrEditInvoice}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              {editingInvoice ? 'Save Invoice Changes' : 'Generate Billing Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Receive / Edit Payment Dialog ───────────────────────────────────── */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => { setIsPaymentOpen(open); if (!open) { setEditingPayment(null); setSelectedInvoiceId(''); setPaymentClassId('NONE'); } }}>
        <DialogContent className="max-w-md bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-wide">
              {editingPayment ? 'Edit Student Payment Log' : 'Receive Student Payment Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Student Class (optional)</label>
              <Select value={paymentClassId} onValueChange={setPaymentClassId}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Select class..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Class</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={String(cls.id)}>
                      {cls.name || cls.className || `Class ${cls.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Select Billing Invoice</label>
              <Select
                value={selectedInvoiceId}
                onValueChange={(val) => {
                  setSelectedInvoiceId(val);
                  const inv = invoices.find(i => String(i.id) === val);
                  setPaymentAmount(inv?.remainingBalance || 0);
                }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                  <SelectValue placeholder="Select invoice ref..." />
                </SelectTrigger>
                <SelectContent className="max-h-[250px] overflow-y-auto">
                  {invoices.filter(i => {
                    if (editingPayment) return true;
                    return i.status === 'APPROVED' || i.status === 'PARTIALLY_PAID';
                  }).map((inv) => {
                    const studentName = inv.studentName || 'Student';
                    const studentUID = inv.studentUserId ? ` (${inv.studentUserId})` : '';
                    return (
                      <SelectItem key={inv.id} value={String(inv.id)}>
                        {inv.invoiceNumber} — {studentName}{studentUID} ({Number(inv.remainingBalance).toLocaleString()} GNF due)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Disbursed Amount (GNF)</label>
              <Input
                type="number"
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="h-11 rounded-xl bg-slate-50 font-black text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Payment Category</label>
                <Select value={paymentCategory} onValueChange={setPaymentCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TUITION">Tuition</SelectItem>
                    <SelectItem value="TRANSPORT">Transport</SelectItem>
                    <SelectItem value="TSHIRT">T-Shirt / Uniform</SelectItem>
                    <SelectItem value="REGISTRATION">Registration</SelectItem>
                    <SelectItem value="OTHER">Other Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-slate-400">Disbursed Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                    <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                    <SelectItem value="CARD">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Collection Notes</label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Txn ID, references, details..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateOrEditPayment}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              {editingPayment ? 'Save Payment Changes' : 'Submit Payment Receipt Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Record Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-sm bg-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-md font-black uppercase tracking-wide text-rose-600">Reject {rejectType} Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-slate-400">Provide Rejection Reason</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify reason for audit..."
                className="h-11 rounded-xl bg-slate-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRejectSubmit}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
