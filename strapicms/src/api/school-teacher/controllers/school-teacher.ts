/**
 * school-teacher controller
 */

export default {
  async getMyClasses(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getClassesByTeacher(user.id);
  },

  async getStudentsByClass(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getStudentsByClass(
      user.id, Number(ctx.params.classId)
    );
  },

  async getMyStudents(ctx: any) {
    const user = ctx.state.user;
    const { classId } = ctx.query;
    if (classId) {
      ctx.body = await strapi.service('api::school-teacher.school-teacher').getStudentsByClass(user.id, Number(classId));
    } else {
      ctx.body = await strapi.service('api::school-teacher.school-teacher').getStudentsByTeacher(user.id);
    }
  },

  async submitAttendance(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').submitAttendance(ctx.request.body);
    ctx.body = {};
  },

  async updateAttendance(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').updateAttendance(
      Number(ctx.params.attendanceId), ctx.request.body
    );
    ctx.body = {};
  },

  async getAttendanceHistory(ctx: any) {
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getAttendanceHistory(
      Number(ctx.params.classId)
    );
  },

  async getSubjectsByClass(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getSubjectsByClass(
      user.id,
      Number(ctx.params.classId)
    );
  },

  async createExam(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').createExam(user.id, ctx.request.body);
  },

  async getMyExams(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getExamsByTeacher(user.id);
  },

  async updateExam(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').updateExam(
      Number(ctx.params.id), ctx.request.body, user.id
    );
  },

  async deleteExam(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').deleteExam(Number(ctx.params.id), user.id);
    ctx.body = {};
  },

  async toggleExamStatus(ctx: any) {
    const { closed } = ctx.request.body;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').toggleExamStatus(
      Number(ctx.params.id), Boolean(closed)
    );
  },

  async getGradebook(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getGradebookByClass(
      user.id, Number(ctx.params.classId)
    );
  },

  async saveBulkResults(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').saveBulkResults(user.id, ctx.request.body);
    ctx.body = { message: 'Bulk marks saved successfully' };
  },

  async createResult(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').saveResult(user.id, ctx.request.body);
  },

  async updateResult(ctx: any) {
    ctx.body = await strapi.service('api::school-teacher.school-teacher').updateResult(
      Number(ctx.params.id), ctx.request.body
    );
  },

  async submitResults(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').submitResults(ctx.request.body);
    ctx.body = {};
  },

  async getResults(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getResultsByTeacher(user.id);
  },

  async filterResults(ctx: any) {
    const { classId, studentId } = ctx.query;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').filterResults(
      classId ? Number(classId) : undefined, studentId as string
    );
  },

  async submitMarks(ctx: any) {
    await strapi.service('api::school-teacher.school-teacher').submitMarks(ctx.request.body);
    ctx.body = {};
  },

  async getMyTimetable(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getTeacherTimetable(user.id);
  },

  async getAllSubjects(ctx: any) {
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getAllSubjects();
  },

  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').updateProfile(user.id, ctx.request.body);
  },

  async changePassword(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').changePassword(
      user.id, ctx.request.body.currentPassword, ctx.request.body.newPassword
    );
    ctx.body = {};
  },

  async getTeacherMaterials(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getTeacherMaterials(user.id);
  },

  async getMyClassesForMaterials(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').getClassesByTeacher(user.id);
  },

  async uploadTeacherMaterial(ctx: any) {
    const user = ctx.state.user;
    ctx.body = await strapi.service('api::school-teacher.school-teacher').uploadTeacherMaterial(
      user.id, 
      ctx.request.body, 
      ctx.request.files
    );
  },

  async deleteTeacherMaterial(ctx: any) {
    const user = ctx.state.user;
    await strapi.service('api::school-teacher.school-teacher').deleteTeacherMaterial(user.id, Number(ctx.params.id));
    ctx.body = { message: 'Deleted' };
  },

  async getStudentTranscriptsList(ctx: any) {
    const user = ctx.state.user;
    const { studentId } = ctx.params;
    
    if (!studentId) {
      ctx.status = 400;
      ctx.body = { message: 'studentId is required' };
      return;
    }

    const parsedStudentId = Number(studentId);

    // Verify teacher is authorized to manage this student
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: {
        teachers: { id: user.id },
        students: { id: parsedStudentId }
      }
    }) as any[];

    if (classes.length === 0) {
      return ctx.forbidden('You are not authorized to view transcripts for this student');
    }

    const list = await strapi.entityService.findMany('api::transcript.transcript' as any, {
      filters: { student: { id: parsedStudentId } },
      populate: ['academicYear', 'class', 'semesters', 'terms']
    });
    ctx.body = list;
  },

  async previewTranscript(ctx: any) {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const transcript = await strapi.entityService.findOne('api::transcript.transcript' as any, id, {
      populate: ['student', 'academicYear', 'class', 'semesters', 'terms']
    }) as any;

    if (!transcript) {
      return ctx.notFound('Transcript not found');
    }

    const studentId = transcript.student?.id;
    if (!studentId) {
      return ctx.badRequest('Transcript student record is missing');
    }

    // Verify teacher is authorized to manage this student
    const classes = await strapi.entityService.findMany('api::school-class.school-class', {
      filters: {
        teachers: { id: user.id },
        students: { id: studentId }
      }
    }) as any[];

    if (classes.length === 0) {
      return ctx.forbidden('You are not authorized to view this transcript');
    }

    const filters = {
      academicYearId: transcript.academicYear?.id || undefined,
      classId: transcript.class?.id || undefined,
      semesterIds: transcript.semesters?.map((s: any) => s.id) || [],
      termIds: transcript.terms?.map((t: any) => t.id) || []
    };

    ctx.body = await strapi.service('api::school-admin.school-admin').getStudentTranscript(studentId, filters);
  },

  async getMySalary(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'TEACHER') return ctx.unauthorized('Access denied');
    const records = await strapi.entityService.findMany('api::salary-record.salary-record' as any, {
      filters: { staff: { id: user.id } },
      sort: [{ year: 'desc' }, { month: 'desc' }],
    });
    ctx.body = records;
  },

  async getMyEvents(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'TEACHER') return ctx.unauthorized('Access denied');
    const events = await strapi.entityService.findMany('api::school-event.school-event' as any, {
      filters: {
        $or: [
          { targetAudience: 'ALL' },
          { targetAudience: 'STAFF' },
        ],
        isPublished: true,
      },
      sort: [{ startDate: 'asc' }],
    });
    ctx.body = events;
  },

  async getMyNotifications(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'TEACHER') return ctx.unauthorized('Access denied');
    const notifications = await strapi.entityService.findMany('api::school-notification.school-notification' as any, {
      filters: { recipient: { id: user.id } },
      sort: [{ createdAt: 'desc' }],
    });
    ctx.body = notifications;
  },

  async importAttendanceCsv(ctx: any) {
    const user = ctx.state.user;
    if (!user || user.schoolRole !== 'TEACHER') return ctx.unauthorized('Access denied');
    const { classId, date, sessionTime, subjectId, notes, records } = ctx.request.body;
    
    if (!classId || !date || !records || !Array.isArray(records)) {
      ctx.status = 400;
      return (ctx.body = { error: 'classId, date, and records array are required' });
    }

    // Verify this teacher belongs to this class
    const cls = await strapi.entityService.findOne('api::school-class.school-class' as any, classId, {
      populate: ['teachers'],
    }) as any;
    if (!cls) return ctx.notFound('Class not found');
    const isTeacher = (cls.teachers || []).some((t: any) => t.id === user.id);
    if (!isTeacher) return ctx.forbidden('Unauthorized: not your class');

    await strapi.service('api::school-teacher.school-teacher').submitAttendance({
      classId: Number(classId),
      date,
      sessionTime,
      subjectId: subjectId ? Number(subjectId) : undefined,
      notes,
      records: records.map((r: any) => ({
        studentId: Number(r.studentId),
        status: r.status,
      })),
    });

    ctx.body = { message: 'Attendance imported successfully' };
  },
};
