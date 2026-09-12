/**
 * school-student controller
 */

export default {
  async getProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getStudentProfile(user.email);
  },

  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').updateProfile(
      user.email, ctx.request.body
    );
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-student.school-student').changePassword(
      user.email,
      ctx.request.body.currentPassword,
      ctx.request.body.newPassword,
    );
    ctx.body = { message: 'Security credentials updated' };
  },

  async getMyClasses(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getClassesByStudent(user.id);
  },

  async getMyAttendance(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getAttendanceByStudent(user.id);
  },

  async getMyTimetable(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getStudentTimetable(user.id);
  },

  async getMyExams(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getExamsForStudent(user.id);
  },

  async getMyResults(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getResultsByStudent(user.id);
  },

  async getSemesterTranscript(ctx: any) {
    const user = ctx.state.user;
    const { semester } = ctx.query;
    ctx.body = await strapi.service('api::school-student.school-student').getSemesterTranscript(
      user.id, semester as string
    );
  },

  async getDashboardStats(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-student.school-student').getDashboardStats(user.id);
  },

  async getMaterialsByClass(ctx: any) {
    const user = ctx.state.user;
    const classId = Number(ctx.params.classId);
    ctx.body = await strapi.service('api::school-student.school-student').getMaterialsByClass(user.id, classId);
  },

  async previewTranscript(ctx: any) {
    const user = ctx.state.user;
    const { id } = ctx.params;
    
    // Fetch the transcript record to verify ownership
    const transcript = await strapi.entityService.findOne('api::transcript.transcript' as any, id, {
      populate: ['student', 'academicYear', 'class', 'semesters', 'terms']
    }) as any;

    if (!transcript) {
      return ctx.notFound('Transcript not found');
    }

    if (transcript.student?.id !== user.id) {
      return ctx.forbidden('You are not authorized to view this transcript');
    }

    // Call the getStudentTranscript service to load details dynamically
    const filters = {
      academicYearId: transcript.academicYear?.id || undefined,
      classId: transcript.class?.id || undefined,
      semesterIds: transcript.semesters?.map((s: any) => s.id) || [],
      termIds: transcript.terms?.map((t: any) => t.id) || []
    };

    ctx.body = await strapi.service('api::school-admin.school-admin').getStudentTranscript(user.id, filters);
  },

  async getStudentTranscriptsList(ctx: any) {
    const user = ctx.state.user;
    const list = await strapi.entityService.findMany('api::transcript.transcript' as any, {
      filters: { student: { id: user.id } },
      populate: ['academicYear', 'class', 'semesters', 'terms']
    });
    ctx.body = list;
  },

  async getMyInvoices(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const invoices = await (strapi.entityService.findMany as any)('api::student-invoice.student-invoice', {
        filters: { student: { id: user.id } },
        sort: [{ dueDate: 'desc' }],
      });
      ctx.body = invoices || [];
    } catch (err: any) {
      strapi.log.error('getMyInvoices error:', err);
      ctx.body = [];
    }
  },

  async getMyBalance(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const invoices = await (strapi.entityService.findMany as any)('api::student-invoice.student-invoice', {
        filters: { student: { id: user.id } },
      }) as any[];
      
      const totalCharged = (invoices || []).reduce((sum: number, inv: any) => sum + Number(inv.subtotal || 0), 0);
      const totalPaid = (invoices || []).reduce((sum: number, inv: any) => sum + Number(inv.totalPaid || 0), 0);
      const outstandingBalance = Math.max(0, totalCharged - totalPaid);
      ctx.body = { totalCharged, totalPaid, outstandingBalance, currency: invoices?.[0]?.currency || 'GNF' };
    } catch (err: any) {
      strapi.log.error('getMyBalance error:', err);
      ctx.body = { totalCharged: 0, totalPaid: 0, outstandingBalance: 0, currency: 'GNF' };
    }
  },

  async getMyTransport(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const assignments = await (strapi.entityService.findMany as any)('api::transport-assignment.transport-assignment', {
        filters: { student: { id: user.id }, isActive: true },
        populate: ['driver'],
      });
      ctx.body = assignments?.[0] || null;
    } catch (err: any) {
      ctx.body = null;
    }
  },

  async getMyEvents(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const classes = await (strapi.entityService.findMany as any)('api::school-class.school-class', {
        filters: { students: { id: user.id } },
      }) as any[];
      const classIds = (classes || []).map((c: any) => c.id).filter(Boolean);

      const audienceFilters: any[] = [
        { targetAudience: 'ALL' },
        { targetAudience: 'STUDENTS' },
      ];

      if (classIds.length > 0) {
        audienceFilters.push({
          $and: [
            { targetAudience: 'CLASS' },
            { targetClass: { id: { $in: classIds } } }
          ]
        });
      }

      const events = await (strapi.entityService.findMany as any)('api::school-event.school-event', {
        filters: {
          $or: audienceFilters,
          isPublished: true,
        },
        sort: [{ startDate: 'asc' }],
      });
      ctx.body = events || [];
    } catch (err: any) {
      strapi.log.error('getMyEvents error:', err);
      ctx.body = [];
    }
  },

  async getMyNotifications(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const notifications = await (strapi.entityService.findMany as any)('api::school-notification.school-notification', {
        filters: { recipient: { id: user.id } },
        sort: [{ createdAt: 'desc' }],
      });
      ctx.body = notifications || [];
    } catch (err: any) {
      ctx.body = [];
    }
  },

  async getAutoTranscript(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    const { academicYearId } = ctx.query;
    if (!academicYearId) return ctx.badRequest('academicYearId is required');
    try {
      const { academicEngine } = require('../../school-admin/services/academic-engine');
      const transcript = await academicEngine.generateTranscriptAuto(user.id, Number(academicYearId));
      ctx.body = transcript;
    } catch (err: any) {
      ctx.status = 500; ctx.body = { error: err.message };
    }
  },

  async getMyAcademicResults(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    const { academicYearId } = ctx.query;
    const filters: any = { student: { id: user.id } };
    if (academicYearId) filters.academicYear = { id: Number(academicYearId) };
    const results = await (strapi.entityService.findMany as any)('api::academic-result.academic-result', {
      filters,
      populate: ['subject', 'semester', 'academicYear', 'classe', 'blueprint'],
      sort: [{ calculatedAt: 'desc' }],
    });
    ctx.body = results || [];
  },

  async getMyPayments(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const payments = await (strapi.entityService.findMany as any)('api::student-payment.student-payment', {
        filters: { student: { id: user.id } },
        populate: ['invoice'],
        sort: [{ paymentDate: 'desc' }],
      });
      ctx.body = payments || [];
    } catch (err: any) {
      strapi.log.error('getMyPayments error:', err);
      ctx.body = [];
    }
  },

  async getMyStatement(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Access denied');
    try {
      const statement = await strapi.service('api::school-finance.school-finance').getStudentStatement(user.id);
      ctx.body = statement;
    } catch (err: any) {
      strapi.log.error('getMyStatement error:', err);
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  },
};
