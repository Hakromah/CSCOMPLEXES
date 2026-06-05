import crypto from 'crypto';

export default () => ({
  // ─── Immutable Audit Logging Helper ────────────────────────────────────────
  async logAction(actionType: string, entityName: string, entityId: number | string, userId: number, prev: any, current: any, notes = '') {
    try {
      await (strapi.entityService.create as any)('api::accounting-log.accounting-log' as any, {
        data: {
          actionType,
          entityName,
          entityId: String(entityId),
          performedBy: userId,
          previousValues: prev ? JSON.parse(JSON.stringify(prev)) : null,
          newValues: current ? JSON.parse(JSON.stringify(current)) : null,
          timestamp: new Date().toISOString(),
          notes
        }
      });
    } catch (e) {
      console.error('Audit logger failed:', e);
    }
  },

  async syncInvoiceBalances(invoiceId: number) {
    const invoice = await (strapi.entityService.findOne as any)('api::student-invoice.student-invoice' as any, invoiceId) as any;
    if (!invoice) return;

    const allPayments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
      filters: { invoice: { id: invoiceId }, status: 'APPROVED' }
    }) as any[];

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const remainingBalance = Math.max(0, Number(invoice.subtotal || 0) - totalPaid);

    // Determine new status — only transition statuses that support auto-progression
    let invoiceStatus = invoice.status;
    if (invoiceStatus === 'APPROVED' || invoiceStatus === 'PAID' || invoiceStatus === 'PARTIALLY_PAID') {
      // Auto-progress approved invoices based on payment totals
      if (remainingBalance === 0 && totalPaid > 0) {
        invoiceStatus = 'PAID';
      } else if (totalPaid > 0) {
        invoiceStatus = 'PARTIALLY_PAID';
      } else {
        invoiceStatus = 'APPROVED';
      }
    }
    // DRAFT, SUBMITTED, REJECTED keep their status — only balances update

    await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, invoiceId, {
      data: {
        totalPaid,
        remainingBalance,
        status: invoiceStatus
      }
    });
  },

  async syncSalaryRecordStatus(salId: number) {
    const record = await (strapi.entityService.findOne as any)('api::salary-record.salary-record' as any, salId) as any;
    if (!record) return;

    const allPayments = await (strapi.entityService.findMany as any)('api::salary-payment.salary-payment' as any, {
      filters: { salaryRecord: { id: salId }, status: 'APPROVED' }
    }) as any[];

    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    let recordStatus = record.status;
    // Only auto-transition APPROVED / PAID / PARTIALLY_PAID records based on payment totals.
    // SUBMITTED must NOT be auto-transitioned — only an explicit AccountLead/Admin approve action
    // should move a record from SUBMITTED → APPROVED.
    // DRAFT and REJECTED are never touched here either.
    if (recordStatus === 'APPROVED' || recordStatus === 'PAID' || recordStatus === 'PARTIALLY_PAID') {
      if (totalPaid >= Number(record.netSalary || 0) && totalPaid > 0) {
        recordStatus = 'PAID';
      } else if (totalPaid > 0) {
        recordStatus = 'PARTIALLY_PAID';
      } else {
        // All payments were deleted — reset back to APPROVED (awaiting payout)
        recordStatus = 'APPROVED';
      }
    }
    // DRAFT, SUBMITTED, REJECTED — keep their status unchanged

    await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, salId, {
      data: { status: recordStatus }
    });
  },


  // ─── Dashboard Stats & Analytics ───────────────────────────────────────────
  async getStats(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const [invoices, payments, salaryRecords, salaryPayments, students] = await Promise.all([
      (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
        filters: { status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] } },
        populate: ['student']
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        filters: { status: 'APPROVED' }
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::salary-record.salary-record' as any, {
        filters: { status: { $in: ['APPROVED', 'PAID', 'PARTIALLY_PAID'] } }
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('api::salary-payment.salary-payment' as any, {
        filters: { status: 'APPROVED' }
      }) as Promise<any[]>,
      (strapi.entityService.findMany as any)('plugin::users-permissions.user' as any, {
        filters: { schoolRole: 'STUDENT' }
      }) as Promise<any[]>
    ]);

    const totalStudents = students.length;

    // ── All-time invoice totals ────────────────────────────────────────────────
    let totalInvoiced = 0;
    let outstandingDebt = 0;
    const billedStudents = new Set<number>();
    const paidStudents = new Set<number>();

    invoices.forEach(inv => {
      totalInvoiced += Number(inv.subtotal || 0);
      outstandingDebt += Number(inv.remainingBalance || 0);
      if (inv.student?.id) {
        billedStudents.add(inv.student.id);
        if (inv.status === 'PAID') paidStudents.add(inv.student.id);
      }
    });

    // ── Year-filtered payments ────────────────────────────────────────────────
    const yearPayments = payments.filter(p => {
      const d = new Date(p.paymentDate || p.createdAt || new Date());
      return d.getFullYear() === targetYear;
    });

    const yearSalaryPayments = salaryPayments.filter((p: any) => {
      const d = new Date(p.paymentDate || p.createdAt || new Date());
      return d.getFullYear() === targetYear;
    });

    // Annual category breakdown for the selected year
    let tuitionRevenue = 0;
    let transportationRevenue = 0;
    let tshirtRevenue = 0;
    let registrationRevenue = 0;
    let otherRevenue = 0;

    yearPayments.forEach(p => {
      const amt = Number(p.amount || 0);
      if (p.paymentCategory === 'TUITION') tuitionRevenue += amt;
      else if (p.paymentCategory === 'TRANSPORT') transportationRevenue += amt;
      else if (p.paymentCategory === 'TSHIRT') tshirtRevenue += amt;
      else if (p.paymentCategory === 'REGISTRATION') registrationRevenue += amt;
      else otherRevenue += amt;
    });

    const totalRevenue = yearPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const salaryExpenses = yearSalaryPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    // ── Monthly breakdown (12 months of targetYear) ────────────────────────────
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRevenue: number[] = new Array(12).fill(0);
    const monthlyDebt: number[] = new Array(12).fill(0);
    const monthlyCategories = Array.from({ length: 12 }, () => ({
      tuition: 0, transport: 0, tshirt: 0, registration: 0, other: 0, salary: 0
    }));

    yearPayments.forEach(p => {
      const date = new Date(p.paymentDate || p.createdAt || new Date());
      const mi = date.getMonth();
      const amt = Number(p.amount || 0);
      monthlyRevenue[mi] += amt;
      if (p.paymentCategory === 'TUITION') monthlyCategories[mi].tuition += amt;
      else if (p.paymentCategory === 'TRANSPORT') monthlyCategories[mi].transport += amt;
      else if (p.paymentCategory === 'TSHIRT') monthlyCategories[mi].tshirt += amt;
      else if (p.paymentCategory === 'REGISTRATION') monthlyCategories[mi].registration += amt;
      else monthlyCategories[mi].other += amt;
    });

    yearSalaryPayments.forEach((p: any) => {
      const date = new Date(p.paymentDate || p.createdAt || new Date());
      const mi = date.getMonth();
      monthlyCategories[mi].salary += Number(p.amount || 0);
    });

    invoices.forEach(inv => {
      const date = new Date(inv.createdAt || new Date());
      if (date.getFullYear() === targetYear) {
        monthlyDebt[date.getMonth()] += Number(inv.remainingBalance || 0);
      }
    });

    const yearlyTrends = monthNames.map((month, i) => ({
      month,
      revenue: Math.round(monthlyRevenue[i]),
      debt: Math.round(monthlyDebt[i]),
      tuition: Math.round(monthlyCategories[i].tuition),
      transport: Math.round(monthlyCategories[i].transport),
      tshirt: Math.round(monthlyCategories[i].tshirt),
      registration: Math.round(monthlyCategories[i].registration),
      other: Math.round(monthlyCategories[i].other),
      salary: Math.round(monthlyCategories[i].salary),
    }));

    return {
      totalStudents,
      billedStudents: billedStudents.size,
      paidStudents: paidStudents.size,
      debtorStudents: billedStudents.size - paidStudents.size,
      monthlyRevenue: totalRevenue,
      tuitionRevenue,
      transportationRevenue,
      tshirtRevenue,
      registrationRevenue,
      otherRevenue,
      salaryExpenses,
      outstandingDebt,
      yearlyTrends
    };
  },

  // ─── Global Recalculation Engine ──────────────────────────────────────────
  async recalculateSystem(userId: number) {
    const invoices = await (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
      populate: ['student']
    }) as any[];

    let correctedCount = 0;

    for (const inv of invoices) {
      // Find all APPROVED payments for this invoice
      const payments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        filters: { invoice: inv.id, status: 'APPROVED' }
      }) as any[];

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const remainingBalance = Math.max(0, Number(inv.subtotal || 0) - totalPaid);

      let status = inv.status;
      if (inv.status !== 'SUBMITTED' && inv.status !== 'REJECTED') {
        if (remainingBalance === 0) {
          status = 'PAID';
        } else if (totalPaid > 0) {
          status = 'PARTIALLY_PAID';
        } else {
          status = 'APPROVED';
        }
      }

      if (
        inv.totalPaid !== totalPaid ||
        inv.remainingBalance !== remainingBalance ||
        inv.status !== status
      ) {
        const prev = { totalPaid: inv.totalPaid, remainingBalance: inv.remainingBalance, status: inv.status };
        const updated = await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, inv.id, {
          data: { totalPaid, remainingBalance, status }
        });
        correctedCount++;

        await this.logAction(
          'RECALCULATE_INVOICE',
          'student-invoice',
          inv.id,
          userId,
          prev,
          updated,
          'Recalculation engine auto-repair'
        );
      }
    }

    // Now recalculate salary record payments
    const salaryRecords = await (strapi.entityService.findMany as any)('api::salary-record.salary-record' as any) as any[];
    for (const sal of salaryRecords) {
      const payments = await (strapi.entityService.findMany as any)('api::salary-payment.salary-payment' as any, {
        filters: { salaryRecord: sal.id, status: 'APPROVED' }
      }) as any[];

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      let status = sal.status;
      if (sal.status !== 'SUBMITTED' && sal.status !== 'REJECTED') {
        if (totalPaid >= Number(sal.netSalary || 0)) {
          status = 'PAID';
        } else if (totalPaid > 0) {
          status = 'PARTIALLY_PAID';
        } else {
          status = 'APPROVED';
        }
      }

      if (sal.status !== status) {
        const prev = { status: sal.status };
        const updated = await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, sal.id, {
          data: { status }
        });
        correctedCount++;

        await this.logAction(
          'RECALCULATE_SALARY',
          'salary-record',
          sal.id,
          userId,
          prev,
          updated,
          'Recalculation engine salary auto-repair'
        );
      }
    }

    return {
      success: true,
      correctedRecords: correctedCount,
      timestamp: new Date().toISOString()
    };
  },

  async getAuditLogs() {
    return (strapi.entityService.findMany as any)('api::accounting-log.accounting-log' as any, {
      populate: ['performedBy'],
      sort: [{ timestamp: 'desc' }]
    });
  },

  // ─── Student Invoicing ─────────────────────────────────────────────────────
  async createInvoice(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const invoiceNumber = `INV-${dto.year}${String(dto.month).toUpperCase().substring(0, 3)}-${timestamp}`;

    let subtotal = 0;
    dto.items.forEach((item: any) => {
      subtotal += Number(item.amount || 0);
    });

    const invoice = await (strapi.entityService.create as any)('api::student-invoice.student-invoice' as any, {
      data: {
        invoiceNumber,
        student: dto.studentId,
        month: dto.month,
        year: dto.year,
        dueDate: dto.dueDate,
        status: 'DRAFT',
        notes: dto.notes,
        items: dto.items,
        subtotal,
        totalPaid: 0,
        remainingBalance: subtotal,
        submittedBy: userId,
        currency: 'GNF'
      },
      populate: ['student']
    }) as any;

    await this.logAction(
      'CREATE_INVOICE',
      'student-invoice',
      invoice.id,
      userId,
      null,
      invoice,
      `Created invoice ${invoiceNumber}`
    );

    return invoice;
  },

  async approveInvoice(id: number, userId: number) {
    const invoice = await (strapi.entityService.findOne as any)('api::student-invoice.student-invoice' as any, id) as any;
    if (!invoice) throw new Error('Invoice not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED status directly
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(invoice.status)) {
      throw new Error(`Cannot approve an invoice with status ${invoice.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['student']
    }) as any;

    await this.logAction(
      'APPROVE_INVOICE',
      'student-invoice',
      id,
      userId,
      invoice,
      updated,
      'Approved student billing invoice'
    );

    return updated;
  },

  async rejectInvoice(id: number, reason: string, userId: number) {
    const invoice = await (strapi.entityService.findOne as any)('api::student-invoice.student-invoice' as any, id) as any;
    if (!invoice) throw new Error('Invoice not found');
    // ACCOUNTLEAD can reject from DRAFT or SUBMITTED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(invoice.status)) {
      throw new Error(`Cannot reject an invoice with status ${invoice.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::student-invoice.student-invoice' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['student']
    }) as any;

    await this.logAction(
      'REJECT_INVOICE',
      'student-invoice',
      id,
      userId,
      invoice,
      updated,
      `Rejected invoice: ${reason}`
    );

    return updated;
  },

  // ─── Student Payment Collection ────────────────────────────────────────────
  async createPayment(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const paymentNumber = `PAY-${dto.paymentCategory.toUpperCase().substring(0, 3)}-${timestamp}`;

    const payment = await (strapi.entityService.create as any)('api::student-payment.student-payment' as any, {
      data: {
        paymentNumber,
        invoice: dto.invoiceId,
        student: dto.studentId,
        amount: Number(dto.amount),
        paymentDate: dto.paymentDate || new Date().toISOString(),
        paymentMethod: dto.paymentMethod,
        paymentCategory: dto.paymentCategory,
        status: 'DRAFT',
        notes: dto.notes,
        receivedBy: userId
      },
      populate: ['invoice', 'student']
    }) as any;

    await this.logAction(
      'RECEIVE_PAYMENT',
      'student-payment',
      payment.id,
      userId,
      null,
      payment,
      `Logged payment collection request ${paymentNumber}`
    );

    return payment;
  },

  async approvePayment(id: number, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::student-payment.student-payment' as any, id, {
      populate: ['invoice', 'student']
    }) as any;
    if (!payment) throw new Error('Payment record not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(payment.status)) {
      throw new Error(`Cannot approve a payment with status ${payment.status}`);
    }

    // 1. Approve the payment
    const approvedPayment = await (strapi.entityService.update as any)('api::student-payment.student-payment' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['invoice', 'student']
    }) as any;

    // 2. Generate downloadable receipt record with QR verification signature
    const invoiceNumber = payment.invoice?.invoiceNumber || 'N/A';
    const studentName = payment.student?.username || payment.student?.name || 'Student';
    const studentUserId = payment.student?.userId || 'N/A';
    const qrSignature = crypto.createHash('sha256').update(`${approvedPayment.paymentNumber}-${approvedPayment.amount}`).digest('hex').slice(0, 20).toUpperCase();
    const receiptNumber = `REC-${approvedPayment.paymentNumber.split('-')[2] || 'GEN'}-${Date.now().toString().slice(-4)}`;
    // QR code contains human-readable data: invoice number, student name, student userId
    const qrContent = `AMFOFANA ACADEMY\nReceipt: ${receiptNumber}\nInvoice: ${invoiceNumber}\nStudent: ${studentName}\nID: ${studentUserId}\nAmount: ${Number(approvedPayment.amount).toLocaleString()} GNF\nVerify: https://verify.amfofana.edu/receipt/${qrSignature}`;
    
    await (strapi.entityService.create as any)('api::receipt.receipt' as any, {
      data: {
        receiptNumber,
        paymentType: 'STUDENT_PAYMENT',
        studentPayment: approvedPayment.id,
        generatedDate: new Date().toISOString(),
        qrCode: qrContent
      }
    });

    // 3. Recalculate related Invoice balances & status
    const invoiceId = payment.invoice?.id;
    if (invoiceId) {
      await this.syncInvoiceBalances(invoiceId);
    }

    await this.logAction(
      'APPROVE_PAYMENT',
      'student-payment',
      id,
      userId,
      payment,
      approvedPayment,
      'Approved student payment & compiled PDF receipt details'
    );

    return approvedPayment;
  },

  async rejectPayment(id: number, reason: string, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::student-payment.student-payment' as any, id, { populate: ['invoice'] }) as any;
    if (!payment) throw new Error('Payment not found');
    // ACCOUNTLEAD can reject from DRAFT, SUBMITTED, or APPROVED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(payment.status)) {
      throw new Error(`Cannot reject a payment with status ${payment.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::student-payment.student-payment' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['invoice', 'student']
    }) as any;

    if (payment.invoice?.id) {
      await this.syncInvoiceBalances(payment.invoice.id);
    }

    await this.logAction(
      'REJECT_PAYMENT',
      'student-payment',
      id,
      userId,
      payment,
      updated,
      `Rejected payment collection: ${reason}`
    );

    return updated;
  },

  // ─── Student Statement Compilations ────────────────────────────────────────
  async getStudentStatement(studentId: number) {
    const [student, invoices] = await Promise.all([
      (strapi.entityService.findOne as any)('plugin::users-permissions.user' as any, studentId, {
        populate: ['role']
      }) as any,
      (strapi.entityService.findMany as any)('api::student-invoice.student-invoice' as any, {
        filters: { student: { id: studentId } },
        sort: [{ year: 'desc' }, { month: 'desc' }]
      }) as any[]
    ]);

    if (!student) throw new Error('Student not found');

    // Step 2: collect all payments for those invoices (by invoice ID) + direct student payments
    const invoiceIds = invoices.map((inv: any) => inv.id);

    let payments: any[] = [];

    // Fetch payments linked directly to the student
    const directPayments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
      filters: { student: { id: studentId }, status: 'APPROVED' },
      sort: [{ paymentDate: 'desc' }]
    }) as any[];

    payments = [...directPayments];

    // Also fetch payments linked to this student's invoices (that might not have direct student link)
    if (invoiceIds.length > 0) {
      const invoicePayments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment' as any, {
        filters: { invoice: { id: { $in: invoiceIds } }, status: 'APPROVED' },
        sort: [{ paymentDate: 'desc' }]
      }) as any[];

      // Merge, deduplicate by ID
      const existingIds = new Set(payments.map((p: any) => p.id));
      for (const p of invoicePayments) {
        if (!existingIds.has(p.id)) {
          payments.push(p);
          existingIds.add(p.id);
        }
      }
    }

    // Sort merged payments by paymentDate desc
    payments.sort((a: any, b: any) => new Date(b.paymentDate || b.createdAt).getTime() - new Date(a.paymentDate || a.createdAt).getTime());

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const outstandingBalance = Math.max(0, totalInvoiced - totalPaid);

    return {
      studentProfile: {
        id: student.id,
        userId: student.userId,
        name: student.username || student.name,
        email: student.email,
        phone: student.phoneNumber
      },
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      invoices,
      payments
    };
  },


  // ─── Staff Payroll & Salaries ──────────────────────────────────────────────
  async createSalaryRecord(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const recordNumber = `SAL-${dto.year}${String(dto.month).toUpperCase().substring(0, 3)}-${timestamp}`;
    const baseSalary = Number(dto.baseSalary || 0);
    const allowances = Number(dto.allowances || 0);
    const deductions = Number(dto.deductions || 0);
    const netSalary = baseSalary + allowances - deductions;

    const record = await (strapi.entityService.create as any)('api::salary-record.salary-record' as any, {
      data: {
        recordNumber,
        staff: dto.staffId,
        month: dto.month,
        year: dto.year,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: 'DRAFT',
        notes: dto.notes,
        submittedBy: userId
      },
      populate: ['staff']
    }) as any;

    await this.logAction(
      'CREATE_SALARY_RECORD',
      'salary-record',
      record.id,
      userId,
      null,
      record,
      `Compiled salary payroll record ${recordNumber}`
    );

    return record;
  },

  async approveSalaryRecord(id: number, userId: number) {
    const record = await (strapi.entityService.findOne as any)('api::salary-record.salary-record' as any, id) as any;
    if (!record) throw new Error('Salary record not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(record.status)) {
      throw new Error(`Cannot approve a salary record with status ${record.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['staff']
    }) as any;

    await this.logAction(
      'APPROVE_SALARY_RECORD',
      'salary-record',
      id,
      userId,
      record,
      updated,
      'Approved staff salary payroll statement'
    );

    return updated;
  },

  async rejectSalaryRecord(id: number, reason: string, userId: number) {
    const record = await (strapi.entityService.findOne as any)('api::salary-record.salary-record' as any, id) as any;
    if (!record) throw new Error('Salary record not found');
    // ACCOUNTLEAD can reject from DRAFT, SUBMITTED, or APPROVED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(record.status)) {
      throw new Error(`Cannot reject a salary record with status ${record.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::salary-record.salary-record' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['staff']
    }) as any;

    await this.logAction(
      'REJECT_SALARY_RECORD',
      'salary-record',
      id,
      userId,
      record,
      updated,
      `Rejected payroll salary record: ${reason}`
    );

    return updated;
  },

  // ─── Salary Payout Disbursements ───────────────────────────────────────────
  async createSalaryPayment(dto: any, userId: number) {
    const timestamp = Date.now().toString().slice(-4);
    const paymentNumber = `PAY-SAL-${timestamp}`;

    const payment = await (strapi.entityService.create as any)('api::salary-payment.salary-payment' as any, {
      data: {
        paymentNumber,
        salaryRecord: dto.salaryRecordId,
        staff: dto.staffId,
        amount: Number(dto.amount),
        paymentDate: dto.paymentDate || new Date().toISOString(),
        paymentMethod: dto.paymentMethod,
        status: 'DRAFT',
        notes: dto.notes,
        paidBy: userId
      },
      populate: ['salaryRecord', 'staff']
    }) as any;

    await this.logAction(
      'DISBURSE_SALARY',
      'salary-payment',
      payment.id,
      userId,
      null,
      payment,
      `Disbursed salary payment collection ${paymentNumber}`
    );

    return payment;
  },

  async approveSalaryPayment(id: number, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::salary-payment.salary-payment' as any, id, {
      populate: ['salaryRecord', 'staff']
    }) as any;
    if (!payment) throw new Error('Salary payment not found');
    // ACCOUNTLEAD can approve from DRAFT or SUBMITTED
    const approvableStatuses = ['DRAFT', 'SUBMITTED', 'REJECTED'];
    if (!approvableStatuses.includes(payment.status)) {
      throw new Error(`Cannot approve a salary payment with status ${payment.status}`);
    }

    // 1. Approve
    const approvedPayment = await (strapi.entityService.update as any)('api::salary-payment.salary-payment' as any, id, {
      data: {
        status: 'APPROVED',
        approvedBy: userId
      },
      populate: ['salaryRecord', 'staff']
    }) as any;

    // 2. Generate downloadable receipt record with QR verification signature
    const qrSignature = crypto.createHash('sha256').update(`${approvedPayment.paymentNumber}-${approvedPayment.amount}`).digest('hex').slice(0, 20).toUpperCase();
    const receiptNumber = `REC-SAL-${approvedPayment.paymentNumber.split('-')[2] || 'GEN'}-${Date.now().toString().slice(-4)}`;
    
    await (strapi.entityService.create as any)('api::receipt.receipt' as any, {
      data: {
        receiptNumber,
        paymentType: 'SALARY_PAYMENT',
        salaryPayment: approvedPayment.id,
        generatedDate: new Date().toISOString(),
        qrCode: `https://verify.amfofana.edu/receipt/${qrSignature}`
      }
    });

    // 3. Recalculate salary status
    const salaryRecordId = payment.salaryRecord?.id;
    if (salaryRecordId) {
      await this.syncSalaryRecordStatus(salaryRecordId);
    }

    await this.logAction(
      'APPROVE_SALARY_PAYMENT',
      'salary-payment',
      id,
      userId,
      payment,
      approvedPayment,
      'Approved salary payment & generated receipt'
    );

    return approvedPayment;
  },

  async rejectSalaryPayment(id: number, reason: string, userId: number) {
    const payment = await (strapi.entityService.findOne as any)('api::salary-payment.salary-payment' as any, id, { populate: ['salaryRecord'] }) as any;
    if (!payment) throw new Error('Salary payment not found');
    // ACCOUNTLEAD can reject from DRAFT, SUBMITTED, or APPROVED
    const rejectableStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED'];
    if (!rejectableStatuses.includes(payment.status)) {
      throw new Error(`Cannot reject a salary payment with status ${payment.status}`);
    }

    const updated = await (strapi.entityService.update as any)('api::salary-payment.salary-payment' as any, id, {
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId
      },
      populate: ['salaryRecord', 'staff']
    }) as any;

    if (payment.salaryRecord?.id) {
      await this.syncSalaryRecordStatus(payment.salaryRecord.id);
    }

    await this.logAction(
      'REJECT_SALARY_PAYMENT',
      'salary-payment',
      id,
      userId,
      payment,
      updated,
      `Rejected salary disbursement: ${reason}`
    );

    return updated;
  }
});
