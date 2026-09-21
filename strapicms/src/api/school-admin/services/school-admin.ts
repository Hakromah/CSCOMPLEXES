import timetableEngine from './timetable-engine';
/**
 * school-admin service
 * Replicates all AdminService + AdminMaterialService logic from Spring Boot
 */

import { generateUserId } from '../utils/userId';

export default () => ({

  // ─── User Management ─────────────────────────────────────────────

  async getAllUsers(role?: string) {
    const filters: any = {};
    if (role) filters.schoolRole = role.toUpperCase();
    return strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters,
      fields: ['id', 'userId', 'username', 'email', 'schoolRole', 'birthDate',
        'birthCountry', 'birthCity', 'address', 'gender', 'phoneNumber', 'createdAt'] as any,
    });
  },

  async createUser(data: any) {
    const firstName = data.firstName || data.name?.split(' ')[0] || 'X';
    const lastName  = data.lastName  || data.name?.split(' ').slice(1).join(' ') || 'X';

    const userId = data.userId || await generateUserId(firstName, lastName);

    // ── Email uniqueness guard ──────────────────────────────────────────────
    if (data.email) {
      const existing = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
        filters: { email: data.email.trim().toLowerCase() } as any,
      }) as any[];
      if (existing.length > 0) {
        const err: any = new Error(
          `Email "${data.email}" is already registered. Each user must have a unique email address.`
        );
        err.status = 400;
        err.name   = 'DuplicateEmailError';
        throw err;
      }
    }

    const defaultRoles = await strapi.entityService.findMany('plugin::users-permissions.role' as any, {
      filters: { type: 'authenticated' },
    }) as any[];

    // Use the email prefix as username — email is already unique, so this prevents
    // the "attribute must be unique" error when two users share the same full name.
    const username = data.email.trim().toLowerCase().split('@')[0];
    const schoolRole = data.role || data.schoolRole || 'STUDENT';

    // Remove the frontend 'name' and 'role' fields to prevent DB conflict
    const cleanData = { ...data };
    delete cleanData.name;
    delete cleanData.role;

    // Provide plain-text password; Strapi's users-permissions beforeCreate hook hashes it automatically!
    return await strapi.entityService.create('plugin::users-permissions.user' as any, {
      data: {
        ...cleanData,
        email: data.email.trim().toLowerCase(),
        username,
        firstName,
        lastName,
        schoolRole,
        userId,
        password: data.password,
        provider: 'local',
        role: defaultRoles[0]?.id,
        confirmed: true,
      },
    });
  },

  async bulkCreateUsers(users: any[]) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const u of users) {
      try {
        const existing = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
          filters: { email: u.email } as any,
        });
        if ((existing as any[]).length > 0) { skipped++; continue; }
        await this.createUser(u);
        imported++;
      } catch (e: any) {
        errors.push(u.email + ': ' + e.message);
        skipped++;
      }
    }
    return { imported, skipped, errors };
  },

  async updateUser(id: number, data: any) {
    const cleanData = { ...data };
    const username = data.name || data.username;
    if (username) cleanData.username = username;
    const schoolRole = data.role || data.schoolRole;
    if (schoolRole) cleanData.schoolRole = schoolRole;
    
    delete cleanData.name;
    delete cleanData.role;

    // Strapi's beforeUpdate hook automatically hashes cleanData.password if present

    return strapi.entityService.update('plugin::users-permissions.user' as any, id, { data: cleanData });
  },

  async deleteUser(id: number) {
    return strapi.entityService.delete('plugin::users-permissions.user', id);
  },

  // ─── Class Management ─────────────────────────────────────────────

  async getAllClasses() {
    return strapi.entityService.findMany('api::school-class.school-class', {
      populate: ['teachers', 'students', 'academicYear'],
    });
  },

  async createClass(data: any) {
    return strapi.entityService.create('api::school-class.school-class', { data });
  },

  async updateClass(id: number, data: any) {
    return strapi.entityService.update('api::school-class.school-class', id, { data });
  },

  async deleteClass(id: number) {
    return strapi.entityService.delete('api::school-class.school-class', id);
  },

  async assignTeacherToClass(teacherId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['teachers'],
    }) as any;
    const existingTeacherIds = (cls?.teachers || []).map((t: any) => t.id);
    const alreadyAssigned = existingTeacherIds.includes(Number(teacherId));
    if (!alreadyAssigned) {
      try {
        await strapi.entityService.update('api::school-class.school-class' as any, classId, {
          data: { teachers: [...existingTeacherIds, Number(teacherId)] as any },
        });
      } catch {
        const knex = strapi.db.connection;
        await knex('school_classes_teachers_lnk').insert({
          school_class_id: Number(classId),
          user_id: Number(teacherId),
        });
      }
    }
    return { alreadyAssigned };
  },

  async assignStudentToClass(studentId: number, classId: number) {
    const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
      populate: ['students'],
    }) as any;
    const existingStudentIds = (cls?.students || []).map((s: any) => s.id);
    const alreadyAssigned = existingStudentIds.includes(Number(studentId));
    if (!alreadyAssigned) {
      try {
        await strapi.entityService.update('api::school-class.school-class' as any, classId, {
          data: { students: [...existingStudentIds, Number(studentId)] as any },
        });
      } catch {
        const knex = strapi.db.connection;
        await knex('school_classes_students_lnk').insert({
          school_class_id: Number(classId),
          user_id: Number(studentId),
        });
      }
    }
    return { alreadyAssigned };
  },

  async getClassesForStudent(studentId: number) {
    try {
      const allClasses = await strapi.entityService.findMany('api::school-class.school-class', {
        populate: ['teachers', 'students'],
      }) as any[];
      return (allClasses || []).filter((cls: any) =>
        (cls.students || []).some((s: any) => s.id === Number(studentId))
      );
    } catch {
      const knex = strapi.db.connection;
      const classRows = await knex('school_classes as sc')
        .join('school_classes_students_lnk as lnk', 'lnk.school_class_id', 'sc.id')
        .where('lnk.user_id', Number(studentId))
        .select('sc.id', 'sc.name', 'sc.grade');
      return classRows;
    }
  },

  async getClassesForTeacher(teacherId: number) {
    try {
      const allClasses = await strapi.entityService.findMany('api::school-class.school-class', {
        populate: ['teachers', 'students'],
      }) as any[];
      return (allClasses || []).filter((cls: any) =>
        (cls.teachers || []).some((t: any) => t.id === Number(teacherId))
      );
    } catch {
      const knex = strapi.db.connection;
      const classRows = await knex('school_classes as sc')
        .join('school_classes_teachers_lnk as lnk', 'lnk.school_class_id', 'sc.id')
        .where('lnk.user_id', Number(teacherId))
        .select('sc.id', 'sc.name', 'sc.grade');
      return classRows;
    }
  },

  async unassignTeacherFromClass(teacherId: number, classId: number) {
    try {
      const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
        populate: ['teachers'],
      }) as any;
      if (cls && cls.teachers) {
        const remainingTeachers = cls.teachers
          .filter((t: any) => t.id !== Number(teacherId))
          .map((t: any) => t.id);
        await strapi.entityService.update('api::school-class.school-class' as any, classId, {
          data: { teachers: remainingTeachers as any },
        });
      }
    } catch {
      const knex = strapi.db.connection;
      await knex('school_classes_teachers_lnk')
        .where({ school_class_id: Number(classId), user_id: Number(teacherId) })
        .del();
    }
  },

  async unassignStudentFromClass(studentId: number, classId: number) {
    try {
      const cls = await strapi.entityService.findOne('api::school-class.school-class', classId, {
        populate: ['students'],
      }) as any;
      if (cls && cls.students) {
        const remainingStudents = cls.students
          .filter((s: any) => s.id !== Number(studentId))
          .map((s: any) => s.id);
        await strapi.entityService.update('api::school-class.school-class' as any, classId, {
          data: { students: remainingStudents as any },
        });
      }
    } catch {
      const knex = strapi.db.connection;
      await knex('school_classes_students_lnk')
        .where({ school_class_id: Number(classId), user_id: Number(studentId) })
        .del();
    }
  },

  // ─── Subject Management ───────────────────────────────────────────

  async getAllSubjects() {
    return strapi.entityService.findMany('api::subject.subject');
  },

  async createSubject(data: any) {
    return strapi.entityService.create('api::subject.subject', { data });
  },

  async updateSubject(id: number, data: any) {
    return strapi.entityService.update('api::subject.subject', id, { data });
  },

  async deleteSubject(id: number) {
    return strapi.entityService.delete('api::subject.subject', id);
  },

  // ─── Learning Materials ───────────────────────────────────────────

  async getAllMaterials() {
    return strapi.entityService.findMany('api::learning-material.learning-material', {
      populate: ['classe', 'subject', 'uploadedBy', 'file'],
    });
  },

  async createMaterial(data: any) {
    const payload = {
      ...data,
      classe: data.classe?.id || data.classe,
      subject: data.subject?.id || data.subject,
    };
    return strapi.entityService.create('api::learning-material.learning-material', { data: payload });
  },

  async deleteMaterial(id: number) {
    return strapi.entityService.delete('api::learning-material.learning-material', id);
  },

  async getMaterialAnalytics() {
    const classes = await strapi.entityService.findMany('api::school-class.school-class') as any[];
    const materials = await strapi.entityService.findMany('api::learning-material.learning-material', { populate: ['classe'] }) as any[];
    
    return classes.map(c => {
      const count = materials.filter(m => m.classe?.id === c.id).length;
      return { className: c.name, downloads: count };
    });
  },

  // ─── Timetable & Scheduling Management ──────────────────────────────

  async getAllTimetables(filters?: any) {
    const f: any = {};
    if (filters?.academicYearId) f.academicYear = { id: Number(filters.academicYearId) };
    if (filters?.semesterId) f.semester = { id: Number(filters.semesterId) };
    if (filters?.classId) f.classe = { id: Number(filters.classId) };
    if (filters?.teacherId) f.teacher = { id: Number(filters.teacherId) };
    if (filters?.roomId) f.room = { id: Number(filters.roomId) };
    if (filters?.status) f.status = filters.status;
    if (filters?.dayOfWeek) f.dayOfWeek = filters.dayOfWeek;

    return (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: f,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
      sort: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  },

  async createTimetable(data: any) {
    const { timetableEngine } = require('./timetable-engine');
    const allEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: { dayOfWeek: data.dayOfWeek },
      populate: ['classe', 'subject', 'teacher', 'room'],
    }) as any[];

    const classeId = data.classe?.id || (typeof data.classe === 'number' ? data.classe : (data.classId ? Number(data.classId) : null));
    const subjectId = data.subject?.id || (typeof data.subject === 'number' ? data.subject : (data.subjectId ? Number(data.subjectId) : null));
    const teacherId = data.teacher?.id || (typeof data.teacher === 'number' ? data.teacher : (data.teacherId ? Number(data.teacherId) : null));
    const roomId = data.room?.id || (typeof data.room === 'number' ? data.room : (data.roomId ? Number(data.roomId) : null));
    const academicYearId = data.academicYear?.id || (typeof data.academicYear === 'number' ? data.academicYear : (data.academicYearId ? Number(data.academicYearId) : null));
    const semesterId = data.semester?.id || (typeof data.semester === 'number' ? data.semester : (data.semesterId ? Number(data.semesterId) : null));

    const check = timetableEngine.detectConflicts({
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      classId: classeId,
      teacherId,
      roomId,
    }, allEntries);

    if (check.hasConflict && !data.overrideConflicts && !data.force) {
      const err: any = new Error('Conflit détecté');
      err.status = 409;
      err.conflicts = check.conflicts;
      throw err;
    }

    return (strapi.entityService.create as any)('api::timetable-entry.timetable-entry', {
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        roomName: data.roomName || null,
        periodName: data.periodName || null,
        lessonType: data.lessonType || 'REGULAR',
        status: data.status || 'PUBLISHED',
        notes: data.notes || null,
        ...(classeId ? { classe: { connect: [{ id: classeId }] } } : {}),
        ...(subjectId ? { subject: { connect: [{ id: subjectId }] } } : {}),
        ...(teacherId ? { teacher: { connect: [{ id: teacherId }] } } : {}),
        ...(roomId ? { room: { connect: [{ id: roomId }] } } : {}),
        ...(academicYearId ? { academicYear: { connect: [{ id: academicYearId }] } } : {}),
        ...(semesterId ? { semester: { connect: [{ id: semesterId }] } } : {}),
      } as any,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
    });
  },

  async updateTimetable(id: number, data: any) {
    const { timetableEngine } = require('./timetable-engine');
    const allEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: { dayOfWeek: data.dayOfWeek },
      populate: ['classe', 'subject', 'teacher', 'room'],
    }) as any[];

    const classeId = data.classe?.id || (typeof data.classe === 'number' ? data.classe : (data.classId ? Number(data.classId) : undefined));
    const subjectId = data.subject?.id || (typeof data.subject === 'number' ? data.subject : (data.subjectId ? Number(data.subjectId) : undefined));
    const teacherId = data.teacher?.id || (typeof data.teacher === 'number' ? data.teacher : (data.teacherId ? Number(data.teacherId) : undefined));
    const roomId = data.room?.id || (typeof data.room === 'number' ? data.room : (data.roomId ? Number(data.roomId) : undefined));
    const academicYearId = data.academicYear?.id || (typeof data.academicYear === 'number' ? data.academicYear : (data.academicYearId ? Number(data.academicYearId) : undefined));
    const semesterId = data.semester?.id || (typeof data.semester === 'number' ? data.semester : (data.semesterId ? Number(data.semesterId) : undefined));

    const check = timetableEngine.detectConflicts({
      id,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      classId: classeId,
      teacherId,
      roomId,
    }, allEntries, id);

    if (check.hasConflict && !data.overrideConflicts && !data.force) {
      const err: any = new Error('Conflit détecté');
      err.status = 409;
      err.conflicts = check.conflicts;
      throw err;
    }

    const payload: any = {
      ...(data.dayOfWeek ? { dayOfWeek: data.dayOfWeek } : {}),
      ...(data.startTime ? { startTime: data.startTime } : {}),
      ...(data.endTime ? { endTime: data.endTime } : {}),
      ...(data.roomName !== undefined ? { roomName: data.roomName } : {}),
      ...(data.periodName !== undefined ? { periodName: data.periodName } : {}),
      ...(data.lessonType !== undefined ? { lessonType: data.lessonType } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    };

    if (classeId !== undefined) payload.classe = classeId ? { set: [{ id: classeId }] } : { set: [] };
    if (subjectId !== undefined) payload.subject = subjectId ? { set: [{ id: subjectId }] } : { set: [] };
    if (teacherId !== undefined) payload.teacher = teacherId ? { set: [{ id: teacherId }] } : { set: [] };
    if (roomId !== undefined) payload.room = roomId ? { set: [{ id: roomId }] } : { set: [] };
    if (academicYearId !== undefined) payload.academicYear = academicYearId ? { set: [{ id: academicYearId }] } : { set: [] };
    if (semesterId !== undefined) payload.semester = semesterId ? { set: [{ id: semesterId }] } : { set: [] };

    return (strapi.entityService.update as any)('api::timetable-entry.timetable-entry', id, {
      data: payload,
      populate: ['classe', 'subject', 'teacher', 'room', 'academicYear', 'semester'],
    });
  },

  async deleteTimetable(id: number) {
    return (strapi.entityService.delete as any)('api::timetable-entry.timetable-entry', id);
  },

  async validateTimetable(data: any) {
    const { timetableEngine } = require('./timetable-engine');
    const allEntries = await (strapi.entityService.findMany as any)('api::timetable-entry.timetable-entry', {
      filters: { dayOfWeek: data.dayOfWeek },
      populate: ['classe', 'subject', 'teacher', 'room'],
    }) as any[];

    return timetableEngine.detectConflicts(data, allEntries, data.id);
  },

  async auditTimetable(filters: any) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.auditTimetable(filters || {});
  },

  async duplicateDay(params: any) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.duplicateDay(params);
  },

  async duplicateClass(params: any) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.duplicateClass(params);
  },

  async duplicateTerm(params: any) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.duplicateTerm(params);
  },

  async publishTimetable(params: any) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.publishTimetable(params);
  },

  async bulkDeleteTimetable(params: any) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.bulkDelete(params);
  },

  async getTimetableAnalytics(academicYearId?: number, semesterId?: number) {
    const { timetableEngine } = require('./timetable-engine');
    return timetableEngine.getTimetableAnalytics(academicYearId, semesterId);
  },

  // ─── Room Management ───────────────────────────────────────────────

  async getAllRooms(filters?: any) {
    const f: any = {};
    if (filters?.isActive !== undefined) f.isActive = filters.isActive === 'true' || filters.isActive === true;
    if (filters?.roomType) f.roomType = filters.roomType;
    return (strapi.entityService.findMany as any)('api::school-room.school-room', {
      filters: f,
      sort: [{ name: 'asc' }],
    });
  },

  async createRoom(data: any) {
    return (strapi.entityService.create as any)('api::school-room.school-room', { data });
  },

  async updateRoom(id: number, data: any) {
    return (strapi.entityService.update as any)('api::school-room.school-room', id, { data });
  },

  async deleteRoom(id: number) {
    return (strapi.entityService.delete as any)('api::school-room.school-room', id);
  },

  // ─── Time Slot Management ──────────────────────────────────────────

  async getAllTimeSlots(academicYearId?: number) {
    const f: any = {};
    if (academicYearId) f.academicYear = { id: academicYearId };
    return (strapi.entityService.findMany as any)('api::time-slot.time-slot', {
      filters: f,
      sort: [{ order: 'asc' }, { startTime: 'asc' }],
    });
  },

  async createTimeSlot(data: any) {
    return (strapi.entityService.create as any)('api::time-slot.time-slot', { data });
  },

  async updateTimeSlot(id: number, data: any) {
    return (strapi.entityService.update as any)('api::time-slot.time-slot', id, { data });
  },

  async deleteTimeSlot(id: number) {
    return (strapi.entityService.delete as any)('api::time-slot.time-slot', id);
  },

  // ─── Exam Management ──────────────────────────────────────────────

  async getExams(filters: { teacherId?: number; classId?: number }) {
    const f: any = {};
    if (filters.teacherId) f.teacher = { id: filters.teacherId };
    if (filters.classId) f.classe = { id: filters.classId };
    return strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: f,
      populate: ['classe', 'teacher', 'subject'],
    });
  },

  async lockAllExamsInSemester(semester: string) {
    const exams = await strapi.entityService.findMany('api::school-exam.school-exam', {
      filters: { semester },
    }) as any[];

    await Promise.all(exams.map((e) =>
      strapi.entityService.update('api::school-exam.school-exam', e.id, {
        data: { locked: true, closed: true },
      })
    ));
  },

  // ─── Results & GPA ────────────────────────────────────────────────

  async filterResultsForAdmin(studentQuery?: string, classId?: number) {
    const filters: any = {};
    if (classId) filters.exam = { classe: { id: classId } };

    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters,
      populate: ['exam', 'exam.classe', 'exam.subject', 'student'],
    }) as any[];

    if (studentQuery) {
      const q = studentQuery.toLowerCase();
      return results.filter((r) =>
        r.student?.username?.toLowerCase().includes(q) ||
        r.student?.email?.toLowerCase().includes(q) ||
        r.student?.userId?.toLowerCase().includes(q)
      );
    }
    return results;
  },

  async calculateSemesterGPA(studentId: number, semester: string) {
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { student: { id: studentId }, exam: { semester }, status: 'SUBMITTED' },
      populate: ['exam'],
    }) as any[];

    if (!results.length) return { studentId, semester, gpa: 0, totalCredits: 0, results: [] };

    let totalWeightedMarks = 0;
    let totalWeight = 0;
    for (const r of results) {
      const weight = r.exam?.weight || 1;
      totalWeightedMarks += (r.marks || 0) * weight;
      totalWeight += weight;
    }

    const gpa = totalWeight > 0 ? (totalWeightedMarks / totalWeight / 25) : 0; // scale to 4.0

    return {
      studentId,
      semester,
      gpa: Math.min(4.0, parseFloat(gpa.toFixed(2))),
      totalCredits: totalWeight,
      results: results.map((r) => ({
        examId: r.exam?.id,
        examName: r.exam?.name,
        marks: r.marks,
        letterGrade: r.letterGrade,
        weight: r.exam?.weight,
      })),
    };
  },

  async lockSemesterResults(semester: string) {
    await this.lockAllExamsInSemester(semester);
    // Also mark all submitted results as graded
    const results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: { exam: { semester }, status: 'SUBMITTED' },
    }) as any[];

    await Promise.all(results.map((r) =>
      strapi.entityService.update('api::exam-result.exam-result', r.id, {
        data: { status: 'GRADED' },
      })
    ));
  },

  // ─── Summary Report ───────────────────────────────────────────────

  async getSummaryReport() {
    const [students, teachers, admins, classes, subjects, exams] = await Promise.all([
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'STUDENT' },
      }),
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'TEACHER' },
      }),
      strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { schoolRole: 'ADMIN' },
      }),
      strapi.entityService.findMany('api::school-class.school-class'),
      strapi.entityService.findMany('api::subject.subject'),
      strapi.entityService.findMany('api::school-exam.school-exam'),
    ]);

    return {
      totalStudents: (students as any[]).length,
      totalTeachers: (teachers as any[]).length,
      totalAdmins: (admins as any[]).length,
      totalClasses: (classes as any[]).length,
      totalSubjects: (subjects as any[]).length,
      totalExams: (exams as any[]).length,
    };
  },

  // ─── Profile & Password ───────────────────────────────────────────

  async updateProfile(userId: number, payload: Record<string, string>) {
    return strapi.entityService.update('plugin::users-permissions.user', userId, {
      data: {
        username: payload.name || payload.username,
        email: payload.email,
        birthDate: payload.birthDate,
        birthCountry: payload.birthCountry,
        birthCity: payload.birthCity,
        address: payload.address,
        gender: payload.gender as any,
        phoneNumber: payload.phoneNumber,
      },
    });
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId) as any;
    const isMatch = await strapi.plugin('users-permissions')
      .service('user').validatePassword(currentPassword, user.password);

    if (!isMatch) throw new Error('Current password is incorrect');

    const hashed = await strapi.plugin('users-permissions')
      .service('user').hashPassword({ password: newPassword });

    await strapi.entityService.update('plugin::users-permissions.user' as any, userId, {
      data: { password: hashed } as any,
    });
  },

  async getStudentTranscript(studentId: number, filters: {
    academicYearId?: number;
    classId?: number;
    semesterIds?: number[];
    termIds?: number[];
  }, saveToLedger: boolean = false) {
    // 1. Fetch Student details
    const student = await strapi.entityService.findOne('plugin::users-permissions.user' as any, studentId, {
      fields: ['id', 'userId', 'username', 'email', 'birthDate', 'phoneNumber'] as any,
      populate: ['enrolledClasses'] as any
    }) as any;
    if (!student) throw new Error('Student not found');

    // 2. Fetch School / Institutional Details (Contact Info + Navbar)
    let schoolInfo = { name: '2CS COMPLEXES', address: '', email: '', phone: '' };
    try {
      const contactInfo = await strapi.entityService.findMany('api::contact-info.contact-info' as any, {
        populate: ['phones', 'email'] as any
      }) as any;

      const realContact = Array.isArray(contactInfo) ? contactInfo[0] : contactInfo;
      if (realContact) {
        schoolInfo.address = realContact.address || '';
        schoolInfo.phone = realContact.phones?.[0]?.phones || '';
        schoolInfo.email = realContact.email?.[0]?.address || '';
      }

      const navbar = await strapi.entityService.findMany('api::navbar.navbar' as any) as any;
      const realNavbar = Array.isArray(navbar) ? navbar[0] : navbar;
      if (realNavbar) {
        schoolInfo.name = realNavbar.title || schoolInfo.name;
      }
    } catch (e) {
      // Ignore if not found, fall back
    }

    // 3. Query Exam Results
    const queryFilters: any = {
      student: { id: studentId }
    };

    const examFilters: any = {};
    if (filters.academicYearId) examFilters.academicYear = { id: filters.academicYearId };
    if (filters.classId) examFilters.classe = { id: filters.classId };
    if (filters.semesterIds && filters.semesterIds.length > 0) examFilters.semesterRel = { id: { $in: filters.semesterIds } };
    if (filters.termIds && filters.termIds.length > 0) examFilters.termRel = { id: { $in: filters.termIds } };

    if (Object.keys(examFilters).length > 0) {
      queryFilters.exam = examFilters;
    }

    let results = await strapi.entityService.findMany('api::exam-result.exam-result', {
      filters: queryFilters,
      populate: {
        exam: {
          populate: ['subject', 'classe', 'academicYear', 'semesterRel', 'termRel']
        }
      } as any
    }) as any[];

    // Fallback: If class filter was specified but yielded no results, query without class filter
    if ((!results || results.length === 0) && filters.classId) {
      const fallbackExamFilters = { ...examFilters };
      delete fallbackExamFilters.classe;
      const fallbackQueryFilters: any = { student: { id: studentId } };
      if (Object.keys(fallbackExamFilters).length > 0) {
        fallbackQueryFilters.exam = fallbackExamFilters;
      }
      results = await strapi.entityService.findMany('api::exam-result.exam-result', {
        filters: fallbackQueryFilters,
        populate: {
          exam: {
            populate: ['subject', 'classe', 'academicYear', 'semesterRel', 'termRel']
          }
        } as any
      }) as any[];
    }

    // 4. Map results
    const scoreToGrade = (score: number) => {
      if (score >= 90) return { letter: 'A', remark: 'Excellent' };
      if (score >= 85) return { letter: 'A-', remark: 'Tres Bien' };
      if (score >= 80) return { letter: 'B+', remark: 'Bien' };
      if (score >= 75) return { letter: 'B', remark: 'Assez Bien' };
      if (score >= 70) return { letter: 'B-', remark: 'Satisfaisant' };
      if (score >= 65) return { letter: 'C+', remark: 'Passable' };
      if (score >= 60) return { letter: 'C', remark: 'Passable' };
      if (score >= 50) return { letter: 'D', remark: 'Insuffisant' };
      return { letter: 'F', remark: 'Echec' };
    };

    const transcriptResults = (results || []).map(r => {
      const scoreVal = r.marks != null ? Number(r.marks) : (r.rawScore != null ? Number(r.rawScore) : null);
      const gradeInfo = scoreVal != null ? scoreToGrade(scoreVal) : { letter: 'N/A', remark: '' };
      return {
        id: r.id,
        examId: r.exam?.id,
        examName: r.exam?.name || 'Assessment',
        subjectCode: r.exam?.subject?.code || 'N/A',
        subjectName: r.exam?.subject?.name || 'N/A',
        className: r.exam?.classe?.name || (student.enrolledClasses || []).map((c: any) => c.name).join(', ') || 'N/A',
        academicYear: r.exam?.academicYear?.name || r.exam?.academicYear?.year || 'N/A',
        semester: r.exam?.semesterRel?.name || r.exam?.semester || 'N/A',
        term: r.exam?.termRel?.name || r.exam?.term || 'N/A',
        marks: scoreVal,
        letterGrade: r.letterGrade || gradeInfo.letter,
        weight: Number(r.exam?.weight || 0),
        remarks: r.remarks || gradeInfo.remark
      };
    });

    // 5. Calculate GPA and Average
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalScore = 0;
    let scoreCount = 0;

    // standard GPA mapping on a 4.0 scale
    const scoreToGPA = (score: number) => {
      if (score >= 90) return 4.0;
      if (score >= 85) return 3.7;
      if (score >= 80) return 3.3;
      if (score >= 75) return 3.0;
      if (score >= 70) return 2.7;
      if (score >= 65) return 2.3;
      if (score >= 60) return 2.0;
      if (score >= 50) return 1.0;
      return 0.0;
    };

    let totalGPA = 0;
    for (const r of transcriptResults) {
      if (r.marks != null && !isNaN(r.marks)) {
        const w = r.weight > 0 ? r.weight : 1;
        totalWeightedScore += r.marks * w;
        totalWeight += w;
        totalScore += r.marks;
        totalGPA += scoreToGPA(r.marks);
        scoreCount++;
      }
    }

    const averageScore = scoreCount > 0 ? parseFloat((totalScore / scoreCount).toFixed(2)) : 0;
    const weightedAverageScore = totalWeight > 0 ? parseFloat((totalWeightedScore / totalWeight).toFixed(2)) : 0;
    const gpa = scoreCount > 0 ? parseFloat((totalGPA / scoreCount).toFixed(2)) : 0;

    // Save/Update in DB dynamically ONLY if saveToLedger is true
    const sortedSemesterIds = (filters.semesterIds || []).slice().sort((a: number, b: number) => a - b).join(',');
    const sortedTermIds = (filters.termIds || []).slice().sort((a: number, b: number) => a - b).join(',');
    const crypto = require('crypto');
    const hashInput = `${studentId}-${filters.academicYearId || 'all'}-${filters.classId || 'all'}-${sortedSemesterIds}-${sortedTermIds}`;
    const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8).toUpperCase();
    const referenceNumber = `TR-${student.userId || student.id}-${hash}`;
    const generationDate = new Date().toISOString(); // ISO datetime
    const friendlyDate = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    if (saveToLedger) {
      try {
        const existing = await strapi.entityService.findMany('api::transcript.transcript' as any, {
          filters: { referenceNumber }
        }) as any[];

        const transcriptPayload: any = {
          referenceNumber,
          generationDate,
          gpa: gpa,
          averageScore: weightedAverageScore,
          student: studentId,
          academicYear: filters.academicYearId || null,
          class: filters.classId || null,
          semesters: filters.semesterIds || [],
          terms: filters.termIds || []
        };

        if (existing.length > 0) {
          await strapi.entityService.update('api::transcript.transcript' as any, existing[0].id, {
            data: transcriptPayload as any
          });
        } else {
          await strapi.entityService.create('api::transcript.transcript' as any, {
            data: transcriptPayload as any
          });
        }
      } catch (dbError) {
        strapi.log.error('Failed to save transcript to registry database:', dbError);
      }
    }

    return {
      student: {
        id: student.id,
        userId: student.userId,
        name: student.username,
        email: student.email,
        birthDate: student.birthDate,
        phoneNumber: student.phoneNumber,
        classes: (student.enrolledClasses || []).map((c: any) => c.name)
      },
      school: schoolInfo,
      results: transcriptResults,
      summary: {
        averageScore,
        weightedAverageScore,
        annualAverage: weightedAverageScore,
        gpa,
        annualGPA: gpa,
        totalSubjectsCount: scoreCount,
        totalSubjects: scoreCount
      },
      metadata: {
        referenceNumber,
        generationDate: friendlyDate,
        academicYears: Array.from(new Set(transcriptResults.map(r => r.academicYear))),
        semesters: Array.from(new Set(transcriptResults.map(r => r.semester))),
        terms: Array.from(new Set(transcriptResults.map(r => r.term)))
      }
    };
  },

  // ─── Attendance (Admin) ──────────────────────────────────────────────────

  async getAttendanceSessions({ classId, date }: { classId?: number; date?: string }) {
    const filters: any = {};
    if (classId) filters.classe = { id: classId };
    if (date)    filters.date = date;

    const sessions = await (strapi.entityService.findMany as any)('api::attendance-session.attendance-session', {
      filters,
      populate: ['classe', 'subject', 'records', 'records.student'],
      sort: [{ date: 'desc' }],
    }) as any[];

    return sessions.map((s) => {
      const records = s.records || [];
      const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
      const lateCount    = records.filter((r: any) => r.status === 'LATE').length;
      return {
        id:           s.id,
        date:         s.date,
        sessionTime:  s.sessionTime || null,
        subjectName:  s.subject?.name || null,
        notes:        s.notes || null,
        className:    s.classe?.name || 'N/A',
        classId:      s.classe?.id,
        totalCount:   records.length,
        presentCount,
        lateCount,
        absentCount:  records.filter((r: any) => r.status === 'ABSENT').length,
        excusedCount: records.filter((r: any) => r.status === 'EXCUSED' || r.status === 'SICK').length,
        attendanceRate: records.length > 0
          ? Math.round(((presentCount + lateCount) / records.length) * 100)
          : 0,
        records: records.map((r: any) => ({
          studentId:   r.student?.id,
          studentName: r.student?.username || r.student?.name,
          userId:      r.student?.userId,
          status:      r.status,
        })),
      };
    });
  },

  async getAttendanceAnalytics() {
    const records = await strapi.entityService.findMany('api::attendance-record.attendance-record' as any, {
      populate: ['student', 'session', 'session.classe'],
    }) as any[];

    const totalRecords  = records.length;
    const presentCount  = records.filter((r: any) => r.status === 'PRESENT').length;
    const absentCount   = records.filter((r: any) => r.status === 'ABSENT').length;
    const lateCount     = records.filter((r: any) => r.status === 'LATE').length;
    const excusedCount  = records.filter((r: any) => r.status === 'EXCUSED' || r.status === 'SICK').length;
    const overallRate   = totalRecords > 0 ? Math.round(((presentCount + lateCount) / totalRecords) * 100) : 0;

    // Per-class breakdown
    const classMap = new Map<string, { name: string; total: number; present: number; late: number }>();
    for (const r of records) {
      const clsName = r.session?.classe?.name || 'Unknown';
      if (!classMap.has(clsName)) classMap.set(clsName, { name: clsName, total: 0, present: 0, late: 0 });
      const entry = classMap.get(clsName)!;
      entry.total++;
      if (r.status === 'PRESENT') entry.present++;
      if (r.status === 'LATE') entry.late++;
    }

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      overallRate,
      byClass: Array.from(classMap.values()).map(c => ({
        ...c,
        rate: c.total > 0 ? Math.round(((c.present + c.late) / c.total) * 100) : 0,
      })),
    };
  },

  async deleteAttendanceSession(sessionId: number) {
    // Cascade delete all records first
    const records = await strapi.entityService.findMany('api::attendance-record.attendance-record', {
      filters: { session: { id: sessionId } },
    }) as any[];
    await Promise.all(records.map((r: any) =>
      strapi.entityService.delete('api::attendance-record.attendance-record', r.id)
    ));
    return strapi.entityService.delete('api::attendance-session.attendance-session', sessionId);
  },

  // ─── Certificates ─────────────────────────────────────────────────────────

  async getAllCertificates() {
    const list = await strapi.entityService.findMany('api::certificate.certificate' as any, {
      sort: { createdAt: 'desc' },
      populate: ['recipientUser'],
    }) as any[];
    return (list || []).map((c: any) => ({
      ...c,
      status: (c.certStatus === 'Revoque' || c.status === 'Révoqué' || c.status === 'Revoque') ? 'Révoqué' : 'Valide',
      certStatus: (c.certStatus === 'Revoque' || c.status === 'Révoqué' || c.status === 'Revoque') ? 'Revoque' : 'Valide',
    }));
  },

  async createCertificate(data: any) {
    // Find recipientUser by userId string or id if provided
    let recipientUserId: number | undefined;
    if (data.recipientUserId) {
      const users = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
        filters: { id: data.recipientUserId } as any,
      }) as any[];
      if (users.length > 0) recipientUserId = users[0].id;
    }

    const created = await strapi.entityService.create('api::certificate.certificate' as any, {
      data: {
        serialNumber:     data.serialNumber,
        studentName:      data.studentName,
        studentUserId:    data.studentUserId,
        certificateType:  data.certificateType,
        programme:        data.programme,
        issueDate:        data.issueDate,
        verificationHash: data.verificationHash,
        certStatus:       'Valide',
        mention:          data.mention,
        gpa:              data.gpa,
        maxGpa:           data.maxGpa,
        totalCredits:     data.totalCredits,
        classRank:        data.classRank,
        className:        data.className,
        issuedByRole:     data.issuedByRole || 'ADMIN',
        note:             data.note,
        ...(recipientUserId ? { recipientUser: recipientUserId } : {}),
      } as any,
    }) as any;

    return {
      ...created,
      status: 'Valide',
      certStatus: 'Valide',
    };
  },

  async revokeCertificate(id: number) {
    const updated = await strapi.entityService.update('api::certificate.certificate' as any, id, {
      data: { certStatus: 'Revoque' } as any,
    }) as any;
    return {
      ...updated,
      status: 'Révoqué',
      certStatus: 'Revoque',
    };
  },

  async getCertificateTypes() {
    return strapi.entityService.findMany('api::certificate-type.certificate-type' as any, {
      sort: { displayOrder: 'asc', name: 'asc' },
    });
  },

  async getCertificateMentions() {
    return strapi.entityService.findMany('api::certificate-mention.certificate-mention' as any, {
      sort: { displayOrder: 'asc', name: 'asc' },
    });
  },

  async getMyCertificates(userId: number) {
    // 1. Fetch the user details
    const users = await strapi.entityService.findMany('plugin::users-permissions.user' as any, {
      filters: { id: userId } as any,
      fields: ['id', 'userId', 'firstName', 'lastName', 'username', 'schoolRole'] as any,
    }) as any[];
    if (!users.length) return [];
    const user = users[0];

    const targetUserIds: number[] = [user.id];
    const targetStudentUserIds: string[] = [
      (user.userId || '').toLowerCase(),
      (user.username || '').toLowerCase()
    ].filter(Boolean);
    const targetNames: string[] = [
      (user.firstName && user.lastName) ? (user.firstName + ' ' + user.lastName).toLowerCase() : '',
      (user.username || '').toLowerCase()
    ].filter(s => s.length > 2);

    // If PARENT, add all children from their family
    if (user.schoolRole === 'PARENT') {
      try {
        const families = await strapi.db.query('api::family.family').findMany({
          where: { parents: { id: user.id }, isActive: true },
          populate: ['students'],
        }) as any[];
        const children = families.flatMap((f: any) => f.students || []);
        for (const child of children) {
          if (child.id) targetUserIds.push(child.id);
          if (child.userId) targetStudentUserIds.push(child.userId.toLowerCase());
          if (child.username) targetStudentUserIds.push(child.username.toLowerCase());
          const childFullName = (child.firstName && child.lastName)
            ? (child.firstName + ' ' + child.lastName).toLowerCase()
            : (child.username || '').toLowerCase();
          if (childFullName && childFullName.length > 2) targetNames.push(childFullName);
        }
      } catch (err) {
        strapi.log.error('Failed to load parent family children:', err);
      }
    }

    // 2. Fetch all certificates with recipientUser
    const all = await strapi.entityService.findMany('api::certificate.certificate' as any, {
      sort: { createdAt: 'desc' },
      populate: ['recipientUser'],
    }) as any[];

    // 3. Filter and normalize status
    return (all || []).filter((c: any) => {
      const rId = c.recipientUser?.id;
      const cUserId = (c.studentUserId || '').toLowerCase();
      const cName = (c.studentName || '').toLowerCase();

      const matchesRecipient = rId ? targetUserIds.includes(rId) : false;
      const matchesUserId = targetStudentUserIds.some(uid => uid && (cUserId === uid || cUserId.includes(uid)));
      const matchesName = targetNames.some(name => name && (cName.includes(name) || name.includes(cName)));

      return matchesRecipient || matchesUserId || matchesName;
    }).map((c: any) => ({
      ...c,
      status: (c.certStatus === 'Revoque' || c.status === 'Révoqué' || c.status === 'Revoque') ? 'Révoqué' : 'Valide',
      certStatus: (c.certStatus === 'Revoque' || c.status === 'Révoqué' || c.status === 'Revoque') ? 'Revoque' : 'Valide',
    }));
  },

});
