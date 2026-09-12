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

// ─── Currency Formatter for PDF ────────────────────────────────────────────────
/**
 * Formats monetary amounts using dots for thousands and commas for decimals (e.g. 2.150.000,00 GNF).
 * Uses strictly standard ASCII characters to guarantee exact jsPDF text width calculations and prevent font glyph replacement issues.
 */
export function formatCurrencyPDF(amount: number | string | undefined | null, currency: string = 'GNF'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || '0')) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = isNegative ? '-' : '';
  return `${sign}${formattedInt},${decPart} ${currency}`;
}

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
  doc.text('MONTANT PAYÉ / AMOUNT PAID', 20, y + 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(formatCurrencyPDF(data.amount, currency), 20, y + 18);
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

// ─── GENERATE INVOICE PDF ─────────────────────────────────────────────────────
export interface InvoicePDFData {
  invoiceNumber: string;
  studentName: string;
  studentId?: string;
  studentEmail?: string;
  studentPhone?: string;
  className?: string;
  month: string;
  year: number;
  dueDate: string;
  issueDate?: string;
  status: string;
  subtotal: number;
  totalPaid: number;
  remainingBalance: number;
  currency?: string;
  notes?: string;
  items?: Array<{
    description?: string;
    name?: string;
    category?: string;
    amount?: number;
    unitPrice?: number;
    quantity?: number;
  }>;
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any;
  const currency = data.currency || 'GNF';
  const pageW = doc.internal.pageSize.getWidth();

  // Green outer border
  doc.setDrawColor(110, 190, 68);
  doc.setLineWidth(1.5);
  doc.rect(5, 5, 200, 287);

  // Header banner (Royal Blue)
  doc.setFillColor(43, 76, 126);
  doc.rect(5, 5, 200, 45, 'F');

  // Draw school logo
  try {
    doc.addImage(CIRCULAR_LOGO, 'PNG', 15, 12, 30, 30);
  } catch (e) {
    console.error("Failed to add logo to invoice", e);
  }

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(SCHOOL_CONFIG.name, 52, 23);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(200, 220, 245);
  doc.text(`${SCHOOL_CONFIG.subtitle || SCHOOL_CONFIG.address || 'Conakry, Guinée'} — FACTURE SCOLAIRE OFFICIELLE`, 52, 30);
  doc.text(`Contact: ${SCHOOL_CONFIG.contact || 'accounts@2cscomplexes.com'}`, 52, 36);

  doc.setTextColor(255, 255, 255);
  doc.text(`Émise le: ${new Date().toLocaleDateString('fr-FR')}`, 196, 22, { align: 'right' });

  // Main Title
  doc.setTextColor(43, 76, 126);
  doc.setFontSize(20);
  doc.setFont('Helvetica', 'bold');
  doc.text('FACTURE SCOLAIRE', 15, 68);

  // Invoice Details (Left Box)
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Facture N°: ${data.invoiceNumber}`, 15, 78);
  doc.text(`Période: ${data.month} ${data.year}`, 15, 85);
  doc.text(`Date d'échéance: ${new Date(data.dueDate).toLocaleDateString('fr-FR')}`, 15, 92);
  doc.text(`Statut: ${data.status.replace(/_/g, ' ')}`, 15, 99);
  if (data.notes) {
    doc.text(`Notes: ${data.notes}`, 15, 106);
  }

  // Student Profile (Right Box)
  doc.setFont('Helvetica', 'bold');
  doc.text("Profil de l'élève:", 120, 78);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Nom: ${data.studentName}`, 120, 85);
  doc.text(`ID Élève: ${data.studentId || '—'}`, 120, 92);
  if (data.className) doc.text(`Classe: ${data.className}`, 120, 99);
  if (data.studentEmail) doc.text(`Email: ${data.studentEmail}`, 120, 106);

  // Line items table
  const items = Array.isArray(data.items) && data.items.length > 0
    ? data.items
    : [{ description: `Frais Scolaires — ${data.month} ${data.year}`, category: 'Scolarité', amount: data.subtotal }];

  const tableBody = items.map((item: any, idx: number) => [
    String(idx + 1),
    item.description || item.name || `Article ${idx + 1}`,
    item.category || 'Frais',
    formatCurrencyPDF(item.amount !== undefined ? item.amount : data.subtotal, currency)
  ]);

  autoTable(doc, {
    startY: 115,
    margin: { left: 15, right: 15 },
    head: [['#', 'Désignation / Prestation', 'Catégorie', 'Montant Dû']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [43, 76, 126] as any, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      3: { halign: 'right', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  // Financial summary box (Right-aligned inside page margins)
  const summaryBoxW = 90;
  const summaryBoxX = pageW - 15 - summaryBoxW; // 210 - 15 - 90 = 105mm (spans 105mm to 195mm)
  const summaryBoxY = finalY + 8;
  const boxRight = summaryBoxX + summaryBoxW - 5; // 190mm (5mm inset from right edge)
  const labelX = summaryBoxX + 5; // 110mm (5mm inset from left edge)

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxW, 36, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Facturé:', labelX, summaryBoxY + 8);
  doc.text('Total Payé:', labelX, summaryBoxY + 16);
  doc.setFont('Helvetica', 'bold');
  doc.text('Solde Restant Dû:', labelX, summaryBoxY + 26);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyPDF(data.subtotal, currency), boxRight, summaryBoxY + 8, { align: 'right' });
  doc.setTextColor(22, 163, 74);
  doc.text(formatCurrencyPDF(data.totalPaid || 0, currency), boxRight, summaryBoxY + 16, { align: 'right' });

  if (Number(data.remainingBalance || 0) > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.setFontSize(10);
  doc.text(formatCurrencyPDF(data.remainingBalance || 0, currency), boxRight, summaryBoxY + 26, { align: 'right' });

  // Payment instructions
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(43, 76, 126);
  doc.text('MODALITÉS DE RÈGLEMENT & AVIS IMPORTANT', 15, summaryBoxY + 8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('• Les paiements doivent être effectués avant la date d\'échéance.', 15, summaryBoxY + 14);
  doc.text('• Mentionnez le numéro de facture lors de tout virement bancaire.', 15, summaryBoxY + 20);
  doc.text('• Conservez cette facture et vos reçus pour tout contrôle.', 15, summaryBoxY + 26);

  // Official Signature Box
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Signature & Cachet de l\'Établissement', 15, summaryBoxY + 50);
  doc.setDrawColor(203, 213, 225);
  doc.line(15, summaryBoxY + 68, 85, summaryBoxY + 68);

  // Verification QR code in bottom-right corner
  try {
    const QRCode = (await import('qrcode')).default;
    const qrContent = `${SCHOOL_CONFIG.name}\nFACTURE SCOLAIRE\nFacture: ${data.invoiceNumber}\nÉlève: ${data.studentName}\nID: ${data.studentId || 'N/A'}\nMontant: ${formatCurrencyPDF(data.subtotal, currency)}\nPayé: ${formatCurrencyPDF(data.totalPaid || 0, currency)}\nSolde: ${formatCurrencyPDF(data.remainingBalance || 0, currency)}\nStatut: ${data.status}`;
    const qrDataUrl = await QRCode.toDataURL(qrContent);
    doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Scannez pour vérifier la facture', 155, 286);
  } catch (e) {
    console.error('QR generation failed', e);
  }

  return doc;
}

// ─── GENERATE FINANCIAL STATEMENT ─────────────────────────────────────────────
export interface StatementData {
  studentName: string;
  studentId?: string;
  studentEmail?: string;
  studentPhone?: string;
  className?: string;
  period?: string;
  totalCharged: number;
  totalPaid: number;
  totalOutstanding: number;
  currency?: string;
  invoices?: Array<{
    id?: number;
    invoiceNumber: string;
    month: string;
    year: number;
    dueDate: string;
    subtotal: number;
    totalPaid: number;
    remainingBalance: number;
    status: string;
    currency?: string;
    items?: any[];
    createdAt?: string;
  }>;
  payments?: Array<{
    id?: number;
    paymentNumber: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    paymentCategory?: string;
    status: string;
    notes?: string;
    currency?: string;
    originalAmount?: number;
    createdAt?: string;
  }>;
}

export async function generateStatement(data: StatementData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as any;
  const currency = data.currency || 'GNF';
  const pageW = doc.internal.pageSize.getWidth();

  // Green outer border
  doc.setDrawColor(110, 190, 68);
  doc.setLineWidth(1.5);
  doc.rect(5, 5, 200, 287);

  // Header banner (Royal Blue)
  doc.setFillColor(43, 76, 126);
  doc.rect(5, 5, 200, 45, 'F');

  // Draw school logo
  try {
    doc.addImage(CIRCULAR_LOGO, 'PNG', 15, 12, 30, 30);
  } catch (e) {
    console.error("Failed to add logo to statement", e);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(SCHOOL_CONFIG.name, 52, 22);
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(200, 220, 245);
  doc.text(`${SCHOOL_CONFIG.subtitle || SCHOOL_CONFIG.address || 'Conakry, Guinée'} — RELEVÉ DE COMPTE ÉLÈVE`, 52, 30);
  doc.text(`Contact: ${SCHOOL_CONFIG.contact || 'accounts@2cscomplexes.com'}`, 52, 37);

  doc.setTextColor(255, 255, 255);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 196, 22, { align: 'right' });

  // Student info (Left)
  doc.setTextColor(43, 76, 126);
  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.text("Informations sur l'élève", 15, 58);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`Nom: ${data.studentName}`, 15, 66);
  doc.text(`ID Élève: ${data.studentId || '—'}`, 15, 73);
  if (data.className) doc.text(`Classe: ${data.className}`, 15, 80);
  else if (data.studentEmail) doc.text(`Email: ${data.studentEmail}`, 15, 80);

  // Summary box (Right)
  const summaryBoxW = 90;
  const summaryBoxX = pageW - 15 - summaryBoxW; // 210 - 15 - 90 = 105mm
  const summaryBoxY = 54;
  const boxRight = summaryBoxX + summaryBoxW - 5; // 190mm
  const labelX = summaryBoxX + 5; // 110mm

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryBoxX, summaryBoxY, summaryBoxW, 36, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(43, 76, 126);
  doc.text('Résumé du compte financier', labelX, summaryBoxY + 8);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total facturé:', labelX, summaryBoxY + 16);
  doc.text('Total payé:', labelX, summaryBoxY + 23);
  doc.setFont('Helvetica', 'bold');
  doc.text('Solde restant:', labelX, summaryBoxY + 31);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyPDF(data.totalCharged || 0, currency), boxRight, summaryBoxY + 16, { align: 'right' });
  doc.setTextColor(22, 163, 74);
  doc.text(formatCurrencyPDF(data.totalPaid || 0, currency), boxRight, summaryBoxY + 23, { align: 'right' });

  if (Number(data.totalOutstanding || 0) > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }
  doc.setFontSize(10);
  doc.text(formatCurrencyPDF(data.totalOutstanding || 0, currency), boxRight, summaryBoxY + 31, { align: 'right' });

  // Build Chronological Ledger Activities
  const activities: any[] = [];

  (data.invoices || []).forEach((inv: any) => {
    const cats = Array.isArray(inv.items) && inv.items.length
      ? [...new Set(inv.items.map((it: any) => it.category || 'Frais'))].join(', ')
      : 'Scolarité';
    activities.push({
      date: inv.createdAt || inv.dueDate || new Date().toISOString(),
      ref: inv.invoiceNumber,
      type: 'FACTURE',
      description: `Facture — ${cats} (${inv.month} ${inv.year})`,
      billed: Number(inv.subtotal || 0),
      paid: 0
    });
  });

  (data.payments || []).forEach((pay: any) => {
    activities.push({
      date: pay.paymentDate || pay.createdAt || new Date().toISOString(),
      ref: pay.paymentNumber,
      type: 'PAIEMENT',
      description: `${pay.paymentCategory || 'Frais'} — ${pay.paymentMethod || 'Espèces'}`,
      billed: 0,
      paid: Number(pay.amount || 0)
    });
  });

  activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentBal = 0;
  const ledgerRows = activities.map((act) => {
    if (act.type === 'FACTURE') {
      currentBal += act.billed;
    } else {
      currentBal -= act.paid;
    }
    return [
      new Date(act.date).toLocaleDateString('fr-FR'),
      act.ref,
      act.type,
      act.description,
      act.billed > 0 ? formatCurrencyPDF(act.billed, currency) : '—',
      act.paid > 0 ? formatCurrencyPDF(act.paid, currency) : '—',
      formatCurrencyPDF(currentBal, currency)
    ];
  });

  doc.setFontSize(11);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(43, 76, 126);
  doc.text('Grand livre des activités du compte (Chronologique)', 15, 96);

  autoTable(doc, {
    startY: 100,
    margin: { left: 15, right: 15 },
    head: [['Date', 'Référence #', 'Type', 'Description', 'Facturé (Dr)', 'Payé (Cr)', 'Solde']],
    body: ledgerRows.length > 0 ? ledgerRows : [['—', '—', '—', 'Aucune transaction enregistrée', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: [43, 76, 126], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Add QR code — always anchored to bottom-right corner of the page
  try {
    const QRCode = (await import('qrcode')).default;
    const qrContent = `${SCHOOL_CONFIG.name}\nRELEVÉ DE COMPTE\nÉlève: ${data.studentName}\nID: ${data.studentId || 'N/A'}\nTotal Facturé: ${formatCurrencyPDF(data.totalCharged || 0, currency)}\nTotal Payé: ${formatCurrencyPDF(data.totalPaid || 0, currency)}\nSolde Restant: ${formatCurrencyPDF(data.totalOutstanding || 0, currency)}`;
    const qrDataUrl = await QRCode.toDataURL(qrContent);
    doc.addImage(qrDataUrl, 'PNG', 155, 242, 42, 42);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Scannez pour vérifier le relevé', 155, 286);
  } catch (e) {
    console.error('QR generation failed', e);
  }

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
      ['Salaire de base', formatCurrencyPDF(base, data.currency || 'GNF')],
      ['Allocations (+)', `+ ${formatCurrencyPDF(allow, data.currency || 'GNF')}`],
      ['Retenues (-)', `- ${formatCurrencyPDF(ded, data.currency || 'GNF')}`],
      ['Solde net dû', formatCurrencyPDF(net, data.currency || 'GNF')],
      ['Total décaissé', formatCurrencyPDF(disbursed, data.currency || 'GNF')],
      ['Solde restant', formatCurrencyPDF(outstanding, data.currency || 'GNF')],
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
    const qrContent = `${SCHOOL_CONFIG.name}\nBULLETIN DE PAIE DU PERSONNEL\nRecord: ${data.recordNumber || 'N/A'}\nEmployé: ${data.employeeName}\nPériode: ${data.month} ${data.year}\nSalaire net: ${formatCurrencyPDF(net, data.currency || 'GNF')}\nStatut: ${data.status || 'N/A'}`;
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
  semester?: string;
  institutionName?: string;
  entries: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    subjectCode?: string;
    teacher?: string;
    room?: string;
    lessonType?: string;
  }>;
}

export function generateTimetable(data: TimetableData): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  addSchoolHeader(doc, data.className.toLowerCase().includes('enseignant') || data.className.toLowerCase().includes('teacher') ? 'Emploi du Temps Enseignant' : 'Emploi du Temps Scolaire');

  let y = 50;
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayLabelsFr: Record<string, string> = {
    MONDAY: 'LUNDI',
    TUESDAY: 'MARDI',
    WEDNESDAY: 'MERCREDI',
    THURSDAY: 'JEUDI',
    FRIDAY: 'VENDREDI',
    SATURDAY: 'SAMEDI',
  };

  const grouped: Record<string, typeof data.entries> = {};
  days.forEach(d => { grouped[d] = []; });
  data.entries.forEach(e => {
    const dayKey = e.day.toUpperCase();
    if (grouped[dayKey]) grouped[dayKey].push(e);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  const subTitle = `${data.className}${data.academicYear ? ` — Année : ${data.academicYear}` : ''}${data.semester ? ` — ${data.semester}` : ''}`;
  doc.text(subTitle, 15, y);
  y += 8;

  const tableRows: any[] = [];
  days.forEach(day => {
    const dayEntries = grouped[day] || [];
    if (dayEntries.length > 0) {
      dayEntries.sort((a, b) => a.startTime.localeCompare(b.startTime)).forEach(e => {
        tableRows.push([
          dayLabelsFr[day] || day,
          `${e.startTime?.substring(0,5)} — ${e.endTime?.substring(0,5)}`,
          e.subject || '—',
          e.teacher || '—',
          e.room || '—',
          e.lessonType || 'Standard'
        ]);
      });
    }
  });

  autoTable(doc, {
    startY: y,
    head: [['Jour', 'Créneau Horaire', 'Matière / Discipline', 'Enseignant Responsable', 'Salle / Lieu', 'Type']],
    body: tableRows.length > 0 ? tableRows : [['—', '—', 'Aucun cours programmé', '—', '—', '—']],
    styles: { fontSize: 8.5, cellPadding: 3.5, halign: 'left' },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white as [number, number, number], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 35 },
      2: { fontStyle: 'bold' },
    },
    didDrawPage: (hookData) => {
      // Add signature block at bottom
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Le Directeur des Études / Administration Scolaire', 210, pageHeight - 15);
      doc.setDrawColor(203, 213, 225);
      doc.line(205, pageHeight - 10, 280, pageHeight - 10);
    }
  });

  addPageFooter(doc);
  return doc;
}

