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

  // ─── Timetables ────────────────────────────────────────────────────
  async getAllTimetables(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').getAllTimetables();
  },

  async createTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').createTimetable(ctx.request.body);
  },

  async updateTimetable(ctx: any) {
    ctx.body = await strapi.service('api::school-admin.school-admin').updateTimetable(
      Number(ctx.params.id),
      ctx.request.body,
    );
  },

  async deleteTimetable(ctx: any) {
    await strapi.service('api::school-admin.school-admin').deleteTimetable(Number(ctx.params.id));
    ctx.body = {};
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
