/**
 * school-parent controller
 * All parent portal endpoints — strict family-level isolation enforced.
 */

async function _verifyParentAccess(user: any, studentId: number): Promise<any> {
  if (!user || user.schoolRole !== 'PARENT') {
    throw { status: 401, message: 'Access denied' };
  }
  const families = await strapi.db.query('api::family.family').findMany({
    where: {
      parents: { id: user.id },
      students: { id: studentId },
      isActive: true,
    },
    populate: ['students', 'parents'],
  });
  if (!families.length) {
    throw { status: 403, message: 'Student not in your family' };
  }
  return families[0];
}

export default {
  // ─── Profile ──────────────────────────────────────────────────────────
  async getProfile(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const profile = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      select: ['id', 'userId', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'address', 'gender', 'birthDate', 'schoolRole'],
    });
    ctx.body = profile;
  },

  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const { firstName, lastName, phoneNumber, address } = ctx.request.body;
    const updated = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
      data: { firstName, lastName, phoneNumber, address },
    });
    ctx.body = updated;
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const { currentPassword, newPassword } = ctx.request.body;
    if (!currentPassword || !newPassword) {
      ctx.status = 400;
      return (ctx.body = { error: 'currentPassword and newPassword required' });
    }
    const validPassword = await strapi.service('plugin::users-permissions.user').validatePassword(currentPassword, user.password);
    if (!validPassword) {
      ctx.status = 400;
      return (ctx.body = { error: { message: 'Current password is incorrect' } });
    }
    await strapi.service('plugin::users-permissions.user').edit(user.id, { password: newPassword });
    ctx.body = { message: 'Password updated successfully' };
  },

  // ─── Family ───────────────────────────────────────────────────────────
  async getFamily(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, isActive: true },
      populate: ['parents', 'students'],
    });
    ctx.body = families[0] || null;
  },

  // ─── Children ─────────────────────────────────────────────────────────
  async getChildren(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, isActive: true },
      populate: ['students'],
    }) as any[];
    const students = families.flatMap((f: any) => f.students || []);
    const uniqueStudents = students.filter((s: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === s.id) === i);
    if (!uniqueStudents.length) {
      ctx.body = [];
      return;
    }
    const enriched = await Promise.all(
      uniqueStudents.map(async (s: any) => {
        const fullStudent = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { id: s.id },
          select: ['id', 'userId', 'username', 'email', 'firstName', 'lastName', 'gender', 'birthDate', 'schoolRole'],
          populate: ['enrolledClasses'],
        }) as any;
        return fullStudent;
      })
    );
    ctx.body = enriched;
  },

  async getChildProfile(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const student = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: Number(ctx.params.id) },
      select: ['id', 'userId', 'username', 'email', 'firstName', 'lastName', 'gender', 'birthDate', 'address', 'phoneNumber', 'schoolRole'],
      populate: ['enrolledClasses'],
    }) as any;
    if (!student) return ctx.notFound('Student not found');
    // Enrich with class details
    const classes = await strapi.db.query('api::school-class.school-class').findMany({
      where: { students: { id: student.id } },
      populate: ['teachers', 'academicYear'],
    });
    ctx.body = { ...student, classes };
  },

  // ─── Attendance ───────────────────────────────────────────────────────
  async getChildAttendance(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const { month, year } = ctx.query;
    const where: any = { student: { id: Number(ctx.params.id) } };
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
      where.session = { date: { $gte: startDate, $lte: endDate } };
    }
    const records = await strapi.db.query('api::attendance-record.attendance-record').findMany({
      where,
      populate: ['session', 'session.subject'],
    }) as any[];
    
    // Sort in memory instead of database order by
    records.sort((a, b) => {
      const dateA = new Date(a.session?.date || 0).getTime();
      const dateB = new Date(b.session?.date || 0).getTime();
      return dateB - dateA;
    });

    const summary = {
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      excused: records.filter(r => r.status === 'EXCUSED').length,
      sick: records.filter(r => r.status === 'SICK').length,
      total: records.length,
      presentPercent: records.length > 0 ? Math.round((records.filter(r => r.status === 'PRESENT').length / records.length) * 100) : 0,
    };
    ctx.body = { records, summary };
  },

  async getChildResults(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const results = await strapi.db.query('api::exam-result.exam-result').findMany({
      where: { student: { id: Number(ctx.params.id) }, status: { $ne: 'DRAFT' } },
      populate: ['exam', 'exam.subject', 'exam.classe'],
      orderBy: { createdAt: 'desc' },
    });
    ctx.body = results;
  },

  // ─── Exams ────────────────────────────────────────────────────────────
  async getChildExams(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const classes = await strapi.db.query('api::school-class.school-class').findMany({
      where: { students: { id: Number(ctx.params.id) } },
      select: ['id'],
    }) as any[];
    const classIds = classes.map((c: any) => c.id);
    if (!classIds.length) { ctx.body = []; return; }
    const exams = await strapi.db.query('api::school-exam.school-exam').findMany({
      where: { classe: { id: { $in: classIds } } },
      populate: ['subject', 'classe', 'academicYear'],
      orderBy: { date: 'asc' },
    });
    ctx.body = exams;
  },

  // ─── Timetable ────────────────────────────────────────────────────────
  async getChildTimetable(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const classes = await strapi.db.query('api::school-class.school-class').findMany({
      where: { students: { id: Number(ctx.params.id) } },
      select: ['id'],
    }) as any[];
    const classIds = classes.map((c: any) => c.id);
    if (!classIds.length) { ctx.body = []; return; }
    const entries = await strapi.db.query('api::timetable-entry.timetable-entry').findMany({
      where: { classe: { id: { $in: classIds } } },
      populate: ['subject', 'classe', 'teacher'],
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    ctx.body = entries;
  },

  // ─── Materials ────────────────────────────────────────────────────────
  async getChildMaterials(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const classes = await strapi.db.query('api::school-class.school-class').findMany({
      where: { students: { id: Number(ctx.params.id) } },
      select: ['id'],
    }) as any[];
    const classIds = classes.map((c: any) => c.id);
    if (!classIds.length) { ctx.body = []; return; }
    const materials = await strapi.db.query('api::learning-material.learning-material').findMany({
      where: { classe: { id: { $in: classIds } } },
      populate: ['subject', 'uploadedBy'],
      orderBy: { createdAt: 'desc' },
    });
    ctx.body = materials;
  },

  // ─── Transcripts ──────────────────────────────────────────────────────
  async getChildTranscripts(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.id)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const transcripts = await strapi.db.query('api::transcript.transcript').findMany({
      where: { student: { id: Number(ctx.params.id) } },
      populate: ['academicYear', 'class'],
      orderBy: { generationDate: 'desc' },
    });
    ctx.body = transcripts;
  },

  // ─── Finance ──────────────────────────────────────────────────────────
  async getFamilyFinance(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, isActive: true },
      populate: ['students'],
    }) as any[];
    if (!families.length) { ctx.body = { totalCharged: 0, totalPaid: 0, totalOutstanding: 0, children: [] }; return; }
    const students = families.flatMap((f: any) => f.students || []);
    const unique = students.filter((s: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === s.id) === i);
    const childrenData = await Promise.all(
      unique.map(async (s: any) => {
        const invoices = await strapi.db.query('api::student-invoice.student-invoice').findMany({
          where: { student: { id: s.id } },
          orderBy: { createdAt: 'desc' },
        }) as any[];
        const totalCharged = invoices.reduce((sum: number, inv: any) => sum + (inv.subtotal || 0), 0);
        const totalPaid = invoices.reduce((sum: number, inv: any) => sum + (inv.totalPaid || 0), 0);
        return { student: s, totalCharged, totalPaid, outstandingBalance: totalCharged - totalPaid, invoices };
      })
    );
    ctx.body = {
      totalCharged: childrenData.reduce((s, c) => s + c.totalCharged, 0),
      totalPaid: childrenData.reduce((s, c) => s + c.totalPaid, 0),
      totalOutstanding: childrenData.reduce((s, c) => s + c.outstandingBalance, 0),
      children: childrenData,
    };
  },

  async getChildFinance(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.studentId)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    const invoices = await strapi.db.query('api::student-invoice.student-invoice').findMany({
      where: { student: { id: Number(ctx.params.studentId) } },
      orderBy: { createdAt: 'desc' },
    }) as any[];
    const payments = await strapi.db.query('api::student-payment.student-payment').findMany({
      where: { student: { id: Number(ctx.params.studentId) } },
      populate: ['invoice'],
      orderBy: { paymentDate: 'desc' },
    }) as any[];
    const totalCharged = invoices.reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
    const totalPaid = invoices.reduce((s: number, i: any) => s + (i.totalPaid || 0), 0);
    ctx.body = { invoices, payments, totalCharged, totalPaid, outstandingBalance: totalCharged - totalPaid };
  },

  async getChildInvoices(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.studentId)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    ctx.body = await strapi.db.query('api::student-invoice.student-invoice').findMany({
      where: { student: { id: Number(ctx.params.studentId) } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getChildPayments(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    try { await _verifyParentAccess(user, Number(ctx.params.studentId)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }
    ctx.body = await strapi.db.query('api::student-payment.student-payment').findMany({
      where: { student: { id: Number(ctx.params.studentId) } },
      populate: ['invoice'],
      orderBy: { paymentDate: 'desc' },
    });
  },

  // ─── Calendar ─────────────────────────────────────────────────────────
  async getCalendar(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const { month, year } = ctx.query;
    const where: any = { isPublished: true, targetAudience: { $in: ['ALL', 'PARENTS'] } };
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();
      where.startDate = { $gte: start, $lte: end };
    }
    ctx.body = await strapi.db.query('api::school-event.school-event').findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  },

  // ─── Dashboard ────────────────────────────────────────────────────────
  async getDashboardStats(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const families = await strapi.db.query('api::family.family').findMany({
      where: { parents: { id: user.id }, isActive: true },
      populate: ['students'],
    }) as any[];
    const students = families.flatMap((f: any) => f.students || []);
    const unique = students.filter((s: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === s.id) === i);
    let outstandingBalance = 0;
    for (const s of unique) {
      const invs = await strapi.db.query('api::student-invoice.student-invoice').findMany({
        where: { student: { id: s.id }, status: { $in: ['APPROVED', 'PARTIALLY_PAID'] } },
        select: ['remainingBalance'],
      }) as any[];
      outstandingBalance += invs.reduce((sum: number, inv: any) => sum + (inv.remainingBalance || 0), 0);
    }
    const unreadNotifications = await strapi.db.query('api::school-notification.school-notification').count({
      where: { recipient: { id: user.id }, isRead: false },
    });
    let upcomingExams = 0;
    for (const s of unique) {
      const classes = await strapi.db.query('api::school-class.school-class').findMany({
        where: { students: { id: s.id } }, select: ['id'],
      }) as any[];
      const classIds = classes.map((c: any) => c.id);
      if (classIds.length) {
        const examCount = await strapi.db.query('api::school-exam.school-exam').count({
          where: { classe: { id: { $in: classIds } }, date: { $gte: new Date().toISOString().split('T')[0] }, closed: false },
        });
        upcomingExams += examCount;
      }
    }
    ctx.body = {
      totalChildren: unique.length,
      outstandingBalance,
      unreadNotifications,
      upcomingExams,
      children: unique.map((s: any) => ({ id: s.id, username: s.username, firstName: s.firstName, lastName: s.lastName })),
    };
  },

  async previewChildTranscript(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'PARENT') return ctx.unauthorized('Access denied');
    const { studentId, id } = ctx.params;
    try { await _verifyParentAccess(user, Number(studentId)); } catch (e: any) { ctx.status = e.status; return (ctx.body = { error: e.message }); }

    // Fetch the transcript record to verify ownership
    const transcript = await strapi.db.query('api::transcript.transcript').findOne({
      where: { id: Number(id) },
      populate: ['student', 'academicYear', 'class', 'semesters', 'terms']
    }) as any;

    if (!transcript) {
      return ctx.notFound('Transcript not found');
    }

    if (transcript.student?.id !== Number(studentId)) {
      return ctx.forbidden('Unauthorized access to this transcript');
    }

    // Call the getStudentTranscript service to load details dynamically
    const filters = {
      academicYearId: transcript.academicYear?.id,
      semesterIds: (transcript.semesters || []).map((s: any) => s.id),
      termIds: (transcript.terms || []).map((t: any) => t.id)
    };

    ctx.body = await strapi.service('api::school-admin.school-admin').getStudentTranscript(Number(studentId), filters);
  },
};
