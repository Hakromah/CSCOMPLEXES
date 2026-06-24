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
    if (!user || user.schoolRole !== 'STUDENT') return ctx.unauthorized('Access denied');
    const invoices = await strapi.entityService.findMany('api::student-invoice.student-invoice' as any, {
      filters: { student: { id: user.id } },
      populate: ['items'],
      sort: [{ dueDate: 'desc' }],
    });
    ctx.body = invoices;
  },

  async getMyBalance(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'STUDENT') return ctx.unauthorized('Access denied');
    const invoices = await strapi.entityService.findMany('api::student-invoice.student-invoice' as any, {
      filters: { student: { id: user.id } },
    }) as any[];
    
    const totalCharged = invoices.reduce((sum, inv) => sum + Number(inv.subtotal || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.totalPaid || 0), 0);
    const outstandingBalance = Math.max(0, totalCharged - totalPaid);
    ctx.body = { totalCharged, totalPaid, outstandingBalance, currency: invoices[0]?.currency || 'GNF' };
  },

  async getMyTransport(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'STUDENT') return ctx.unauthorized('Access denied');
    const assignments = await strapi.entityService.findMany('api::transport-assignment.transport-assignment' as any, {
      filters: { student: { id: user.id }, isActive: true },
      populate: ['driver'],
    });
    ctx.body = assignments[0] || null;
  },

  async getMyEvents(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'STUDENT') return ctx.unauthorized('Access denied');
    
    // Find student's class
    const classes = await strapi.entityService.findMany('api::school-class.school-class' as any, {
      filters: { students: { id: user.id } },
    }) as any[];
    const classIds = classes.map(c => c.id);

    const events = await strapi.entityService.findMany('api::school-event.school-event' as any, {
      filters: {
        $or: [
          { targetAudience: 'ALL' },
          { targetAudience: 'STUDENTS' },
          {
            $and: [
              { targetAudience: 'CLASS' },
              { targetClass: { id: { $in: classIds } } }
            ]
          }
        ],
        isPublished: true,
      },
      sort: [{ startDate: 'asc' }],
    });
    ctx.body = events;
  },

  async getMyNotifications(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'STUDENT') return ctx.unauthorized('Access denied');
    const notifications = await strapi.entityService.findMany('api::school-notification.school-notification' as any, {
      filters: { recipient: { id: user.id } },
      sort: [{ createdAt: 'desc' }],
    });
    ctx.body = notifications;
  },
};
