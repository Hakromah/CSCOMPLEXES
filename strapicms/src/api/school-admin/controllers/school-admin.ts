/**
 * school-admin controller
 * Maps all HTTP endpoints → AdminService methods (replicating Spring Boot AdminController)
 */

export default {
  // ─── Users ─────────────────────────────────────────────────────────
  async getAllUsers(ctx: any) {
    const { role } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllUsers(role);
  },

  async createUser(ctx: any) {
    try {
      ctx.body = await strapi.service('api::school-admin.school-admin').createUser(ctx.request.body);
    } catch (err: any) {
      if (err.name === 'DuplicateEmailError' || err.status === 400) {
        ctx.status = 400;
        ctx.body = { error: { message: err.message } };
      } else {
        throw err; // Re-throw unexpected errors
      }
    }
  },

  async bulkCreateUsers(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').bulkCreateUsers(ctx.request.body);
  },

  async updateUser(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateUser(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteUser(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteUser(Number(ctx.params.id));
    ctx.body = {};
  },

  // ─── Classes ───────────────────────────────────────────────────────
  async getAllClasses(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllClasses();
  },

  async createClass(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createClass(ctx.request.body);
  },

  async updateClass(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateClass(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteClass(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteClass(Number(ctx.params.id));
    ctx.body = {};
  },

  async assignTeacher(ctx: any) {
    const { teacherId, classId } = ctx.request.body;
    await strapi.service('api::school-admin.school-admin').assignTeacherToClass(teacherId, classId);
    ctx.body = {};
  },

  async assignStudent(ctx: any) {
    const { studentId, classId } = ctx.request.body;
    await strapi.service('api::school-admin.school-admin').assignStudentToClass(studentId, classId);
    ctx.body = {};
  },

  async getClassesForStudent(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getClassesForStudent(
      Number(ctx.params.studentId),
    );
  },

  // ─── Subjects ──────────────────────────────────────────────────────
  async getAllSubjects(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllSubjects();
  },

  async createSubject(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createSubject(ctx.request.body);
  },

  async updateSubject(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateSubject(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteSubject(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteSubject(Number(ctx.params.id));
    ctx.body = {};
  },

  // ─── Learning Materials ────────────────────────────────────────────
  async getAllMaterials(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllMaterials();
  },

  async createMaterial(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createMaterial(ctx.request.body);
  },

  async deleteMaterial(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteMaterial(Number(ctx.params.id));
    ctx.body = {};
  },

  async getMaterialAnalytics(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getMaterialAnalytics();
  },

  // ─── Timetables & Scheduling Hub ──────────────────────────────────
  async getAllTimetables(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllTimetables(ctx.query);
  },

  async createTimetable(ctx: any) {
    try {
      ctx.body = await strapi.service('api::school-admin.school-admin').createTimetable(ctx.request.body);
    } catch (err: any) {
      ctx.status = err.status || 400;
      ctx.body = { error: { message: err.message, conflicts: err.conflicts } };
    }
  },

  async updateTimetable(ctx: any) {
    try {
      ctx.body = await strapi.service('api::school-admin.school-admin').updateTimetable(
        Number(ctx.params.id),
        ctx.request.body,
      );
    } catch (err: any) {
      ctx.status = err.status || 400;
      ctx.body = { error: { message: err.message, conflicts: err.conflicts } };
    }
  },

  async deleteTimetable(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteTimetable(Number(ctx.params.id));
    ctx.body = { success: true };
  },

  async validateTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').validateTimetable(ctx.request.body);
  },

  async auditTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').auditTimetable(ctx.request.body || ctx.query);
  },

  async duplicateDay(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').duplicateDay(ctx.request.body);
  },

  async duplicateClass(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').duplicateClass(ctx.request.body);
  },

  async duplicateTerm(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').duplicateTerm(ctx.request.body);
  },

  async publishTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').publishTimetable(ctx.request.body);
  },

  async bulkDeleteTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').bulkDeleteTimetable(ctx.request.body);
  },

  async getTimetableAnalytics(ctx: any) {
    const { academicYearId, semesterId } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').getTimetableAnalytics(
      academicYearId ? Number(academicYearId) : undefined,
      semesterId ? Number(semesterId) : undefined
    );
  },

  // ─── Rooms ──────────────────────────────────────────────────────────
  async getAllRooms(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllRooms(ctx.query);
  },

  async createRoom(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createRoom(ctx.request.body);
  },

  async updateRoom(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateRoom(Number(ctx.params.id), ctx.request.body);
  },

  async deleteRoom(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteRoom(Number(ctx.params.id));
    ctx.body = { success: true };
  },

  // ─── Time Slots ─────────────────────────────────────────────────────
  async getAllTimeSlots(ctx: any) {
    const { academicYearId } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllTimeSlots(
      academicYearId ? Number(academicYearId) : undefined
    );
  },

  async createTimeSlot(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createTimeSlot(ctx.request.body);
  },

  async updateTimeSlot(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateTimeSlot(Number(ctx.params.id), ctx.request.body);
  },

  async deleteTimeSlot(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteTimeSlot(Number(ctx.params.id));
    ctx.body = { success: true };
  },

  // ─── Exams ─────────────────────────────────────────────────────────
  async getExams(ctx: any) {
    const { teacherId, classId } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').getExams({
      teacherId: teacherId ? Number(teacherId) : undefined,
      classId: classId ? Number(classId) : undefined,
    });
  },

  async lockSemesterExams(ctx: any) {
    const semester = ctx.request.body?.semester || ctx.query.semester;
    await strapi.service('api::school-admin.school-admin').lockAllExamsInSemester(semester);
    ctx.body = {};
  },

  // ─── Results & Reports ─────────────────────────────────────────────
  async filterResults(ctx: any) {
    const { studentQuery, classId } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').filterResultsForAdmin(
      studentQuery,
      classId ? Number(classId) : undefined,
    );
  },

  async getSummaryReport(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getSummaryReport();
  },

  async getSemesterGPA(ctx: any) {
    const { studentId, semester } = ctx.query;
    ctx.body = await strapi.service('api::school-admin.school-admin').calculateSemesterGPA(
      Number(studentId),
      semester as string,
    );
  },

  async finalizeSemester(ctx: any) {
    const semester = ctx.query.semester as string;
    await strapi.service('api::school-admin.school-admin').lockSemesterResults(semester);
    ctx.body = { message: `Semester ${semester} has been officially closed.` };
  },

  // ─── Profile & Password ────────────────────────────────────────────
  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-admin.school-admin').updateProfile(
      user.id,
      ctx.request.body,
    );
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-admin.school-admin').changePassword(
      user.id,
      ctx.request.body.currentPassword,
      ctx.request.body.newPassword,
    );
    ctx.body = {};
  },

  async generateTranscript(ctx: any) {
    const { studentId, academicYearId, classId, semesterIds, termIds } = ctx.query;
    
    if (!studentId) {
      ctx.status = 400;
      ctx.body = { message: 'studentId is required' };
      return;
    }

    const parsedStudentId = Number(studentId);
    const parsedAcademicYearId = academicYearId ? Number(academicYearId) : undefined;
    const parsedClassId = classId ? Number(classId) : undefined;
    
    const parseArray = (val: any) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.map(Number);
      return String(val).split(',').map(Number).filter(n => !isNaN(n));
    };
    
    const parsedSemesterIds = parseArray(semesterIds);
    const parsedTermIds = parseArray(termIds);

    ctx.body = await strapi.service('api::school-admin.school-admin').getStudentTranscript(parsedStudentId, {
      academicYearId: parsedAcademicYearId,
      classId: parsedClassId,
      semesterIds: parsedSemesterIds,
      termIds: parsedTermIds
    });
  },

  async getStudentTranscriptsList(ctx: any) {
    const { studentId } = ctx.params;
    if (!studentId) {
      ctx.status = 400;
      ctx.body = { message: 'studentId is required' };
      return;
    }
    const list = await strapi.entityService.findMany('api::transcript.transcript' as any, {
      filters: { student: { id: Number(studentId) } },
      populate: ['academicYear', 'class', 'semesters', 'terms']
    });
    ctx.body = list;
  },

  // ─── Attendance (Admin read/analytics/delete) ─────────────────────────────
  // These routes use auth:false so they must manually verify the JWT + schoolRole

  async getAttendanceSessions(ctx: any) {
    const user = await _verifyAdmin(ctx);
    if (!user) return;
    const { classId, date } = ctx.query;
    try {
      ctx.body = await strapi.service('api::school-admin.school-admin').getAttendanceSessions({
        classId: classId ? Number(classId) : undefined,
        date: date as string,
      });
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  },

  async getAttendanceAnalytics(ctx: any) {
    const user = await _verifyAdmin(ctx);
    if (!user) return;
    try {
      ctx.body = await strapi.service('api::school-admin.school-admin').getAttendanceAnalytics();
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  },

  async deleteAttendanceSession(ctx: any) {
    const user = await _verifyAdmin(ctx);
    if (!user) return;
    try {
      await strapi.service('api::school-admin.school-admin').deleteAttendanceSession(Number(ctx.params.id));
      ctx.body = { message: 'Session deleted' };
    } catch (err: any) {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  },

  async getAllParents(ctx: any) {
    const parents = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters: { schoolRole: 'PARENT' },
      populate: ['familyMemberships'],
    });
    ctx.body = parents;
  },

  async createParent(ctx: any) {
    const crypto = require('crypto');
    try {
      const data = ctx.request.body;
      data.schoolRole = 'PARENT';
      if (!data.userId) {
        data.userId = crypto.randomBytes(6).toString('hex').toUpperCase().substring(0, 12);
      }
      const parent = await strapi.entityService.create('plugin::users-permissions.user' as any, {
        data: {
          ...data,
          provider: 'local',
          confirmed: true,
        },
      }) as any;

      if (data.familyId) {
        const family = await strapi.entityService.findOne('api::family.family' as any, data.familyId, {
          populate: ['parents'],
        }) as any;
        if (family) {
          const parentIds = (family.parents || []).map((p: any) => p.id);
          if (!parentIds.includes(parent.id)) {
            parentIds.push(parent.id);
            await strapi.entityService.update('api::family.family' as any, family.id, {
              data: { parents: parentIds },
            });
          }
        }
      }

      ctx.status = 201;
      ctx.body = parent;
    } catch (err: any) {
      ctx.status = 400;
      ctx.body = { error: { message: err.message } };
    }
  },

  async sendAdminNotification(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { title, body, type, priority, recipientId, actionUrl, metadata } = ctx.request.body;

    const notif = await strapi.entityService.create('api::school-notification.school-notification' as any, {
      data: {
        title,
        body,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        recipient: recipientId,
        sender: user.id,
        isRead: false,
        actionUrl,
        metadata,
      } as any,
    });
    ctx.status = 201;
    ctx.body = notif;
  },

  async broadcastAdminAnnouncement(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'ADMIN') return ctx.unauthorized('Access denied');
    const { title, body, role, type, priority } = ctx.request.body;

    let recipients: any[] = [];
    if (role) {
      recipients = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
        filters: { schoolRole: role },
      }) as any[];
    } else {
      recipients = await strapi.entityService.findMany('plugin::users-permissions.user' as any) as any[];
    }

    const createdNotifications = await Promise.all(
      recipients.map((recipient: any) =>
        strapi.entityService.create('api::school-notification.school-notification' as any, {
          data: {
            title,
            body,
            type: type || 'GENERAL',
            priority: priority || 'NORMAL',
            recipient: recipient.id,
            sender: user.id,
            isRead: false,
          } as any,
        })
      )
    );

    ctx.status = 201;
    ctx.body = { count: createdNotifications.length };
  },

  // ─── Assessment Engine Controller Extensions ──────────────────────────────────
  // Auto-transcript: only needs studentId + academicYearId in query
  async generateTranscriptAuto(ctx: any) {
    const { studentId, academicYearId } = ctx.query;
    if (!studentId || !academicYearId) return ctx.badRequest('studentId and academicYearId are required');
    try {
      const { academicEngine } = require('../services/academic-engine');
      const data = await academicEngine.generateTranscriptAuto(Number(studentId), Number(academicYearId));
      ctx.body = data;
    } catch (err: any) {
      ctx.status = 500; ctx.body = { error: err.message };
    }
  },

  // Assessment Categories CRUD
  async getAssessmentCategories(ctx: any) {
    const items = await (strapi.entityService.findMany as any)('api::assessment-category.assessment-category', { sort: [{ name: 'asc' }] });
    ctx.body = items;
  },
  async createAssessmentCategory(ctx: any) {
    const data = ctx.request.body;
    ctx.body = await (strapi.entityService.create as any)('api::assessment-category.assessment-category', { data });
  },
  async updateAssessmentCategory(ctx: any) {
    const { id } = ctx.params;
    ctx.body = await (strapi.entityService.update as any)('api::assessment-category.assessment-category', id, { data: ctx.request.body });
  },
  async deleteAssessmentCategory(ctx: any) {
    const { id } = ctx.params;
    await (strapi.entityService.delete as any)('api::assessment-category.assessment-category', id);
    ctx.body = { deleted: true };
  },

  // Assessment Blueprints CRUD
  async getAssessmentBlueprints(ctx: any) {
    const { academicYearId, semesterId, classId } = ctx.query;
    const filters: any = {};
    if (academicYearId) filters.academicYear = { id: Number(academicYearId) };
    if (semesterId) filters.semester = { id: Number(semesterId) };
    if (classId) filters.classe = { id: Number(classId) };
    const items = await (strapi.entityService.findMany as any)('api::assessment-blueprint.assessment-blueprint', {
      filters, populate: ['academicYear', 'semester', 'classe', 'subject', 'gradingScheme']
    });
    ctx.body = items;
  },
  async createAssessmentBlueprint(ctx: any) {
    const data = ctx.request.body;
    ctx.body = await (strapi.entityService.create as any)('api::assessment-blueprint.assessment-blueprint', {
      data, populate: ['academicYear', 'semester', 'classe', 'subject', 'gradingScheme']
    });
  },
  async updateAssessmentBlueprint(ctx: any) {
    const { id } = ctx.params;
    ctx.body = await (strapi.entityService.update as any)('api::assessment-blueprint.assessment-blueprint', id, {
      data: ctx.request.body, populate: ['academicYear', 'semester', 'classe', 'subject', 'gradingScheme']
    });
  },
  async deleteAssessmentBlueprint(ctx: any) {
    const { id } = ctx.params;
    await (strapi.entityService.delete as any)('api::assessment-blueprint.assessment-blueprint', id);
    ctx.body = { deleted: true };
  },

  // Grading Schemes CRUD
  async getGradingSchemes(ctx: any) {
    const items = await (strapi.entityService.findMany as any)('api::grading-scheme.grading-scheme', { sort: [{ name: 'asc' }] });
    ctx.body = items;
  },
  async createGradingScheme(ctx: any) {
    ctx.body = await (strapi.entityService.create as any)('api::grading-scheme.grading-scheme', { data: ctx.request.body });
  },
  async updateGradingScheme(ctx: any) {
    ctx.body = await (strapi.entityService.update as any)('api::grading-scheme.grading-scheme', ctx.params.id, { data: ctx.request.body });
  },
  async deleteGradingScheme(ctx: any) {
    await (strapi.entityService.delete as any)('api::grading-scheme.grading-scheme', ctx.params.id);
    ctx.body = { deleted: true };
  },

  // Academic Results (calculated snapshots)
  async getStudentAcademicResults(ctx: any) {
    const { studentId } = ctx.params;
    const { academicYearId } = ctx.query;
    const filters: any = { student: { id: Number(studentId) } };
    if (academicYearId) filters.academicYear = { id: Number(academicYearId) };
    const results = await (strapi.entityService.findMany as any)('api::academic-result.academic-result', {
      filters, populate: ['subject', 'semester', 'academicYear', 'classe', 'blueprint'],
      sort: [{ calculatedAt: 'desc' }]
    });
    ctx.body = results;
  },
  async getClassAcademicResults(ctx: any) {
    const { classId } = ctx.params;
    const { academicYearId, semesterId } = ctx.query;
    const filters: any = { classe: { id: Number(classId) } };
    if (academicYearId) filters.academicYear = { id: Number(academicYearId) };
    if (semesterId) filters.semester = { id: Number(semesterId) };
    const results = await (strapi.entityService.findMany as any)('api::academic-result.academic-result', {
      filters, populate: ['student', 'subject', 'semester', 'academicYear'],
      sort: [{ calculatedAt: 'desc' }]
    });
    ctx.body = results;
  },

  // Recalculate
  async recalculateStudent(ctx: any) {
    const { studentId } = ctx.params;
    const { academicYearId } = ctx.query;
    if (!academicYearId) return ctx.badRequest('academicYearId is required');
    try {
      const { academicEngine } = require('../services/academic-engine');
      const result = await academicEngine.recalculateStudent(Number(studentId), Number(academicYearId));
      ctx.body = { success: true, ...result };
    } catch (err: any) {
      ctx.status = 500; ctx.body = { error: err.message };
    }
  },
  async recalculateClass(ctx: any) {
    const { classId } = ctx.params;
    const { academicYearId } = ctx.query;
    if (!academicYearId) return ctx.badRequest('academicYearId is required');
    try {
      const { academicEngine } = require('../services/academic-engine');
      const cls = await (strapi.entityService.findOne as any)('api::school-class.school-class', classId, { populate: ['students'] }) as any;
      const students = cls?.students || [];
      let totalUpdated = 0;
      for (const s of students) {
        const r = await academicEngine.recalculateStudent(s.id, Number(academicYearId));
        totalUpdated += r.updated;
      }
      ctx.body = { success: true, studentsProcessed: students.length, totalUpdated };
    } catch (err: any) {
      ctx.status = 500; ctx.body = { error: err.message };
    }
  },

  // Dynamic Gradebook
  async getDynamicGradebook(ctx: any) {
    const { classId } = ctx.params;
    const { subjectId, semesterId } = ctx.query;
    try {
      const { academicEngine } = require('../services/academic-engine');
      const data = await academicEngine.getDynamicGradebook(Number(classId), subjectId ? Number(subjectId) : undefined, semesterId ? Number(semesterId) : undefined);
      ctx.body = data;
    } catch (err: any) {
      ctx.status = 500; ctx.body = { error: err.message };
    }
  },

  // Academic Years
  async getAllAcademicYears(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllAcademicYears();
  },
  async createAcademicYear(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createAcademicYear(ctx.request.body);
  },
  async updateAcademicYear(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateAcademicYear(Number(ctx.params.id), ctx.request.body);
  },
  async deleteAcademicYear(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteAcademicYear(Number(ctx.params.id));
    ctx.body = { success: true };
  },

    // Academic Periods (semesters with new fields)
  async getAcademicPeriods(ctx: any) {
    const { academicYearId } = ctx.query;
    const filters: any = {};
    if (academicYearId) filters.academicYear = { id: Number(academicYearId) };
    const periods = await (strapi.entityService.findMany as any)('api::semester.semester', {
      filters, populate: ['academicYear', 'terms'], sort: [{ order: 'asc' }]
    });
    ctx.body = periods;
  },
  async createAcademicPeriod(ctx: any) {
    ctx.body = await (strapi.entityService.create as any)('api::semester.semester', { data: ctx.request.body, populate: ['academicYear'] });
  },
  async updateAcademicPeriod(ctx: any) {
    ctx.body = await (strapi.entityService.update as any)('api::semester.semester', ctx.params.id, { data: ctx.request.body, populate: ['academicYear'] });
  },
  async deleteAcademicPeriod(ctx: any) {
    await (strapi.entityService.delete as any)('api::semester.semester', ctx.params.id);
    ctx.body = { deleted: true };
  },
};

// ─── Helper: verify admin from JWT (for auth:false routes) ────────────────
async function _verifyAdmin(ctx: any): Promise<any | null> {
  try {
    const authHeader = ctx.request.header?.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: no token provided' };
      return null;
    }
    const jwtService = strapi.plugin('users-permissions').service('jwt');
    const decoded = await jwtService.verify(token);
    if (!decoded?.id) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: invalid token' };
      return null;
    }
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user', decoded.id
    ) as any;
    if (!user || user.schoolRole !== 'ADMIN') {
      ctx.status = 403;
      ctx.body = { error: 'Forbidden: ADMIN role required' };
      return null;
    }
    return user;
  } catch (err: any) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized: ' + err.message };
    return null;
  }
}
