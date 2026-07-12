/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SCHOOL_CONFIG } from './school-config';
import { CIRCULAR_LOGO } from './logo-base64';

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary: [43, 76, 126] as [number, number, number], // Royal Blue
  primaryDark: [27, 54, 93] as [number, number, number], // Darker Navy
  secondary: [248, 250, 252] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
  textMuted: [100, 116, 139] as [number, number, number],
  success: [110, 190, 68] as [number, number, number], // School Green
  warning: [234, 179, 8] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [240, 253, 244] as [number, number, number], // very light green
};

// ─── Shared Header ────────────────────────────────────────────────────────────
function addSchoolHeader(doc: jsPDF, subtitle?: string) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageW, 42, 'F');

  // Draw school logo
  try {
    doc.addImage(CIRCULAR_LOGO, 'PNG', 15, 8, 26, 26);
  } catch (e) {
    console.error("Failed to add logo to PDF header", e);
  }

  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(SCHOOL_CONFIG.name, 46, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 245); // light blue-gray
  doc.text(SCHOOL_CONFIG.address || '', 46, 23);
  doc.text(`Contact: ${SCHOOL_CONFIG.contact || ''}`, 46, 29);

  if (subtitle) {
    doc.setTextColor(...COLORS.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(subtitle.toUpperCase(), pageW - 15, 20, { align: 'right' });
  }

  // Divider line in school green
  doc.setFillColor(110, 190, 68);
  doc.rect(0, 42, pageW, 1.5, 'F');
  doc.setTextColor(...COLORS.text);
}

// ─── Shared Footer ────────────────────────────────────────────────────────────
function addPageFooter(doc: jsPDF) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, pageH - 14, pageW, 14, 'F');

  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    15, pageH - 5
  );
  doc.text(`${SCHOOL_CONFIG.name} — Confidential`, pageW / 2, pageH - 5, { align: 'center' });
  doc.text(
    `Page ${doc.getCurrentPageInfo().pageNumber}`,
    pageW - 15, pageH - 5, { align: 'right' }
  );
}

// ─── Info Box Helper ──────────────────────────────────────────────────────────
function addInfoBox(doc: jsPDF, fields: { label: string; value: string }[], startY: number, cols = 2): number {
  const pageW = doc.internal.pageSize.getWidth();
  const boxW = (pageW - 30) / cols;
  const lineH = 9;
  const boxH = Math.ceil(fields.length / cols) * lineH + 12;

  doc.setFillColor(...COLORS.secondary);
  doc.roundedRect(15, startY, pageW - 30, boxH, 3, 3, 'F');
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(15, startY, pageW - 30, boxH, 3, 3, 'S');

  fields.forEach((field, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 15 + col * boxW + 8;
    const y = startY + 10 + row * lineH;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    const labelText = field.label.toUpperCase() + ':';
    doc.text(labelText, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(field.value || '—', x + doc.getTextWidth(labelText) + 2, y);
  });

  doc.setTextColor(...COLORS.text);
  return startY + boxH + 6;
}

// ─── GENERATE RECEIPT ─────────────────────────────────────────────────────────
export interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  studentId?: string;
  date: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  description: string;
  receivedBy?: string;
}

export function generateReceipt(data: ReceiptData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addSchoolHeader(doc, 'Payment Receipt');

  let y = 52;

  doc.setFillColor(...COLORS.primaryDark);
  doc.roundedRect(15, y, doc.internal.pageSize.getWidth() - 30, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text(`Receipt No: ${data.receiptNumber}`, 20, y + 8);
  doc.text(data.date, doc.internal.pageSize.getWidth() - 20, y + 8, { align: 'right' });
  y += 20;

  y = addInfoBox(doc, [
    { label: 'Student Name', value: data.studentName },
    { label: 'Student ID', value: data.studentId || '—' },
    { label: 'Payment Method', value: data.paymentMethod },
    { label: 'Received By', value: data.receivedBy || '—' },
  ], y);

  const currency = data.currency || 'GNF';
  doc.setFillColor(...COLORS.accent);
  doc.roundedRect(15, y, doc.internal.pageSize.getWidth() - 30, 22, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('AMOUNT PAID', 20, y + 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.text(`${currency} ${data.amount.toLocaleString()}`, 20, y + 18);
  y += 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textMuted);
  doc.text('Description:', 15, y);
  doc.setTextColor(...COLORS.text);
  doc.text(data.description, 50, y);

  addPageFooter(doc);
  return doc;
}

// ─── GENERATE FINANCIAL STATEMENT ─────────────────────────────────────────────
export interface StatementData {
  studentName: string;
  studentId?: string;
  className?: string;
  period?: string;
  invoices: Array<{
    invoiceNumber: string;
    month: string;
    year: number;
    dueDate: string;
    subtotal: number;
    totalPaid: number;
    remainingBalance: number;
    status: string;
    currency?: string;
  }>;
  totalCharged: number;
  totalPaid: number;
  totalOutstanding: number;
  currency?: string;
}

export function generateStatement(data: StatementData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addSchoolHeader(doc, 'Financial Statement');
  const currency = data.currency || 'GNF';

  let y = 52;
  y = addInfoBox(doc, [
    { label: 'Student', value: data.studentName },
    { label: 'ID', value: data.studentId || '—' },
    { label: 'Class', value: data.className || '—' },
    { label: 'Period', value: data.period || new Date().getFullYear().toString() },
  ], y);

  const pageW = doc.internal.pageSize.getWidth();
  const cardW = (pageW - 40) / 3;
  const cards = [
    { label: 'Total Charged', value: data.totalCharged, color: COLORS.text },
    { label: 'Total Paid', value: data.totalPaid, color: COLORS.success },
    { label: 'Outstanding', value: data.totalOutstanding, color: COLORS.danger },
  ];
  cards.forEach((card, i) => {
    const x = 15 + i * (cardW + 5);
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(x, y, cardW, 20, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(card.label.toUpperCase(), x + 5, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...card.color);
    doc.text(`${currency} ${card.value.toLocaleString()}`, x + 5, y + 16);
  });
  y += 28;

  autoTable(doc, {
    startY: y,
    head: [['Invoice #', 'Period', 'Due Date', 'Charged', 'Paid', 'Balance', 'Status']],
    body: data.invoices.map(inv => [
      inv.invoiceNumber,
      `${inv.month} ${inv.year}`,
      inv.dueDate,
      `${currency} ${inv.subtotal.toLocaleString()}`,
      `${currency} ${inv.totalPaid.toLocaleString()}`,
      `${currency} ${inv.remainingBalance.toLocaleString()}`,
      inv.status,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white as [number, number, number], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
  });

  addPageFooter(doc);
  return doc;
}

// ─── GENERATE PAYSLIP ─────────────────────────────────────────────────────────
export interface PayslipData {
  employeeName: string;
  employeeId?: string;
  employeeEmail?: string;
  role: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  totalDisbursed?: number;
  outstanding?: number;
  paymentDate?: string;
  paymentMethod?: string;
  currency?: string;
  recordNumber?: string;
  status?: string;
  notes?: string;
}

export async function generatePayslip(data: PayslipData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any;

  const base = Number(data.baseSalary || 0);
  const allow = Number(data.allowances || 0);
  const ded = Number(data.deductions || 0);
  const net = Number(data.netSalary || 0);
  const disbursed = Number(data.totalDisbursed ?? net);
  const outstanding = Number(data.outstanding ?? Math.max(0, net - disbursed));

  // Green outer border
  doc.setDrawColor(110, 190, 68);
  doc.setLineWidth(1.5);
  doc.rect(5, 5, 200, 287);

  // Header banner (Royal Blue)
  doc.setFillColor(43, 76, 126);
  doc.rect(5, 5, 200, 45, 'F');

  // Logo
  try {
    doc.addImage(CIRCULAR_LOGO, 'PNG', 15, 12, 30, 30);
  } catch (e) {
    console.error('Failed to add logo to payslip', e);
  }

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(SCHOOL_CONFIG.name, 52, 23);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(200, 220, 245);
  doc.text(`${SCHOOL_CONFIG.subtitle || SCHOOL_CONFIG.address || ''} — BULLETIN DE PAIE DU PERSONNEL`, 52, 30);
  doc.text(SCHOOL_CONFIG.contact || '', 52, 36);

  doc.setTextColor(255, 255, 255);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 196, 22, { align: 'right' });

  // Title
  doc.setTextColor(43, 76, 126);
  doc.setFontSize(20);
  doc.setFont('Helvetica', 'bold');
  doc.text('BULLETIN DE PAIE DU PERSONNEL', 15, 70);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');

  // Record info (left column)
  doc.setTextColor(30, 30, 30);
  doc.text(`ID dossier: ${data.recordNumber || 'N/A'}`, 15, 80);
  doc.text(`Période de paie: ${data.month} ${data.year}`, 15, 87);
  doc.text(`Statut: ${data.status || (disbursed >= net ? 'PAID' : 'APPROVED')}`, 15, 94);
  if (data.notes) {
    doc.text(`Notes: ${data.notes}`, 15, 101);
  }

  // Employee info (right column)
  doc.setFont('Helvetica', 'bold');
  doc.text('Profil de employé:', 120, 80);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nom: ${data.employeeName}`, 120, 87);
  doc.text(`Rôle: ${data.role}`, 120, 94);
  doc.text(`Email: ${data.employeeEmail || 'N/A'}`, 120, 101);
  if (data.employeeId) {
    doc.text(`ID: ${data.employeeId}`, 120, 108);
  }

  // Payroll breakdown table
  autoTable(doc, {
    startY: 115,
    head: [['Composant de la paie', 'Montant (' + (data.currency || 'GNF') + ')']],
    body: [
      ['Salaire de base', base.toLocaleString('en-US')],
      ['Allocations (+)', `+ ${allow.toLocaleString('en-US')}`],
      ['Retenues (-)', `- ${ded.toLocaleString('en-US')}`],
      ['Solde net dû', net.toLocaleString('en-US')],
      ['Total décaissé', disbursed.toLocaleString('en-US')],
      ['Solde restant', outstanding.toLocaleString('en-US')],
    ],
    theme: 'striped',
    headStyles: { fillColor: [43, 76, 126] as any },
    bodyStyles: { fontSize: 10 },
    didParseCell: (cellData: any) => {
      if (cellData.row.index === 3) cellData.cell.styles.fontStyle = 'bold';
      if (cellData.row.index === 5 && outstanding > 0) cellData.cell.styles.textColor = [220, 38, 38];
    },
  });

  // QR Code — anchored to bottom-right corner
  try {
    const QRCode = (await import('qrcode')).default;
    const qrContent = `${SCHOOL_CONFIG.name}\nBULLETIN DE PAIE DU PERSONNEL\nRecord: ${data.recordNumber || 'N/A'}\nEmployé: ${data.employeeName}\nPériode: ${data.month} ${data.year}\nSalaire net: ${net.toLocaleString('fr-FR')} ${data.currency || 'GNF'}\nStatut: ${data.status || 'N/A'}`;
    const qrDataUrl = await QRCode.toDataURL(qrContent);
    doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Scannez pour vérifier le bulletin de paie', 155, 286);
  } catch (e) {
    console.error('QR generation failed', e);
  }

  return doc;
}

// ─── GENERATE ATTENDANCE REPORT ───────────────────────────────────────────────
export interface AttendanceReportData {
  studentName: string;
  studentId?: string;
  className?: string;
  period: string;
  records: Array<{ date: string; subject?: string; status: string; sessionTime?: string }>;
  summary: { present: number; absent: number; late: number; excused: number; total: number; presentPercent: number };
}

export function generateAttendanceReport(data: AttendanceReportData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addSchoolHeader(doc, 'Attendance Report');
  const pageW = doc.internal.pageSize.getWidth();

  let y = 52;
  y = addInfoBox(doc, [
    { label: 'Student', value: data.studentName },
    { label: 'Class', value: data.className || '—' },
    { label: 'Period', value: data.period },
    { label: 'Attendance Rate', value: `${data.summary.presentPercent}%` },
  ], y);

  const summaryItems = [
    { label: 'Present', value: data.summary.present, color: COLORS.success },
    { label: 'Absent', value: data.summary.absent, color: COLORS.danger },
    { label: 'Late', value: data.summary.late, color: COLORS.warning },
    { label: 'Excused', value: data.summary.excused, color: COLORS.textMuted },
  ];
  const itemW = (pageW - 40) / 4;
  summaryItems.forEach((item, i) => {
    const x = 15 + i * (itemW + 3);
    doc.setFillColor(...COLORS.secondary);
    doc.roundedRect(x, y, itemW, 16, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...item.color);
    doc.text(String(item.value), x + itemW / 2, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(item.label, x + itemW / 2, y + 15, { align: 'center' });
  });
  y += 24;

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Subject', 'Time', 'Status']],
    body: data.records.map(r => [r.date, r.subject || '—', r.sessionTime || '—', r.status]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white as [number, number, number] },
  });

  addPageFooter(doc);
  return doc;
}

// ─── GENERATE TIMETABLE PDF ───────────────────────────────────────────────────
export interface TimetableData {
  className: string;
  academicYear?: string;
  entries: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacher?: string;
  }>;
}

export function generateTimetable(data: TimetableData): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addSchoolHeader(doc, 'Class Timetable');

  let y = 52;
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const grouped: Record<string, typeof data.entries> = {};
  days.forEach(d => { grouped[d] = []; });
  data.entries.forEach(e => {
    const dayKey = e.day.toUpperCase();
    if (grouped[dayKey]) grouped[dayKey].push(e);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(`Class: ${data.className}${data.academicYear ? ` — ${data.academicYear}` : ''}`, 15, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Day', 'Time', 'Subject', 'Teacher']],
    body: days.flatMap(day =>
      grouped[day].map(e => [day, `${e.startTime} — ${e.endTime}`, e.subject, e.teacher || '—'])
    ),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white as [number, number, number], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
  });

  addPageFooter(doc);
  return doc;
}
